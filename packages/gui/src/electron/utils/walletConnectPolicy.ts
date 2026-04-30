// Main-process WalletConnect policy enforcement. Called from the `onSend` interceptor
// registered in `main.tsx`. Owns the decision to allow / ask / block a given outbound RPC
// frame, opens main-side dialogs as needed, and writes ledger entries on success.

import { type BrowserWindow } from 'electron';

import { i18n } from '../../config/locales';
import {
  Scope,
  POLICY_SCOPES,
  defaultSessionScopes,
  resolveScope,
  type SessionScopes,
  type PolicyScopeState,
} from '../constants/WalletConnectScopeMap';
import WalletConnectPermissions, {
  walletConnectPermissionsScript,
  type WalletConnectPermissionsProps,
} from '../dialogs/WalletConnectPermissions/WalletConnectPermissions';
import WalletConnectSpend, {
  walletConnectSpendScript,
  type WalletConnectSpendProps,
  type SpendDialogResult,
} from '../dialogs/WalletConnectSpend/WalletConnectSpend';

import openReactDialog from './openReactDialog';
import {
  getSession,
  putSession,
  recordSpend,
  setScopes,
  type LedgerEntry,
  type StoredSession,
} from './walletConnectStore';
import {
  summarizeSpend,
  validateOfferSummary,
  type RendererOfferSummary,
  type SpendSummary,
} from './walletConnectOfferSummary';
import { getUsdPerXch } from './usdRate';

export type EvaluateInput = {
  nsCommand: string;
  parsedData: any;
  // From the renderer-injected meta. All fields are untrusted; main re-resolves the scope
  // and rejects if no recognized session exists for this topic. The optional offer summary
  // is used purely for validation — `validateOfferSummary` re-derives the canonical version
  // from `parsedData` and refuses the action if the renderer claim disagrees.
  topic?: string;
  wcCommand?: string;
  rendererOfferSummary?: RendererOfferSummary;
};

export type EvaluateResult = { allow: true } | { allow: false; reason: string };

// Always-block list. Even a fully-trusted session must never see this leave the renderer.
const HARD_BLOCK_NS_COMMANDS = new Set<string>(['chia_wallet.get_private_key']);

function getEffectivePolicy(scopes: SessionScopes, scope: Scope): PolicyScopeState {
  const state = (scopes as any)[scope];
  if (!state) return { policy: 'ask' };
  // Read-style scopes are explicit privacy toggles: disabled means deny, not nag.
  if ('enabled' in state) {
    return { policy: state.enabled ? 'allow' : 'block' };
  }
  return state as PolicyScopeState;
}

function expired(state: PolicyScopeState): boolean {
  if (!state.expiresAt) return false;
  return Math.floor(Date.now() / 1000) > state.expiresAt;
}

export type BudgetCheck = {
  ok: boolean;
  reason?: 'maxPerTx' | 'maxFeePerTx' | 'maxPerWindow' | 'expired';
  spentInWindow?: bigint;
};

function toBig(s: string | undefined): bigint | undefined {
  if (!s) return undefined;
  try {
    return BigInt(s);
  } catch {
    return undefined;
  }
}

export function checkBudget(
  state: PolicyScopeState,
  summary: SpendSummary,
  ledger: LedgerEntry[],
): BudgetCheck {
  if (state.policy !== 'allow') return { ok: false };
  if (expired(state)) return { ok: false, reason: 'expired' };

  const maxPerTx = toBig(state.maxPerTx);
  const maxFee = toBig(state.maxFeePerTx);
  const maxWindow = toBig(state.maxPerWindow);

  if (maxPerTx !== undefined && summary.amount > maxPerTx) {
    return { ok: false, reason: 'maxPerTx' };
  }
  if (maxFee !== undefined && summary.fee > maxFee) {
    return { ok: false, reason: 'maxFeePerTx' };
  }
  if (maxWindow !== undefined) {
    const window = state.windowSeconds ?? 86_400;
    const sinceTs = Math.floor(Date.now() / 1000) - window;
    let spent = 0n;
    for (const entry of ledger) {
      if (entry.ts >= sinceTs) {
        try {
          spent += BigInt(entry.amount);
        } catch {
          // ignore malformed historical entries
        }
      }
    }
    if (spent + summary.amount > maxWindow) {
      return { ok: false, reason: 'maxPerWindow', spentInWindow: spent };
    }
    return { ok: true, spentInWindow: spent };
  }
  return { ok: true };
}

