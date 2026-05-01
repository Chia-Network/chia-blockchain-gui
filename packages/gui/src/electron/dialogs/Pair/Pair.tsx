import React from 'react';

import { i18n } from '../../../config/locales';

import type { PairGrants, PairMetadata } from '../../permissions/types';

const MOJOS_PER_XCH = 1_000_000_000_000;

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
  styleURL?: string;
  isDarkMode?: boolean;
};


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
  } = props;

  const grants: PairGrants = defaultGrants ?? {
    capabilities: {
      read: true,
      balance: false,
      innocuous: true,
      sign: false,
      offer: false,
      spend: false,
    },
    spendingMode: 'ask',
    spendingCapMojos: 10_000_000_000, // 0.01 XCH default budget
  };

  const defaultCapXch = (grants.spendingCapMojos / MOJOS_PER_XCH).toString();
  const innocuousChecked = grants.capabilities.innocuous;
  const balanceChecked = grants.capabilities.balance;
  const signChecked = grants.capabilities.sign;
  const spendingMode = grants.spendingMode ?? 'ask';

  const hasUrl = !!metadata.url && metadata.url !== '#' && metadata.url.trim().length > 0;
  const wallets = Array.isArray(availableWallets) ? availableWallets : [];

  return (
    <div
      className="grid h-screen bg-chia-bg text-chia-text text-base"
      style={{ gridTemplateRows: '1fr auto' }}
    >
      <div
        className="min-h-0 px-7 pt-4 pb-4 space-y-3"
        style={{ overflowY: 'auto' }}
      >
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

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <div className="px-5 pt-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Allow without asking' })}
          </div>
          <ul className="m-0 p-0 list-none divide-y divide-chia-border border-t border-chia-border">
            <li>
              <label className="flex items-start gap-3 px-5 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={innocuousChecked}
                  data-form-field="cap-innocuous"
                  className="mt-[3px] w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-chia-text leading-tight">
                    {i18n._(/* i18n */ { id: 'Innocuous actions' })}
                  </div>
                  <div className="mt-0.5 text-sm text-chia-text-secondary leading-snug">
                    {i18n._(/* i18n */ { id: 'Reads accounts and creates wallets. Cannot move funds.' })}
                  </div>
                </div>
              </label>
            </li>
            <li>
              <label className="flex items-start gap-3 px-5 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={balanceChecked}
                  data-form-field="cap-balance"
                  className="mt-[3px] w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-chia-text leading-tight">
                    {i18n._(/* i18n */ { id: 'Show balances' })}
                  </div>
                  <div className="mt-0.5 text-sm text-chia-text-secondary leading-snug">
                    {i18n._(/* i18n */ { id: 'Lets the app see how much you hold across your wallets.' })}
                  </div>
                </div>
              </label>
            </li>
            <li>
              <label className="flex items-start gap-3 px-5 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={signChecked}
                  data-form-field="cap-sign"
                  className="mt-[3px] w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-chia-text leading-tight">
                    {i18n._(/* i18n */ { id: 'Sign messages' })}
                  </div>
                  <div className="mt-0.5 text-sm text-chia-text-secondary leading-snug">
                    {i18n._(/* i18n */ { id: 'Sign messages for login or proof of ownership.' })}
                  </div>
                </div>
              </label>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <div className="px-5 pt-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Spending and trading' })}
          </div>
          <div className="border-t border-chia-border divide-y divide-chia-border">
            <label className="flex flex-col px-5 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="spendingMode"
                  value="ask"
                  defaultChecked={spendingMode === 'ask'}
                  data-form-field="spendingMode"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span className="text-sm font-medium text-chia-text">
                  {i18n._(/* i18n */ { id: 'Ask me each time' })}
                </span>
              </div>
              <div className="mt-0.5 ml-[30px] text-sm text-chia-text-secondary leading-snug">
                {i18n._(/* i18n */ { id: 'You confirm every spend, trade, or NFT transfer.' })}
              </div>
            </label>

            <label className="flex flex-col px-5 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="spendingMode"
                  value="block"
                  defaultChecked={spendingMode === 'block'}
                  data-form-field="spendingMode"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span className="text-sm font-medium text-chia-text">
                  {i18n._(/* i18n */ { id: "Don't allow at all" })}
                </span>
              </div>
              <div className="mt-0.5 ml-[30px] text-sm text-chia-text-secondary leading-snug">
                {i18n._(/* i18n */ { id: 'Refuse without asking. The app cannot move funds.' })}
              </div>
            </label>

            <label className="flex flex-col px-5 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="radio"
                  name="spendingMode"
                  value="auto"
                  defaultChecked={spendingMode === 'auto'}
                  data-form-field="spendingMode"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                />
                <span className="text-sm font-medium text-chia-text">
                  {i18n._(/* i18n */ { id: 'Auto-approve up to' })}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.000000000001"
                  defaultValue={defaultCapXch}
                  data-form-field="spendingCapXch"
                  className="w-28 px-2 py-1 rounded-md border border-chia-border-strong bg-chia-bg text-sm font-mono text-chia-text focus:outline-none focus:border-chia-primary focus:ring-2 focus:ring-chia-primary/20"
                />
                <span className="text-sm font-semibold uppercase tracking-wider text-chia-text-secondary">XCH</span>
              </div>
              <div className="mt-0.5 ml-[30px] text-sm text-chia-text-secondary leading-snug">
                {i18n._(/* i18n */ {
                  id: "Spends go through silently up to this amount. After that, it'll ask you.",
                })}
              </div>
            </label>
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
