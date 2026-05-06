import BigNumber from 'bignumber.js';
import React from 'react';

import { i18n } from '../../../config/locales';
import type { PairGrants, PairMetadata } from '../../permissions/types';
import mojoToChia from '../../utils/mojoToChia';

export type PairWalletOption = {
  fingerprint: number;
  name?: string;
};

export type PairCommandGroups = {
  innocuous: string[];
  balance: string[];
  sign: string[];
  notifications: string[];
  /** Spend-like commands shown inside the per-command details. */
  spending: string[];
  /** Commands that didn't classify into any of the above (e.g. chia_logIn). */
  other: string[];
};

export type PairProps = {
  confirmId: string;
  metadata: PairMetadata;
  availableWallets: PairWalletOption[];
  defaultGrants?: PairGrants;
  defaultFingerprints?: number[];
  /** Commands already in pair.bypass — pre-check them in the per-command list. */
  defaultBypass?: string[];
  /**
   * Granted commands grouped by capability class. Spend commands can still
   * appear here for exact command-level bypass; the allowance section is the
   * bounded XCH fallback.
   */
  commandGroups?: PairCommandGroups;
  /** Wire form. Asked for but dropped because this wallet doesn't support them. */
  rejectedCommands?: string[];
  isEdit?: boolean;
  /** Mojos already debited from the allowance. Display-only; reset lives in the allowance section. */
  defaultUsedMojos?: string;
  currencyCode?: string;
  // styleURL and isDarkMode are injected by openReactDialog for every dialog
  // component; Pair only relies on the page-level styles those imply, so the
  // values themselves don't need to be read here.
  // eslint-disable-next-line react/no-unused-prop-types -- injected by host
  styleURL?: string;
  // eslint-disable-next-line react/no-unused-prop-types -- injected by host
  isDarkMode?: boolean;
};

// Hidden from the dialog because it grants nothing meaningful — we keep it
// in pair.commands for WC SDK compatibility but don't expose a toggle.
const HIDDEN_COMMANDS = new Set(['chia_requestPermissions']);

