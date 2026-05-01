import React from 'react';

import { i18n } from '../../../config/locales';

import type { Capability, PairGrants, PairMetadata } from '../../permissions/types';

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

type CapabilityRow = {
  key: Capability;
  label: string;
  description: string;
  preset: 'gaming' | 'optional';
};

const CAPABILITY_ROWS: CapabilityRow[] = [
  {
    key: 'read',
    label: 'Read account info',
    description: 'View balances, addresses, and wallet list. Cannot move funds.',
    preset: 'gaming',
  },
  {
    key: 'watch',
    label: 'Watch on-chain activity',
    description: 'Subscribe to coin updates and read block height. Cannot move funds.',
    preset: 'gaming',
  },
  {
    key: 'walletCreate',
    label: 'Create derived wallets',
    description: 'Create new sub-wallets needed for game state. No on-chain effect.',
    preset: 'gaming',
  },
  {
    key: 'sign',
    label: 'Sign messages',
    description: 'Sign arbitrary messages. Used for off-chain authentication.',
    preset: 'optional',
  },
  {
    key: 'offer',
    label: 'Create and accept offers',
    description: 'Create, take, and cancel offers. Locks assets until resolved.',
    preset: 'optional',
  },
  {
    key: 'spend',
    label: 'Spend up to the cap',
    description: 'Submit transactions automatically up to the per-transaction cap below.',
    preset: 'gaming',
  },
];

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
      watch: true,
      walletCreate: true,
      sign: false,
      offer: false,
      spend: true,
    },
    spendingCapMojos: 1_000_000_000, // 0.001 XCH default
  };

  const defaultCapXch = (grants.spendingCapMojos / MOJOS_PER_XCH).toString();

  const hasUrl = !!metadata.url && metadata.url !== '#' && metadata.url.trim().length > 0;
  const wallets = Array.isArray(availableWallets) ? availableWallets : [];

  return (
    <div className="flex flex-col h-screen bg-chia-bg text-chia-text text-base">
      <div
        className="flex-1 min-h-0 px-7 pt-5 pb-5 flex flex-col gap-3.5"
        style={{ overflowY: 'scroll' }}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-chia-primary-soft text-chia-primary flex items-center justify-center text-xl font-bold uppercase">
            {(metadata.name || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="m-0 text-2xl font-semibold leading-tight text-chia-text truncate">
              {metadata.name || 'Unknown application'}
            </h1>
            {hasUrl && (
              <div className="mt-1 text-sm text-chia-text-secondary truncate">{metadata.url}</div>
            )}
            <p className="mt-1.5 mb-0 text-sm leading-snug text-chia-text-secondary">
              {isEdit
                ? i18n._(/* i18n */ { id: 'Update what this application is allowed to do.' })
                : i18n._(/* i18n */ { id: 'Choose what this app can do. Revoke any time.' })}
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <header className="px-5 py-2.5 border-b border-chia-border">
            <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
              {i18n._(/* i18n */ { id: 'Wallets' })}
            </div>
          </header>
          {wallets.length === 0 ? (
            <div className="px-5 py-3 text-sm text-chia-text-secondary">
              {i18n._(/* i18n */ { id: 'No wallets available.' })}
            </div>
          ) : (
            <ul className="m-0 p-0 list-none divide-y divide-chia-border">
              {wallets.map((wallet) => {
                const checked = defaultFingerprints.includes(wallet.fingerprint);
                return (
                  <li key={wallet.fingerprint}>
                    <label className="flex items-center gap-3.5 px-5 py-2.5 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                      <input
                        type="checkbox"
                        name="wallets"
                        value={String(wallet.fingerprint)}
                        defaultChecked={checked}
                        data-form-field="wallets"
                        data-multi=""
                        className="w-[18px] h-[18px] accent-chia-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 flex items-baseline gap-2">
                        <div className="text-base font-medium text-chia-text truncate leading-tight">
                          {wallet.name || `Wallet ${wallet.fingerprint}`}
                        </div>
                        <div className="text-sm font-mono text-chia-text-muted truncate">
                          {wallet.fingerprint}
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
          <header className="px-5 py-2.5 border-b border-chia-border">
            <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
              {i18n._(/* i18n */ { id: 'Permissions' })}
            </div>
          </header>
          <ul className="m-0 p-0 list-none divide-y divide-chia-border">
            {CAPABILITY_ROWS.map((row) => (
              <li key={row.key}>
                <label className="flex items-center gap-3.5 px-5 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                  <input
                    type="checkbox"
                    defaultChecked={grants.capabilities[row.key]}
                    data-form-field={`cap-${row.key}`}
                    className="w-[18px] h-[18px] accent-chia-primary cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
                    <span className="text-base font-medium text-chia-text leading-tight">{row.label}</span>
                    {row.preset === 'gaming' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-chia-primary-soft text-chia-primary">
                        gaming
                      </span>
                    )}
                    <span className="text-sm text-chia-text-secondary leading-snug">— {row.description}</span>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-chia-border bg-chia-card px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted shrink-0">
              {i18n._(/* i18n */ { id: 'Per-tx cap' })}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.000000000001"
                defaultValue={defaultCapXch}
                data-form-field="spendingCapXch"
                className="w-32 px-3 py-1.5 rounded-md border border-chia-border-strong bg-chia-bg text-base font-mono text-chia-text focus:outline-none focus:border-chia-primary focus:ring-2 focus:ring-chia-primary/20"
              />
              <span className="text-sm font-semibold uppercase tracking-wider text-chia-text-secondary">XCH</span>
            </div>
          </div>
          <div className="mt-1.5 text-sm text-chia-text-secondary leading-snug">
            {i18n._(/* i18n */ { id: 'At or below: silent. Above: asks to confirm.' })}
          </div>
        </section>

        <section className="rounded-xl border border-chia-border bg-chia-card px-5 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Auto-revoke after' })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { value: 'session', label: i18n._(/* i18n */ { id: 'When app disconnects' }) },
              { value: '24h', label: i18n._(/* i18n */ { id: '24 hours' }) },
              { value: '7d', label: i18n._(/* i18n */ { id: '7 days' }) },
              { value: 'never', label: i18n._(/* i18n */ { id: 'Until I revoke' }) },
            ].map((option, idx) => (
              <label
                key={option.value}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-chia-border hover:border-chia-primary cursor-pointer transition-colors has-[:checked]:border-chia-primary has-[:checked]:bg-chia-primary-soft"
              >
                <input
                  type="radio"
                  name="expiry"
                  value={option.value}
                  defaultChecked={idx === 0}
                  data-form-field="expiry"
                  className="w-[18px] h-[18px] accent-chia-primary cursor-pointer"
                />
                <span className="text-sm text-chia-text">{option.label}</span>
              </label>
            ))}
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
