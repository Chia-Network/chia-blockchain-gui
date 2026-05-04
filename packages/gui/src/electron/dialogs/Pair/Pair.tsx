import BigNumber from 'bignumber.js';
import React from 'react';

import { i18n } from '../../../config/locales';

import type { PairGrants, PairMetadata } from '../../permissions/types';

const MOJOS_PER_XCH = new BigNumber('1000000000000');

export type PairWalletOption = {
  fingerprint: number;
  name?: string;
};

export type PairProps = {
  confirmId: string;
  metadata: PairMetadata;
  availableWallets: PairWalletOption[];
  defaultGrants?: PairGrants;
  defaultFingerprints?: number[];
  isEdit?: boolean;
  /** Mojos already auto-spent against the cap. Display-only; reset lives in the menu. */
  defaultSpentMojos?: string;
  currencyCode?: string;
  /** Wire form `chia_<name>`. Display-only; main persists this if confirmed. */
  allowedCommands?: string[];
  /** Wire form. Asked for but dropped because this wallet doesn't support them. */
  rejectedCommands?: string[];
  styleURL?: string;
  isDarkMode?: boolean;
};

// Kept in pair.commands for WC SDK compatibility but hidden from the dialog
// since they grant nothing and would just be a meaningless toggle.
const HIDDEN_COMMANDS = new Set(['chia_requestPermissions']);

// chia_sendTransaction → "Send Transaction"; chia_getNFTs → "Get NFTs".
// Acronym pass first so NFT/DID stay glued; then split camelCase.
function humanizeWcCommand(name: string): string {
  if (!name) return name;
  const bare = name.startsWith('chia_') ? name.slice('chia_'.length) : name;
  const spaced = bare
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}


export function getTitle(isEdit: boolean) {
  return isEdit
    ? i18n._(/* i18n */ { id: 'Edit Connection' })
    : i18n._(/* i18n */ { id: 'Connect Application' });
}

