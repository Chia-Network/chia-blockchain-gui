import crypto from 'node:crypto';

import JSONbig from 'json-bigint';

import { applyDefaults, resolveDispatch } from '../constants/commandRegistry';
import type { ConfirmProps } from '../dialogs/Confirm/Confirm';
import { renderConfirm } from '../dialogs/Confirm/renderConfirm';
import toCamelCase from '../utils/toCamelCase';
import toSnakeCase from '../utils/toSnakeCase';
import { sendDappAndAwait } from '../utils/webSocketBridge';

import { captureBypassFromConfirmResult } from './bypassCapture';
import { getPair, upsertPair } from './pairStore';
import { resolvePermission } from './permissions';
import type { Principal } from './types';

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
};

export async function dispatchDaemonCommandAsPair(
  input: DispatchAsPairInput,
  deps: DispatchAsPairDeps,
): Promise<{ data: Record<string, unknown> }> {
  const { wcCommand, data, topic, mainnet, fingerprint, networkPrefix } = input;
  const target = resolveDispatch(wcCommand);
  if (!target.ok) {
    throw new Error(target.reason);
  }
  const { destination, nsCommand, command } = target;

  const principal: Principal = { kind: 'pair', topic };
  const snakeData = toSnakeCase(data) as Record<string, unknown>;
  const permission = deps.resolvePermission ?? resolvePermission;
  const decision = await permission(principal, nsCommand, snakeData, {
    wcCommand,
    fingerprint: fingerprint?.requested,
    mainnet,
  });
  if (decision.kind === 'deny') {
    throw new Error(decision.reason);
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
      throw new Error('Operation cancelled by user');
    }
    const capture = deps.captureBypassFromConfirmResult ?? captureBypassFromConfirmResult;
    capture(result, { topic, wcCommand }, { getPair, upsertPair });
  } else {
    // Auto-approved: debit at the authorization point. Manual prompts skip
    // commit (matches the renderer-onSend flow).
    decision.commit();
  }

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

  // Preserve daemon application errors as result data. JSON-RPC transport
  // errors are still thrown by the caller around this handler.
  return { data: toCamelCase(response?.data ?? {}) };
}
