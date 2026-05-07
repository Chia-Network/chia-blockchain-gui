// Handlers for pure-dapp wcCommands without a 1:1 daemon RPC. Schemas opt
// in via `dapp.handlerKey`; `dispatchAsPair` runs validation + permission
// + confirm first, then invokes the handler with `dispatchDaemon` for
// composed flows.
import type { BrowserWindow } from 'electron';
import crypto from 'node:crypto';

import JSONbig from 'json-bigint';

import { WcError, WcErrorCode } from '../../@types/WcError';
import PermissionsAPI from '../constants/PermissionsAPI';
import toCamelCase from '../utils/toCamelCase';
import toSnakeCase from '../utils/toSnakeCase';
import { sendDappAndAwait } from '../utils/webSocketBridge';

import { buildShowNotification } from './buildShowNotification';
import type { PairRecord } from './types';

export type DappHandlerContext = {
  data: Record<string, unknown>;
  pair: PairRecord;
  mainnet: boolean;
  fingerprint?: { requested: number; current?: number };
  mainWindow: BrowserWindow;
  networkPrefix?: string;
  dispatchDaemon: (
    destination: string,
    command: string,
    payload: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
};

export type DappHandler = (ctx: DappHandlerContext) => Promise<{ data: Record<string, unknown> }>;

export async function defaultDispatchDaemon(
  destination: string,
  command: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const requestId = crypto.randomBytes(32).toString('hex');
  const wire = {
    origin: 'wallet_ui',
    destination,
    command,
    data: payload,
    ack: false,
    request_id: requestId,
  };
  const json = JSONbig.stringify(toSnakeCase(wire));
  const response = (await sendDappAndAwait(requestId, json)) as {
    data?: { error?: unknown; [k: string]: unknown };
  };
  // Mirror dispatchAsPair: daemon application errors come back as
  // `response.data.error`. Throw with the camelized payload on `data` so
  // composed handlers (e.g. addCATToken) fail closed instead of returning
  // `{ success: false, error }` as a successful handler result.
  if (response?.data?.error) {
    const camelErr = toCamelCase(response.data) as Record<string, unknown>;
    throw new WcError(String(response.data.error), WcErrorCode.INTERNAL_ERROR, { data: camelErr });
  }
  return toCamelCase(response?.data ?? {}) as Record<string, unknown>;
}

// Main owns bypass/grants; ack so legacy dapps still work.
const requestPermissions: DappHandler = async () => ({ data: { success: true } });

const showNotification: DappHandler = async ({ data, pair, fingerprint, mainWindow }) => {
  const notification = buildShowNotification(pair, data, fingerprint?.requested);
  mainWindow.webContents.send(PermissionsAPI.NOTIFICATION_EVENT, notification);
  return { data: { success: true } };
};

const addCATToken: DappHandler = async ({ data, dispatchDaemon }) => {
  // No `add_cat_token` daemon RPC; compose via `create_new_wallet` with
  // `mode: 'existing'`. Fee is 0 — adding a CAT moves no funds.
  const result = await dispatchDaemon('chia_wallet', 'create_new_wallet', {
    wallet_type: 'cat_wallet',
    mode: 'existing',
    asset_id: data.asset_id,
    name: data.name,
    fee: 0,
  });
  return { data: result };
};

const transferDID: DappHandler = async ({ data, dispatchDaemon }) => {
  // Defense-in-depth: explicit field pick instead of forwarding `data` whole,
  // so a future regression in `validateDappParams` can't expand the daemon
  // call surface here.
  const result = await dispatchDaemon('chia_wallet', 'did_transfer_did', {
    wallet_id: data.wallet_id,
    inner_address: data.inner_address,
    fee: data.fee,
    with_recovery_info: data.with_recovery_info,
    reuse_puzhash: data.reuse_puzhash,
  });
  return { data: result };
};

const createNewDIDWallet: DappHandler = async ({ data, dispatchDaemon }) => {
  const result = await dispatchDaemon('chia_wallet', 'create_new_wallet', {
    wallet_type: 'did_wallet',
    did_type: 'new',
    backup_dids: data.backup_dids,
    num_of_backup_ids_needed: data.num_of_backup_ids_needed,
    amount: data.amount,
    fee: data.fee,
  });
  return { data: result };
};

const createNewRemoteWallet: DappHandler = async ({ data, dispatchDaemon }) => {
  const result = await dispatchDaemon('chia_wallet', 'create_new_wallet', {
    wallet_type: 'remote_wallet',
    allow_unsynced: data.allow_unsynced,
  });
  return { data: result };
};

export const dappHandlers: Record<string, DappHandler> = {
  requestPermissions,
  showNotification,
  addCATToken,
  transferDID,
  createNewDIDWallet,
  createNewRemoteWallet,
};

export function getDappHandler(key: string): DappHandler | undefined {
  return dappHandlers[key];
}
