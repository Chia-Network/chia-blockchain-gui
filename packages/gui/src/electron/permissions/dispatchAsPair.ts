import crypto from 'node:crypto';

import type { BrowserWindow } from 'electron';
import JSONbig from 'json-bigint';

import { WcError, WcErrorCode } from '../../@types/WcError';
import { applyDefaults, getCommandByWc, resolveDispatch, validateDappParams } from '../constants/commandRegistry';
import type { ConfirmProps } from '../dialogs/Confirm/Confirm';
import { renderConfirm } from '../dialogs/Confirm/renderConfirm';
import toCamelCase from '../utils/toCamelCase';
import toSnakeCase from '../utils/toSnakeCase';
import { sendDappAndAwait } from '../utils/webSocketBridge';

import { captureBypassFromConfirmResult } from './bypassCapture';
import { defaultDispatchDaemon, getDappHandler } from './dappHandlers';
import { getPair, upsertPair } from './pairStore';
import { resolvePermission } from './permissions';
import type { PairRecord, Principal } from './types';

export type DispatchAsPairFingerprint = {
  requested: number;
  current?: number;
  requestedLabel?: string;
  currentLabel?: string;
};

export type DispatchAsPairInput = {
  wcCommand: string;
  data: Record<string, unknown>;
  topic: string;
  mainnet: boolean;
  fingerprint?: DispatchAsPairFingerprint;
  networkPrefix?: string;
  /** Required for handlers that emit IPC events (e.g. showNotification). */
  mainWindow: BrowserWindow;
  /** Caller has already passed `checkPairAccess`. */
  pair: PairRecord;
};

export type DispatchConfirmProps = Omit<ConfirmProps, 'confirmId' | 'styleURL' | 'isDarkMode'>;

export type OpenConfirm = (
  props: DispatchConfirmProps,
  options: { title: string; width: number; height: number },
) => Promise<true | false | Record<string, unknown> | undefined>;

export type DispatchAsPairDeps = {
  openConfirm: OpenConfirm;
  resolvePermission?: typeof resolvePermission;
  renderConfirm?: typeof renderConfirm;
  captureBypassFromConfirmResult?: typeof captureBypassFromConfirmResult;
  sendDappAndAwait?: typeof sendDappAndAwait;
  requestId?: () => string;
  getDappHandler?: typeof getDappHandler;
  dispatchDaemon?: typeof defaultDispatchDaemon;
};

