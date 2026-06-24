import React, { useMemo } from 'react';

import { i18n } from '../../../config/locales';
import { type Key } from '../../api/getKeys';
import { DappCommands } from '../../commands/DappCommands';
import { classifyDappCommands } from '../../commands/classifyDappCommands';
import { filterRequestedDappCommands } from '../../commands/filterRequestedDappCommands';
import { humanizeDappCommandName } from '../../commands/humanizeDappCommandName';
import type { PairRecord, PairMetadata } from '../../utils/pairSchemas';

export function getTitle(isEdit: boolean) {
  return isEdit ? i18n._(/* i18n */ { id: 'Edit Connection' }) : i18n._(/* i18n */ { id: 'Connect Application' });
}

function allSelected(list: string[], selected: string[]): boolean {
  const selectedSet = new Set(selected);

  if (list.length === 0) {
    return false;
  }

  return list.every((item) => selectedSet.has(item));
}

type CapabilityGroup = {
  key: 'innocuous' | 'balance' | 'sign' | 'notifications';
  label: string;
  description: string;
  commands: string[];
  defaultChecked: boolean;
};

export type PairProps = {
  // dialog
  confirmId: string;

  // dapp data
  metadata: PairMetadata;
  commands: string[]; // dapp commands requested by the dapp

  // data from daemon
  keys: Key[];
  currentFingerprint: number | undefined;

  // for editing a pair
  pair?: PairRecord;
};