// chia_sendTransaction → "Send Transaction"; chia_getNFTs → "Get NFTs".
function humanizeWcCommand(name: string): string {
  if (!name) return name;
  const bare = name.startsWith('chia_') ? name.slice('chia_'.length) : name;
  const spaced = bare.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function getTitle(isEdit: boolean) {
  return isEdit ? i18n._(/* i18n */ { id: 'Edit Connection' }) : i18n._(/* i18n */ { id: 'Connect Application' });
}

type CapabilityGroup = {
  key: 'innocuous' | 'balance' | 'sign' | 'notifications';
  label: string;
  description: string;
  commands: string[];
};

function mojosToXch(mojos: string | undefined): string {
  return mojoToChia(mojos ?? 0).toFixed();
}

export default function Pair(props: PairProps) {
  const {
    confirmId,
    metadata,
    availableWallets,
    defaultGrants,
    defaultFingerprints = [],
    defaultBypass = [],
    commandGroups,
    rejectedCommands: rejectedCommandsRaw = [],
    isEdit = false,
    defaultUsedMojos,
    currencyCode = 'XCH',
  } = props;

  const rejectedCommands = rejectedCommandsRaw.filter((wc) => !HIDDEN_COMMANDS.has(wc));

  const grants: PairGrants = defaultGrants ?? { xchMojos: '0' };

  const allowanceBn = new BigNumber(grants.xchMojos ?? 0);
  // Derived from allowance — single source of truth, no drift possible.
  const enableAllowanceDefault = allowanceBn.isGreaterThan(0);
  // Keep a useful starter value in the disabled field; unchecked still saves
  // as zero via `dialogResultToGrants`.
  const defaultAllowanceXch = enableAllowanceDefault ? mojosToXch(grants.xchMojos) : '0.01';
  const usedBn = new BigNumber(defaultUsedMojos ?? 0);
  const usedXch = mojosToXch(defaultUsedMojos);
  const showSpent = isEdit;
  const showResetUsed = isEdit && usedBn.isGreaterThan(0);

  const filterHidden = (cmds: string[]) => cmds.filter((wc) => !HIDDEN_COMMANDS.has(wc));
  const groups = {
    innocuous: filterHidden(commandGroups?.innocuous ?? []),
    balance: filterHidden(commandGroups?.balance ?? []),
    sign: filterHidden(commandGroups?.sign ?? []),
    notifications: filterHidden(commandGroups?.notifications ?? []),
    spending: filterHidden(commandGroups?.spending ?? []),
    other: filterHidden(commandGroups?.other ?? []),
  };

  const allCapabilityGroups: CapabilityGroup[] = [
    {
      key: 'innocuous',
      label: i18n._(/* i18n */ { id: 'Innocuous actions' }),
      description: i18n._(/* i18n */ { id: 'reads accounts, NFTs, and offers' }),
      commands: groups.innocuous,
    },
    {
      key: 'balance',
      label: i18n._(/* i18n */ { id: 'Show balances' }),
      description: i18n._(/* i18n */ { id: 'sees how much you hold' }),
      commands: groups.balance,
    },
    {
      key: 'sign',
      label: i18n._(/* i18n */ { id: 'Sign messages' }),
      description: i18n._(/* i18n */ { id: 'signs text with your key' }),
      commands: groups.sign,
    },
    {
      key: 'notifications',
      label: i18n._(/* i18n */ { id: 'Show notifications' }),
      description: i18n._(/* i18n */ { id: 'shows you offers and updates' }),
      commands: groups.notifications,
    },
  ];
  // Always show all four groups so the dialog has a stable height and the
  // user can see at a glance what the dapp didn't request. Empty groups
  // render as disabled — toggling them would be a no-op since there are
  // no commands to add to bypass.
  const capabilityGroups = allCapabilityGroups;

  const bypassSet = new Set(defaultBypass);
  // Per-group default state computed at render time. The cascade JS in
  // openReactDialog re-runs this on first paint via the indeterminate
  // recompute, so SSR-emitted `defaultChecked` only seeds the run.
  function groupDefaultChecked(commands: string[]): boolean {
    return commands.length > 0 && commands.every((cmd) => bypassSet.has(cmd));
  }

  const hasUrl = !!metadata.url && metadata.url !== '#' && metadata.url.trim().length > 0;
  const wallets = Array.isArray(availableWallets) ? availableWallets : [];

  return (
    <div className="flex flex-col h-screen bg-chia-bg text-chia-text text-base">
      <div className="flex-1 min-h-0 overflow-y-auto px-7 pt-4 pb-4 space-y-3">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-chia-primary-soft text-chia-primary flex items-center justify-center text-xl font-bold uppercase">
            {(metadata.name || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="m-0 text-2xl font-semibold leading-tight text-chia-text truncate">
              {metadata.name || 'Unknown application'}
            </h1>
            {hasUrl && <div className="mt-0.5 text-sm text-chia-text-secondary truncate">{metadata.url}</div>}
            <p className="mt-0.5 mb-0 text-sm leading-snug text-chia-text-secondary">
              {isEdit
                ? i18n._(/* i18n */ { id: 'Update what this app can do without asking. Other things still ask you.' })
                : i18n._(/* i18n */ { id: 'Pick what this app can do without asking. Other things still ask you.' })}
            </p>
          </div>
        </div>

        <section className="relative z-30">
          <div className="rounded-xl border border-chia-border bg-chia-card">
            <div className="px-5 pt-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
              {i18n._(/* i18n */ { id: 'Wallet keys' })}
            </div>
            {wallets.length === 0 ? (
              <div className="px-5 pb-3 text-sm text-chia-text-secondary">
                {i18n._(/* i18n */ { id: 'No wallet keys available.' })}
              </div>
            ) : (
              <details className="group relative">
                <summary className="flex items-center gap-2 mx-3 mb-3 px-3 py-2 rounded-md border border-chia-border-strong bg-chia-bg cursor-pointer list-none select-none hover:border-chia-primary transition-colors">
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                    {wallets.map((wallet) => (
                      <span
                        key={wallet.fingerprint}
                        data-chip-for="wallets"
                        data-chip-value={String(wallet.fingerprint)}
                        style={{
                          display: defaultFingerprints.includes(wallet.fingerprint) ? '' : 'none',
                        }}
                        className="inline-flex items-center text-sm px-2 py-0.5 rounded bg-chia-primary-soft text-chia-text font-medium max-w-[200px] truncate"
                      >
                        {wallet.name || `Wallet ${wallet.fingerprint}`}
                      </span>
                    ))}
                    <span
                      data-empty-placeholder="wallets"
                      style={{ display: defaultFingerprints.length === 0 ? '' : 'none' }}
                      className="text-sm text-chia-text-secondary"
                    >
                      {i18n._(/* i18n */ { id: 'Select wallet keys…' })}
                    </span>
                  </div>
                  <svg
                    className="shrink-0 w-4 h-4 text-chia-text-secondary transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="absolute left-3 right-3 top-full -mt-2 z-40 rounded-md border border-chia-border-strong bg-chia-surface shadow-xl max-h-60 overflow-y-auto">
                  <ul className="m-0 p-0 list-none divide-y divide-chia-border">
                    {wallets.map((wallet) => {
                      const checked = defaultFingerprints.includes(wallet.fingerprint);
                      return (
                        <li key={wallet.fingerprint}>
                          <label className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                            <input
                              type="checkbox"
                              name="wallets"
                              value={String(wallet.fingerprint)}
                              defaultChecked={checked}
                              data-form-field="wallets"
                              data-multi=""
                              className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                            />
                            <span className="flex-1 min-w-0 text-sm truncate">
                              <span className="font-medium text-chia-text">
                                {wallet.name || `Wallet ${wallet.fingerprint}`}
                              </span>
                              <span className="text-chia-text-muted font-mono ml-2">({wallet.fingerprint})</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </details>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <div className="px-5 pt-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Allow without asking' })}
          </div>
          <ul className="m-0 p-0 list-none divide-y divide-chia-border border-t border-chia-border">
            {capabilityGroups.map((group) => {
              const isEmpty = group.commands.length === 0;
              return (
                <li key={group.key} className={isEmpty ? 'opacity-50' : ''}>
                  <label
                    className={`flex items-center gap-3 px-5 py-1.5 ${
                      isEmpty ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-chia-card-elevated'
                    } transition-colors`}
                    title={
                      isEmpty ? i18n._(/* i18n */ { id: 'This app did not request commands of this type.' }) : undefined
                    }
                  >
                    <input
                      type="checkbox"
                      defaultChecked={groupDefaultChecked(group.commands)}
                      disabled={isEmpty}
                      data-cap-toggle={group.key}
                      className="w-[18px] h-[18px] accent-chia-primary shrink-0 disabled:cursor-not-allowed"
                    />
                    <span className="flex-1 min-w-0 text-sm leading-snug">
                      <span className="font-medium text-chia-text">{group.label}</span>
                      <span className="text-chia-text-secondary">
                        {': '}
                        {group.description}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {groups.innocuous.length +
            groups.balance.length +
            groups.sign.length +
            groups.notifications.length +
            groups.spending.length +
            groups.other.length +
            rejectedCommands.length >
            0 && (
            <details className="group border-t border-chia-border">
              <summary className="flex items-center justify-between gap-2 px-5 py-2 cursor-pointer list-none select-none hover:bg-chia-card-elevated transition-colors">
                <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                  {i18n._(/* i18n */ { id: 'Per-command' })}
                </span>
                <svg
                  className="shrink-0 w-4 h-4 text-chia-text-secondary transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="border-t border-chia-border">
                {capabilityGroups.map((group) => (
                  <PerCommandGroup
                    key={group.key}
                    label={group.label}
                    capKey={group.key}
                    commands={group.commands}
                    bypassSet={bypassSet}
                  />
                ))}
                {groups.spending.length > 0 && (
                  <PerCommandGroup
                    label={i18n._(/* i18n */ { id: 'Spending commands' })}
                    capKey={undefined}
                    commands={groups.spending}
                    bypassSet={bypassSet}
                  />
                )}
                {groups.other.length > 0 && (
                  <PerCommandGroup
                    label={i18n._(/* i18n */ { id: 'Other commands' })}
                    capKey={undefined}
                    commands={groups.other}
                    bypassSet={bypassSet}
                  />
                )}
                {rejectedCommands.length > 0 && (
                  <div className="border-b border-chia-border last:border-b-0">
                    <div className="px-5 pt-2 pb-1 text-xs text-chia-text-muted">
                      {i18n._(/* i18n */ { id: 'Not supported and excluded' })}
                    </div>
                    <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                      {rejectedCommands.map((wc) => (
                        <span
                          key={wc}
                          title={wc}
                          className="inline-flex items-center text-xs px-2 py-0.5 rounded border border-chia-border-strong text-chia-text-secondary font-medium"
                        >
                          {humanizeWcCommand(wc)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
        </section>

        {/* Spending — bounded XCH fallback for fund-moving commands (send/offer/push).
             Form fields `enableAllowance` + `allowanceXch` feed `dialogResultToGrants` in main. */}
        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pt-2.5 pb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
              {i18n._(/* i18n */ { id: 'Spending' })}
            </span>
            {showSpent && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-chia-text-muted">
                  {i18n._(/* i18n */ { id: 'Spent' })}{' '}
                  <span className="font-mono text-chia-text-secondary">{usedXch}</span> {currencyCode}
                </span>
                {showResetUsed && (
                  // Checkbox styled as a button — ticks `resetUsed` form field; main resets usedMojos on Save.
                  <label className="cursor-pointer select-none">
                    <input type="checkbox" data-form-field="resetUsed" className="peer sr-only" />
                    <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-chia-border-strong text-chia-text-secondary hover:border-chia-primary hover:text-chia-primary peer-checked:bg-chia-primary-soft peer-checked:text-chia-primary peer-checked:border-chia-primary transition-colors">
                      {i18n._(/* i18n */ { id: 'Reset' })}
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
          <div className="px-5 py-2.5 border-t border-chia-border space-y-1.5">
            {/* Checkbox + label + amount as direct siblings so the cascade in
                openReactDialog (`data-disabled-when-off`) can wire them up. */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <label htmlFor="enable-allowance" className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  id="enable-allowance"
                  type="checkbox"
                  defaultChecked={enableAllowanceDefault}
                  data-form-field="enableAllowance"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span>{i18n._(/* i18n */ { id: 'Auto-approve up to' })}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  // Spinner step matches the typical 0.01–1 XCH range; finer values can still be typed.
                  step="0.01"
                  defaultValue={defaultAllowanceXch}
                  data-form-field="allowanceXch"
                  data-disabled-when-off="enableAllowance"
                  className="w-40 px-2 py-1 rounded-md border border-chia-border-strong bg-chia-bg text-sm font-mono text-chia-text text-right focus:outline-none focus:border-chia-primary focus:ring-2 focus:ring-chia-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-secondary">
                  {currencyCode}
                </span>
              </div>
            </div>
          </div>
          <div className="px-5 pb-2.5 text-xs text-chia-text-muted leading-snug">
            {i18n._(
              /* i18n */ {
                id: 'One limit for all XCH transactions and fees. CATs and NFTs are not included.',
              },
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-2.5 px-7 py-4 border-t border-chia-border bg-chia-bg">
        <button
          type="button"
          data-action="cancel"
          className="px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-md border border-chia-primary bg-transparent text-chia-primary hover:bg-chia-primary-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary"
        >
          {isEdit ? i18n._(/* i18n */ { id: 'Cancel' }) : i18n._(/* i18n */ { id: 'Reject' })}
        </button>
        <button
          type="button"
          id={confirmId}
          className="px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-md border border-transparent bg-chia-primary hover:bg-chia-primary-hover text-[#0f252a] shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary focus-visible:ring-offset-2 focus-visible:ring-offset-chia-bg"
        >
          {isEdit ? i18n._(/* i18n */ { id: 'Save changes' }) : i18n._(/* i18n */ { id: 'Connect' })}
        </button>
      </div>
    </div>
  );
}

function PerCommandGroup({
  label,
  capKey,
  commands,
  bypassSet,
}: {
  label: string;
  capKey: 'innocuous' | 'balance' | 'sign' | 'notifications' | undefined;
  commands: string[];
  bypassSet: Set<string>;
}) {
  if (commands.length === 0) return null;
  return (
    <div className="border-b border-chia-border last:border-b-0">
      <div className="px-5 pt-2 pb-1 text-xs text-chia-text-muted">{label}</div>
      <ul className="m-0 p-0 list-none">
        {commands.map((wc) => (
          <li key={wc}>
            <label className="flex items-center gap-3 px-5 py-1 cursor-pointer hover:bg-chia-card-elevated transition-colors">
              <input
                type="checkbox"
                defaultChecked={bypassSet.has(wc)}
                data-form-field={`bypass-${wc}`}
                data-cap-group={capKey}
                className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
              />
              <span className="text-sm text-chia-text font-mono truncate" title={wc}>
                {humanizeWcCommand(wc)}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