export default function Pair(props: PairProps) {
  const {
    confirmId,
    metadata,
    availableWallets,
    defaultGrants,
    defaultFingerprints = [],
    isEdit = false,
    defaultSpentMojos,
    currencyCode = 'XCH',
    allowedCommands: allowedCommandsRaw = [],
    rejectedCommands: rejectedCommandsRaw = [],
  } = props;

  const allowedCommands = allowedCommandsRaw.filter((wc) => !HIDDEN_COMMANDS.has(wc));
  const rejectedCommands = rejectedCommandsRaw.filter((wc) => !HIDDEN_COMMANDS.has(wc));

  const grants: PairGrants = defaultGrants ?? {
    capabilities: {
      balance: false,
      innocuous: false,
      sign: false,
      offer: false,
      spend: false,
      notifications: false,
    },
    spendingMode: 'ask',
    spendingCapMojos: '10000000000', // 0.01 XCH default budget when user picks auto
  };

  const defaultCapXch = new BigNumber(grants.spendingCapMojos ?? 0).div(MOJOS_PER_XCH).toFixed();
  const spentXch = new BigNumber(defaultSpentMojos ?? 0).div(MOJOS_PER_XCH).toFixed();
  const showSpentRow = isEdit && (grants.spendingMode ?? 'ask') === 'auto';
  const innocuousChecked = grants.capabilities.innocuous;
  const balanceChecked = grants.capabilities.balance;
  const signChecked = grants.capabilities.sign;
  const notificationsChecked = grants.capabilities.notifications;
  const spendingMode = grants.spendingMode ?? 'ask';

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
                              <span className="text-chia-text-muted font-mono ml-2">
                                ({wallet.fingerprint})
                              </span>
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

        {(allowedCommands.length > 0 || rejectedCommands.length > 0) && (
          <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
            <details className="group">
              <summary className="flex items-center justify-between gap-3 px-5 py-2.5 cursor-pointer list-none select-none hover:bg-chia-card-elevated transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                    {i18n._(/* i18n */ { id: 'Requested commands' })}
                  </span>
                  <span className="text-xs text-chia-text-secondary">
                    {rejectedCommands.length > 0
                      ? `${allowedCommands.length} / ${allowedCommands.length + rejectedCommands.length}`
                      : String(allowedCommands.length)}
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
              <div className="px-5 pb-3 pt-1 border-t border-chia-border space-y-2">
                {allowedCommands.length > 0 && (
                  <div>
                    <div className="text-xs text-chia-text-muted mb-1">
                      {i18n._(/* i18n */ { id: 'Allowed commands' })}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allowedCommands.map((wc) => (
                        <span
                          key={wc}
                          title={wc}
                          className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-chia-primary-soft text-chia-text font-medium"
                        >
                          {humanizeWcCommand(wc)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {rejectedCommands.length > 0 && (
                  <div>
                    <div className="text-xs text-chia-text-muted mb-1">
                      {i18n._(/* i18n */ { id: 'Not supported and excluded' })}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
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
          </section>
        )}

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <div className="px-5 pt-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Allow without asking' })}
          </div>
          <ul className="m-0 p-0 list-none divide-y divide-chia-border border-t border-chia-border">
            <li>
              <label className="flex items-center gap-3 px-5 py-1.5 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={innocuousChecked}
                  data-form-field="cap-innocuous"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span className="flex-1 min-w-0 text-sm leading-snug">
                  <span className="font-medium text-chia-text">
                    {i18n._(/* i18n */ { id: 'Innocuous actions' })}
                  </span>
                  <span className="text-chia-text-secondary">
                    {': '}
                    {i18n._(/* i18n */ { id: 'reads accounts, makes wallets' })}
                  </span>
                </span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 px-5 py-1.5 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={balanceChecked}
                  data-form-field="cap-balance"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span className="flex-1 min-w-0 text-sm leading-snug">
                  <span className="font-medium text-chia-text">
                    {i18n._(/* i18n */ { id: 'Show balances' })}
                  </span>
                  <span className="text-chia-text-secondary">
                    {': '}
                    {i18n._(/* i18n */ { id: 'sees how much you hold' })}
                  </span>
                </span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 px-5 py-1.5 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={signChecked}
                  data-form-field="cap-sign"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span className="flex-1 min-w-0 text-sm leading-snug">
                  <span className="font-medium text-chia-text">
                    {i18n._(/* i18n */ { id: 'Sign messages' })}
                  </span>
                  <span className="text-chia-text-secondary">
                    {': '}
                    {i18n._(/* i18n */ { id: 'login or proof of ownership' })}
                  </span>
                </span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 px-5 py-1.5 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={notificationsChecked}
                  data-form-field="cap-notifications"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span className="flex-1 min-w-0 text-sm leading-snug">
                  <span className="font-medium text-chia-text">
                    {i18n._(/* i18n */ { id: 'Show notifications' })}
                  </span>
                  <span className="text-chia-text-secondary">
                    {': '}
                    {i18n._(/* i18n */ { id: 'offers and announcements' })}
                  </span>
                </span>
              </label>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <div className="px-5 pt-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Spending and trading' })}
          </div>
          {showSpentRow && (
            <div className="px-5 py-2 border-t border-chia-border text-sm text-chia-text-secondary">
              {spentXch} / {defaultCapXch} {currencyCode} {i18n._(/* i18n */ { id: 'used' })}
            </div>
          )}
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
              <span className="text-sm font-medium text-chia-text">
                {i18n._(/* i18n */ { id: 'Ask each time' })}
              </span>
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
              <span className="text-sm font-medium text-chia-text">
                {i18n._(/* i18n */ { id: 'Block' })}
              </span>
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
              <span className="text-sm font-medium text-chia-text">
                {i18n._(/* i18n */ { id: 'Auto up to' })}
              </span>
              <input
                type="number"
                min="0"
                step="0.000000000001"
                defaultValue={defaultCapXch}
                data-form-field="spendingCapXch"
                className="w-24 px-2 py-1 rounded-md border border-chia-border-strong bg-chia-bg text-sm font-mono text-chia-text focus:outline-none focus:border-chia-primary focus:ring-2 focus:ring-chia-primary/20"
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