export default function Pair(props: PairProps) {
  const {
    // dialog
    confirmId,

    // dapp data
    metadata,
    commands = [],

    // daemon data
    keys,
    currentFingerprint,

    // edit pair data
    pair,
  } = props;

  const isEdit = !!pair;

  const bypass = useMemo(() => (pair ? pair.bypass : []), [pair]);
  const bypassSet = useMemo(() => new Set(bypass), [bypass]);

  const selectedFingerprint = pair?.fingerprint ?? currentFingerprint;

  const { allowed, rejected } = filterRequestedDappCommands(commands);
  const groups = classifyDappCommands(allowed);
  const bypassable = (dappCommand: string) => DappCommands.get(dappCommand)?.allowConfirmationBypass === true;
  const requiresConfirmation = (dappCommand: string) => !bypassable(dappCommand);
  const bypassableInnocuous = groups.innocuous.filter(bypassable);
  const bypassableBalance = groups.balance.filter(bypassable);
  const bypassableSign = groups.sign.filter(bypassable);
  const bypassableNotifications = groups.notifications.filter(bypassable);
  const bypassableSpending = groups.spending.filter(bypassable);
  const bypassableOther = groups.other.filter(bypassable);
  const confirmationRequiredGroups = [
    {
      label: i18n._(/* i18n */ { id: 'Innocuous actions' }),
      commands: groups.innocuous.filter(requiresConfirmation),
    },
    {
      label: i18n._(/* i18n */ { id: 'Show balances' }),
      commands: groups.balance.filter(requiresConfirmation),
    },
    {
      label: i18n._(/* i18n */ { id: 'Sign messages' }),
      commands: groups.sign.filter(requiresConfirmation),
    },
    {
      label: i18n._(/* i18n */ { id: 'Show notifications' }),
      commands: groups.notifications.filter(requiresConfirmation),
    },
    {
      label: i18n._(/* i18n */ { id: 'Spending commands' }),
      commands: groups.spending.filter(requiresConfirmation),
    },
    {
      label: i18n._(/* i18n */ { id: 'Other commands' }),
      commands: groups.other.filter(requiresConfirmation),
    },
  ];
  const hasConfirmationRequiredCommands = confirmationRequiredGroups.some((group) => group.commands.length > 0);
  const hasBypassableCommands = (group: CapabilityGroup) => group.commands.length > 0;

  const allCapabilityGroups: CapabilityGroup[] = [
    {
      key: 'innocuous',
      label: i18n._(/* i18n */ { id: 'Innocuous actions' }),
      description: i18n._(/* i18n */ { id: 'reads accounts, NFTs, and offers' }),
      commands: bypassableInnocuous,
      defaultChecked: allSelected(bypassableInnocuous, bypass),
    },
    {
      key: 'balance',
      label: i18n._(/* i18n */ { id: 'Show balances' }),
      description: i18n._(/* i18n */ { id: 'sees how much you hold' }),
      commands: bypassableBalance,
      defaultChecked: allSelected(bypassableBalance, bypass),
    },
    {
      key: 'sign',
      label: i18n._(/* i18n */ { id: 'Sign messages' }),
      description: i18n._(/* i18n */ { id: 'signs text with your key' }),
      commands: bypassableSign,
      defaultChecked: allSelected(bypassableSign, bypass),
    },
    {
      key: 'notifications',
      label: i18n._(/* i18n */ { id: 'Show notifications' }),
      description: i18n._(/* i18n */ { id: 'shows you offers and updates' }),
      commands: bypassableNotifications,
      defaultChecked: allSelected(bypassableNotifications, bypass),
    },
  ];
  const capabilityGroups = allCapabilityGroups.filter(hasBypassableCommands);

  const hasUrl = !!metadata.url && metadata.url !== '#' && metadata.url.trim().length > 0;
  const wallets = Array.isArray(keys) ? keys : [];
  const selectedWallet = wallets.find((wallet) => wallet.fingerprint === selectedFingerprint);
  const selectedWalletLabel = selectedWallet?.label ?? (selectedFingerprint ? `Wallet ${selectedFingerprint}` : undefined);

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
            {isEdit ? (
              <div className="flex items-center gap-3 mx-3 mb-3 px-3 py-2 rounded-md border border-chia-border-strong bg-chia-bg">
                {selectedFingerprint ? (
                  <>
                    <span className="shrink-0 w-[18px] h-[18px] rounded-full border-2 border-chia-primary flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-chia-primary" />
                    </span>
                    <div className="flex-1 min-w-0 text-sm truncate">
                      <span className="font-medium text-chia-text">{selectedWalletLabel}</span>
                      <span className="text-chia-text-muted font-mono ml-2">({selectedFingerprint})</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-chia-text-secondary">
                    {i18n._(/* i18n */ { id: 'No wallet key selected.' })}
                  </div>
                )}
              </div>
            ) : wallets.length === 0 ? (
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
                        data-chip-for="fingerprint"
                        data-chip-value={String(wallet.fingerprint)}
                        style={{
                          display: wallet.fingerprint === selectedFingerprint ? '' : 'none',
                        }}
                        className="inline-flex items-center text-sm px-2 py-0.5 rounded bg-chia-primary-soft text-chia-text font-medium max-w-[200px] truncate"
                      >
                        {wallet.label || `Wallet ${wallet.fingerprint}`}
                      </span>
                    ))}
                    <span
                      data-empty-placeholder="fingerprint"
                      style={{ display: selectedFingerprint === undefined ? '' : 'none' }}
                      className="text-sm text-chia-text-secondary"
                    >
                      {i18n._(/* i18n */ { id: 'Select a wallet key…' })}
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
                      const checked = wallet.fingerprint === selectedFingerprint;
                      return (
                        <li key={wallet.fingerprint}>
                          <label className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                            <input
                              type="radio"
                              name="fingerprint"
                              value={String(wallet.fingerprint)}
                              defaultChecked={checked}
                              data-form-field="fingerprint"
                              className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
                            />
                            <span className="flex-1 min-w-0 text-sm truncate">
                              <span className="font-medium text-chia-text">
                                {wallet.label || `Wallet ${wallet.fingerprint}`}
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

        {(capabilityGroups.length > 0 || allowed.length > 0) && (
          <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden">
            {capabilityGroups.length > 0 && (
              <>
                <div className="px-5 pt-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                  {i18n._(/* i18n */ { id: 'Allow without asking' })}
                </div>
                <ul className="m-0 p-0 list-none divide-y divide-chia-border border-t border-chia-border">
                  {capabilityGroups.map((group) => (
                    <li key={group.key}>
                      <label className="flex items-center gap-3 px-5 py-1.5 cursor-pointer hover:bg-chia-card-elevated transition-colors">
                        <input
                          type="checkbox"
                          defaultChecked={group.defaultChecked}
                          data-cap-toggle={group.key}
                          className="w-[18px] h-[18px] accent-chia-primary shrink-0"
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
                  ))}
                </ul>
              </>
            )}
          {allowed.length > 0 && (
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
                {bypassableSpending.length > 0 && (
                  <PerCommandGroup
                    label={i18n._(/* i18n */ { id: 'Spending commands' })}
                    capKey={undefined}
                    commands={bypassableSpending}
                    bypassSet={bypassSet}
                  />
                )}
                {bypassableOther.length > 0 && (
                  <PerCommandGroup
                    label={i18n._(/* i18n */ { id: 'Other commands' })}
                    capKey={undefined}
                    commands={bypassableOther}
                    bypassSet={bypassSet}
                  />
                )}
                {hasConfirmationRequiredCommands && (
                  <div className="border-b border-chia-border last:border-b-0">
                    <div className="px-5 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                      {i18n._(/* i18n */ { id: 'Always ask for confirmation' })}
                    </div>
                    {confirmationRequiredGroups.map((group) => (
                      <ReadOnlyCommandGroup key={group.label} label={group.label} commands={group.commands} />
                    ))}
                  </div>
                )}
                {rejected.length > 0 && (
                  <div className="border-b border-chia-border last:border-b-0">
                    <div className="px-5 pt-2 pb-1 text-xs text-chia-text-muted">
                      {i18n._(/* i18n */ { id: 'Not supported and excluded' })}
                    </div>
                    <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                      {rejected.map((dappCommand) => (
                        <span
                          key={dappCommand}
                          title={dappCommand}
                          className="inline-flex items-center text-xs px-2 py-0.5 rounded border border-chia-border-strong text-chia-text-secondary font-medium"
                        >
                          {humanizeDappCommandName(dappCommand)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
          </section>
        )}

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
          data-payload='{"allowPair":true}'
          className="px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-md border border-transparent bg-chia-primary hover:bg-chia-primary-hover text-[#0f252a] shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary focus-visible:ring-offset-2 focus-visible:ring-offset-chia-bg"
        >
          {isEdit ? i18n._(/* i18n */ { id: 'Save changes' }) : i18n._(/* i18n */ { id: 'Connect' })}
        </button>
      </div>
    </div>
  );
}

function ReadOnlyCommandGroup({ label, commands }: { label: string; commands: string[] }) {
  if (commands.length === 0) return null;
  return (
    <div>
      <div className="px-5 pt-2 pb-1 text-xs text-chia-text-muted">{label}</div>
      <div className="px-5 pb-2 flex flex-wrap gap-1.5">
        {commands.map((dappCommand) => (
          <span
            key={dappCommand}
            title={dappCommand}
            className="inline-flex items-center text-xs px-2 py-0.5 rounded border border-chia-border-strong text-chia-text-secondary font-medium"
          >
            {humanizeDappCommandName(dappCommand)}
          </span>
        ))}
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
        {commands.map((dappCommand) => (
          <li key={dappCommand}>
            <label className="flex items-center gap-3 px-5 py-1 cursor-pointer hover:bg-chia-card-elevated transition-colors">
              <input
                type="checkbox"
                defaultChecked={bypassSet.has(dappCommand)}
                data-form-field="bypass"
                data-multi=""
                value={dappCommand}
                data-cap-group={capKey}
                className="w-[18px] h-[18px] accent-chia-primary cursor-pointer shrink-0"
              />
              <span className="text-sm text-chia-text font-mono truncate" title={dappCommand}>
                {humanizeDappCommandName(dappCommand)}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