export async function evaluate(
  input: EvaluateInput,
  parent: BrowserWindow,
): Promise<EvaluateResult> {
  // 1. Hard-blocks first - never allowed regardless of session policy.
  if (HARD_BLOCK_NS_COMMANDS.has(input.nsCommand)) {
    return { allow: false, reason: 'Private key is not allowed to be sent to the renderer process' };
  }

  // 2. Find the scope for this command. If we can't classify it, default to ask.
  const scope = resolveScope({ wcCommand: input.wcCommand, nsCommand: input.nsCommand });

  // 3. No topic? Then this is a non-WC frame; let the legacy AllowedCommands path handle it.
  if (!input.topic) {
    return { allow: true };
  }

  // 4. Topic must correspond to a known session. Forged topics are rejected.
  const session = getSession(input.topic);
  if (!session) {
    return { allow: false, reason: 'Unknown WalletConnect session' };
  }

  // 5. If we couldn't resolve the scope, fall through to ask.
  const effectiveScope: Scope = scope ?? Scope.WALLET_MANAGE;
  const state = getEffectivePolicy(session.scopes, effectiveScope);

  // 6. Block scopes always reject.
  if (state.policy === 'block') {
    return { allow: false, reason: i18n._(/* i18n */ { id: 'This action is blocked by your WalletConnect policy' }) };
  }

  // 7. For policy scopes, attempt budget short-circuit. For read scopes, allow if enabled.
  const isPolicyScope = POLICY_SCOPES.includes(effectiveScope);
  const summary = isPolicyScope ? summarizeSpend(input.nsCommand, input.parsedData) : undefined;

  // 7a. For offer commands, validate any renderer-supplied summary against our canonical
  // re-derivation. Mismatches are a strong signal that the renderer is compromised, so we
  // fail closed regardless of the underlying scope policy.
  if (
    isPolicyScope &&
    input.rendererOfferSummary &&
    (input.nsCommand.endsWith('create_offer_for_ids') || input.nsCommand.endsWith('take_offer'))
  ) {
    const validation = validateOfferSummary(input.nsCommand, input.parsedData, input.rendererOfferSummary);
    if (!validation.ok) {
      return { allow: false, reason: `Renderer offer summary mismatch: ${validation.reason}` };
    }
  }

  if (state.policy === 'allow') {
    // Read scopes - already allowed. Policy scopes check budget.
    if (!isPolicyScope) return { allow: true };
    if (!summary) return { allow: true };
    const ledger = session.ledger[effectiveScope] ?? [];
    const budget = checkBudget(state, summary, ledger);
    if (budget.ok) {
      // Record and allow.
      recordSpend(input.topic, effectiveScope, {
        ts: Math.floor(Date.now() / 1000),
        amount: summary.amount.toString(),
        fee: summary.fee.toString(),
        command: input.nsCommand,
      });
      return { allow: true };
    }
    // Budget check failed - fall through to ask so the user can approve overage.
  }

  // 8. Ask: open the appropriate main-side dialog.
  // Best-effort fiat lookup. Never blocks the dialog if the network is offline.
  const usdPerXch = await getUsdPerXch().catch(() => undefined);
  if (isPolicyScope && summary) {
    const result = await openReactDialog<SpendDialogResult, WalletConnectSpendProps>(
      parent,
      WalletConnectSpend,
      {
        nsCommand: input.nsCommand,
        scope: effectiveScope,
        amount: summary.amount.toString(),
        fee: summary.fee.toString(),
        kind: summary.kind,
        catAmounts: summary.catAmounts
          ? Object.fromEntries(Object.entries(summary.catAmounts).map(([k, v]) => [k, v.toString()]))
          : undefined,
        txCount: summary.txCount,
        dappName: session.metadata.name,
        dappUrl: session.metadata.url,
        currentPolicy: state.policy,
        rawData: input.parsedData,
        usdPerXch,
      },
      {
        title: i18n._(/* i18n */ { id: 'Confirm WalletConnect Action' }),
        width: 600,
        height: 620,
        scriptContent: walletConnectSpendScript,
      },
    );
    if (!result || result.confirmed !== true) {
      return { allow: false, reason: 'Operation cancelled by user' };
    }
    // If the user opted to upgrade the policy inline, persist it.
    if (result.upgradeBudget) {
      const next: SessionScopes = {
        ...session.scopes,
        [effectiveScope]: {
          policy: 'allow',
          maxPerTx: result.upgradeBudget.maxPerTx,
          maxPerWindow: result.upgradeBudget.maxPerWindow,
          windowSeconds: result.upgradeBudget.windowSeconds,
          maxFeePerTx: result.upgradeBudget.maxFeePerTx,
          expiresAt: result.upgradeBudget.expiresAt,
        },
      } as SessionScopes;
      setScopes(input.topic, next);
    }
    recordSpend(input.topic, effectiveScope, {
      ts: Math.floor(Date.now() / 1000),
      amount: summary.amount.toString(),
      fee: summary.fee.toString(),
      command: input.nsCommand,
    });
    return { allow: true };
  }

  // Read scope ask - confirm via the spend dialog as a generic confirmation.
  const result = await openReactDialog<SpendDialogResult, WalletConnectSpendProps>(
    parent,
    WalletConnectSpend,
    {
      nsCommand: input.nsCommand,
      scope: effectiveScope,
      amount: '0',
      fee: '0',
      kind: 'xch',
      txCount: 1,
      dappName: session.metadata.name,
      dappUrl: session.metadata.url,
      currentPolicy: state.policy,
      rawData: input.parsedData,
      usdPerXch,
    },
    {
      title: i18n._(/* i18n */ { id: 'Confirm WalletConnect Action' }),
      width: 600,
      height: 500,
      scriptContent: walletConnectSpendScript,
    },
  );
  if (!result || result.confirmed !== true) {
    return { allow: false, reason: 'Operation cancelled by user' };
  }
  return { allow: true };
}

