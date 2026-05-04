import BigNumber from 'bignumber.js';
import React from 'react';

import { i18n } from '../../../config/locales';
import type { PairGrants, PairMetadata } from '../../permissions/types';

const MOJOS_PER_XCH = new BigNumber('1000000000000');

export type PairWalletOption = {
  fingerprint: number;
  name?: string;
};

export type PairCommandGroups = {
  innocuous: string[];
  balance: string[];
  sign: string[];
  notifications: string[];
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
  /** Granted commands grouped by capability class. Spend-class is excluded. */
  commandGroups?: PairCommandGroups;
  /** Wire form. Asked for but dropped because this wallet doesn't support them. */
  rejectedCommands?: string[];
  isEdit?: boolean;
  /** Mojos already auto-spent against the cap. Display-only; reset lives in the menu. */
  defaultSpentMojos?: string;
  currencyCode?: string;
  styleURL?: string;
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
    defaultSpentMojos,
    currencyCode = 'XCH',
  } = props;

  const rejectedCommands = rejectedCommandsRaw.filter((wc) => !HIDDEN_COMMANDS.has(wc));

  const grants: PairGrants = defaultGrants ?? {
    spendingMode: 'ask',
    spendingCapMojos: '10000000000', // 0.01 XCH default budget when user picks auto
  };

  const defaultCapXch = new BigNumber(grants.spendingCapMojos ?? 0).div(MOJOS_PER_XCH).toFixed();
  const spentBn = new BigNumber(defaultSpentMojos ?? 0);
  const spentXch = spentBn.div(MOJOS_PER_XCH).toFixed();
  const showResetSpent = isEdit && spentBn.isGreaterThan(0);
  const spendingMode = grants.spendingMode ?? 'ask';

  const filterHidden = (cmds: string[]) => cmds.filter((wc) => !HIDDEN_COMMANDS.has(wc));
  const groups = {
    innocuous: filterHidden(commandGroups?.innocuous ?? []),
    balance: filterHidden(commandGroups?.balance ?? []),
    sign: filterHidden(commandGroups?.sign ?? []),
    notifications: filterHidden(commandGroups?.notifications ?? []),
    other: filterHidden(commandGroups?.other ?? []),
  };

  const allCapabilityGroups: CapabilityGroup[] = [
    {
      key: 'innocuous',
      label: i18n._(/* i18n */ { id: 'Innocuous actions' }),
      description: i18n._(/* i18n */ { id: 'reads accounts, makes wallets' }),
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
      description: i18n._(/* i18n */ { id: 'login or proof of ownership' }),
      commands: groups.sign,
    },
    {
      key: 'notifications',
      label: i18n._(/* i18n */ { id: 'Show notifications' }),
      description: i18n._(/* i18n */ { id: 'offers and announcements' }),
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
                {groups.other.length > 0 && (
                  <PerCommandGroup
                    label={i18n._(/* i18n */ { id: 'Other' })}
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

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pt-2.5 pb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
              {i18n._(/* i18n */ { id: 'Spending and trading' })}
            </span>
            {showResetSpent && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-chia-text-muted">
                  <span className="font-mono text-chia-text-secondary">{spentXch}</span> {currencyCode}{' '}
                  {i18n._(/* i18n */ { id: 'used' })}
                </span>
                {/* Checkbox styled as a button: ticks a hidden form field that
                    main reads on Save (resets spentMojos to 0). Lets the user
                    clear the counter without leaving the Edit dialog. */}
                <label className="cursor-pointer select-none">
                  <input type="checkbox" data-form-field="resetSpent" className="peer sr-only" />
                  <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-chia-border-strong text-chia-text-secondary hover:border-chia-primary hover:text-chia-primary peer-checked:bg-chia-primary-soft peer-checked:text-chia-primary peer-checked:border-chia-primary transition-colors">
                    <span className="peer-checked-hidden">{i18n._(/* i18n */ { id: 'Reset' })}</span>
                  </span>
                </label>
              </div>
            )}
          </div>
          {/* Auto amount stays editable regardless of selection — only consumed when 'auto'. */}
          <div className="px-5 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-chia-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="spendingMode"
                value="ask"
                defaultChecked={spendingMode === 'ask'}
                data-form-field="spendingMode"
                className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
              />
              <span className="text-sm font-medium text-chia-text">{i18n._(/* i18n */ { id: 'Ask each time' })}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="spendingMode"
                value="block"
                defaultChecked={spendingMode === 'block'}
                data-form-field="spendingMode"
                className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
              />
              <span className="text-sm font-medium text-chia-text">{i18n._(/* i18n */ { id: 'Block' })}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="spendingMode"
                value="auto"
                defaultChecked={spendingMode === 'auto'}
                data-form-field="spendingMode"
                className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
              />
              <span className="text-sm font-medium text-chia-text">{i18n._(/* i18n */ { id: 'Auto up to' })}</span>
              <input
                type="number"
                min="0"
                step="0.000000000001"
                defaultValue={defaultCapXch}
                data-form-field="spendingCapXch"
                className="w-38 px-2 py-1 rounded-md border border-chia-border-strong bg-chia-bg text-sm font-mono text-chia-text focus:outline-none focus:border-chia-primary focus:ring-2 focus:ring-chia-primary/20"
              />
              <span className="text-sm font-semibold uppercase tracking-wider text-chia-text-secondary">
                {currencyCode}
              </span>
            </label>
          </div>
          <div className="px-5 pb-2.5 text-xs text-chia-text-muted leading-snug">
            {i18n._(/* i18n */ { id: "Spending adds up to this total. We'll ask again once it's reached." })}
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