export async function dispatchDaemonCommandAsPair(
  input: DispatchAsPairInput,
  deps: DispatchAsPairDeps,
): Promise<{ data: Record<string, unknown> }> {
  const { wcCommand, data, topic, mainnet, fingerprint, networkPrefix, mainWindow, pair } = input;

  const entry = getCommandByWc(wcCommand);
  if (!entry) {
    throw new WcError(`unknown wc command: ${wcCommand}`, WcErrorCode.METHOD_NOT_FOUND);
  }

  // Snake-case before any field read so case-folding can't dodge the gate.
  const snakeData = toSnakeCase(data) as Record<string, unknown>;

  // chia dapps include `fingerprint` in `params` as a routing field. Schemas
  // that take it as a real RPC param (chia_logIn, chia_getPublicKey) declare
  // it explicitly; for everything else it would just be a stray key that
  // `validateDappParams` would reject. Strip it on the non-declaring path so
  // those calls don't fail with "param not allowed for dapp: fingerprint".
  // Matches legacy `prepareWalletConnectCommand`, which filtered `values`
  // down to the schema-declared params.
  const declaresFingerprint = entry.schema.params.some((p) => p.name === 'fingerprint');
  if (!declaresFingerprint) {
    delete snakeData.fingerprint;
  }

  validateDappParams(wcCommand, snakeData);

  const principal: Principal = { kind: 'pair', topic };
  const permission = deps.resolvePermission ?? resolvePermission;
  const nsCommand = entry.nsCommand;
  const decision = await permission(principal, nsCommand, snakeData, {
    wcCommand,
    fingerprint: fingerprint?.requested,
    mainnet,
  });
  if (decision.kind === 'deny') {
    throw new WcError(decision.reason, decision.code);
  }

  if (decision.kind === 'prompt') {
    const render = deps.renderConfirm ?? renderConfirm;
    const rendered = await render(nsCommand, snakeData, { networkPrefix });
    const result = await deps.openConfirm(
      {
        networkPrefix,
        command: nsCommand,
        data: snakeData,
        title: rendered.title,
        message: rendered.message,
        confirmLabel: rendered.confirmLabel,
        destructive: rendered.destructive,
        rows: rendered.rows,
        display: rendered.display,
        principal: decision.pair
          ? {
              kind: 'pair' as const,
              name: decision.pair.name,
              url: decision.pair.url,
              icon: decision.pair.icon,
              description: decision.pair.description,
            }
          : undefined,
        fingerprint,
        showBypassToggle: !!decision.pair,
      },
      {
        title: rendered.title,
        width: 640,
        height: 600,
      },
    );
    if (result === false || result === undefined) {
      throw new WcError('Operation cancelled by user', WcErrorCode.USER_REJECTED);
    }
    const capture = deps.captureBypassFromConfirmResult ?? captureBypassFromConfirmResult;
    capture(result, { topic, wcCommand }, { getPair, upsertPair });
  }
  // Auto-approved spends defer their `decision.commit()` until after a
  // successful dispatch — committing early would let a hostile dapp drain
  // the user's allowance with daemon-rejected requests. Idempotent commits
  // (`consumed` flag) protect against double-charge.

  const dispatchDaemon = deps.dispatchDaemon ?? defaultDispatchDaemon;
  const handlerLookup = deps.getDappHandler ?? getDappHandler;

  if (entry.handlerKey) {
    const handler = handlerLookup(entry.handlerKey);
    if (!handler) {
      throw new WcError(`no handler registered for ${entry.handlerKey}`, WcErrorCode.INTERNAL_ERROR);
    }
    const out = await handler({
      data: snakeData,
      pair,
      mainnet,
      fingerprint: fingerprint ? { requested: fingerprint.requested, current: fingerprint.current } : undefined,
      mainWindow,
      networkPrefix,
      dispatchDaemon,
    });
    if (decision.kind === 'allow') decision.commit();
    return out;
  }

  const { destination, command } = resolveDispatch(wcCommand);

  const requestId = deps.requestId?.() ?? crypto.randomBytes(32).toString('hex');
  const wireData = applyDefaults(wcCommand, snakeData);
  const wire = {
    origin: 'wallet_ui',
    destination,
    command,
    data: wireData,
    ack: false,
    request_id: requestId,
  };
  const json = JSONbig.stringify(toSnakeCase(wire));
  const send = deps.sendDappAndAwait ?? sendDappAndAwait;
  const response = (await send(requestId, json)) as {
    data?: { error?: unknown; [k: string]: unknown };
  };

  // Daemon application errors come back as response data (JSON-RPC transport
  // errors throw upstream). Throw so the WC client rejects the dapp's
  // request — silently returning the error envelope would let the dapp see
  // `{ error, success: false }` as a successful payload and act on missing
  // fields. Don't debit the allowance: an attacker could otherwise drain it
  // with daemon-rejectable requests.
  if (response?.data?.error) {
    throw new WcError(String(response.data.error), WcErrorCode.INTERNAL_ERROR);
  }

  if (decision.kind === 'allow') {
    decision.commit();
  }

  const camel = toCamelCase(response?.data ?? {}) as Record<string, unknown>;
  // Per-schema reshape so dapp-facing payloads match what the legacy
  // api-react endpoints emitted (e.g. `chia_getWallets` → wallets array,
  // not `{ wallets: [...] }`).
  const dappData = entry.schema.dapp?.transformResponse ? entry.schema.dapp.transformResponse(camel) : camel;
  return { data: dappData as Record<string, unknown> };
}