export type PromptPermissionsInput = {
  topic: string;
  requestedCommands: string[];
  metadata: { name?: string; url?: string; description?: string; icons?: string[] };
};

function iconHashOf(icons: string[] | undefined): string | undefined {
  if (!icons || icons.length === 0) return undefined;
  // Mirrors walletConnectStore.hashIcons but without importing crypto here so the policy
  // module stays portable. Fast-path: just join + cheap hash via reduction.
  // We don't reuse the canonical crypto hash because we only need an equality test;
  // putSession will recompute and persist the canonical sha256.
  return icons.join('|');
}

function anyExpired(scopes: SessionScopes): boolean {
  const now = Math.floor(Date.now() / 1000);
  for (const value of Object.values(scopes) as Array<{ policy?: string; expiresAt?: number }>) {
    if (value && 'policy' in value && value.policy === 'allow' && value.expiresAt && value.expiresAt < now) {
      return true;
    }
  }
  return false;
}

export async function promptPermissions(
  input: PromptPermissionsInput,
  parent: BrowserWindow,
): Promise<{ approved: boolean; scopes?: SessionScopes }> {
  const existing = getSession(input.topic);
  const scopes: SessionScopes = existing?.scopes ?? defaultSessionScopes();

  // Reconnect short-circuit: if the dApp identity hasn't changed (icon hash equality is a
  // proxy used by walletConnectStore to invalidate scopes), and no Allow policy has expired,
  // we skip the dialog entirely. The user already consented and the request shape matches.
  if (existing) {
    const incomingHash = iconHashOf(input.metadata.icons);
    const storedHash = existing.metadata.icons ? iconHashOf(existing.metadata.icons) : undefined;
    const identityMatches = !incomingHash || !storedHash || incomingHash === storedHash;
    if (identityMatches && !anyExpired(existing.scopes)) {
      // Refresh the metadata in case fields like name/description changed without affecting
      // identity, but keep the existing scopes intact.
      putSession({
        topic: input.topic,
        metadata: input.metadata,
        scopes: existing.scopes,
      });
      return { approved: true, scopes: existing.scopes };
    }
  }

  const result = await openReactDialog<{ approved: boolean; scopes: SessionScopes }, WalletConnectPermissionsProps>(
    parent,
    WalletConnectPermissions,
    {
      topic: input.topic,
      requestedCommands: input.requestedCommands,
      dappName: input.metadata.name,
      dappUrl: input.metadata.url,
      dappDescription: input.metadata.description,
      currentScopes: scopes,
    },
    {
      title: i18n._(/* i18n */ { id: 'WalletConnect Permissions' }),
      width: 600,
      height: 700,
      scriptContent: walletConnectPermissionsScript,
    },
  );

  if (!result || result.approved !== true) {
    return { approved: false };
  }

  // Persist the new session + scopes through putSession (creates if absent, updates if not).
  putSession({
    topic: input.topic,
    metadata: input.metadata,
    scopes: result.scopes,
  });

  return { approved: true, scopes: result.scopes };
}

// Re-exports used by main.tsx and tests.
export {
  getSession,
  listSessions,
  putSession,
  revokeSession,
  setScopes,
  getLedger,
  resetLedger,
  isMigrated,
  markMigrated,
} from './walletConnectStore';
export { getUsdPerXch as getUsdRate } from './usdRate';

export type { StoredSession };
