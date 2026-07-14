import React, { type ReactNode } from 'react';

import { i18n } from '../../../config/locales';
import Collapsible from '../../components/Collapsible';
import SandboxedIframe from '../../components/SandboxedIframe';
import type { PairRecord } from '../../utils/pairSchemas';

export type ConfirmFingerprint = {
  /** Fingerprint the dapp wants the call to run under. */
  requested: number;
  /** Fingerprint of the wallet currently logged into the UI. */
  current?: number;
  /** Human label for `requested` (the wallet's nickname), if known. */
  requestedLabel?: string;
  /** Human label for `current`, if known. */
  currentLabel?: string;
};

export type DisplayWalletDeltaItem =
  | { kind: 'xch'; amount: string; amountWithRoyalties?: string }
  | { kind: 'wallet'; walletId: string; amount: string; walletName?: string; amountWithRoyalties?: string }
  | { kind: 'cat'; amount: string; assetId: string; symbol?: string; amountWithRoyalties?: string }
  | { kind: 'nft'; nftId: string; name?: string; previewUrl?: string; royaltyPercentage?: number }
  | { kind: 'unknown'; assetId: string; amount: string };

export type DisplayWalletDelta = {
  spending: DisplayWalletDeltaItem[];
  receiving: DisplayWalletDeltaItem[];
  fee?: string;
};

export type ConfirmDisplay = {
  cat?: { displayName: string; isRevocable: boolean };
  walletDelta?: DisplayWalletDelta;
};

/** A single label/value row resolved from the schema. */
export type ConfirmRow = {
  field: string;
  label: string;
  value: string;
};

export type ConfirmProps = {
  // dialog props
  confirmId: string;

  // visible base props
  title: string;
  message: string;
  confirmLabel: ReactNode;
  destructive: boolean;
  /** Pre-resolved param rows from `renderConfirm` (label/value pairs). */
  rows: ConfirmRow[];
  /** Daemon-derived offer summary / CAT info; rendered if present. */
  display?: ConfirmDisplay;
  /** Raw data sent on the wire. Shown verbatim in the "Raw data" collapsible. */
  data: Record<string, unknown>;
  /** Namespaced RPC name shown in the Command card. */
  command: string;
  networkPrefix?: string;
  pair?: PairRecord;
  fingerprint?: ConfirmFingerprint;
  /** Show the "Always allow this command without asking" checkbox for dapp pair requests. */
  showBypassToggle?: boolean;
  styleURL?: string;
  isDarkMode?: boolean;
};

// Only emit a background-image when the dapp's icon is a real https URL.
// Sandbox CSP enforces this too, but filtering here keeps the markup clean
// and dodges console noise from blocked data:/file: schemes.
function buildIconBackground(iconUrl?: string): React.CSSProperties {
  if (!iconUrl || !/^https:\/\//i.test(iconUrl)) return {};
  return {
    backgroundImage: `url(${JSON.stringify(iconUrl)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

function isDisplayableUrl(value: string | undefined): boolean {
  if (!value) return false;
  // Filter out obvious placeholders ('#', '/') and any non-http(s) scheme.
  return /^https?:\/\//i.test(value);
}

function shortenId(id: string, head = 12, tail = 8): string {
  if (id.length <= head + tail + 3) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

function offerLineKey(line: DisplayWalletDeltaItem, index: number): string {
  if (line.kind === 'xch') return `xch-${line.amount}-${index}`;
  if (line.kind === 'wallet') return `wallet-${line.walletId}-${line.amount}-${index}`;
  if (line.kind === 'cat') return `cat-${line.assetId}-${line.amount}-${index}`;
  if (line.kind === 'unknown') return `unknown-${line.assetId}-${line.amount}-${index}`;
  return `nft-${line.nftId}-${index}`;
}

function OfferLineRow({ line, networkPrefix }: { line: DisplayWalletDeltaItem; networkPrefix?: string }) {
  if (line.kind === 'xch') {
    // Inline `{amount} {unit}` matches the FEE row in the offer card so a
    // single-line summary doesn't look like a wide-spaced table row.
    return (
      <div>
        <div className="text-sm font-medium text-chia-text">
          {line.amount} {networkPrefix ? networkPrefix.toUpperCase() : 'XCH'}
        </div>
        {line.amountWithRoyalties && (
          <div className="text-xs text-chia-text-secondary">
            {i18n._(/* i18n */ { id: 'Total Amount with Royalties' })}: {line.amountWithRoyalties}{' '}
            {networkPrefix ? networkPrefix.toUpperCase() : 'XCH'}
          </div>
        )}
      </div>
    );
  }
  if (line.kind === 'cat') {
    return (
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-chia-text">
            {line.amount}
            {line.symbol && <span className="ml-1 text-chia-text-secondary">{line.symbol}</span>}
          </span>
          <span className="text-xs font-mono text-chia-text-secondary truncate max-w-[55%]">
            {shortenId(line.assetId)}
          </span>
        </div>
        {line.amountWithRoyalties && (
          <div className="text-xs text-chia-text-secondary">
            {i18n._(/* i18n */ { id: 'Total Amount with Royalties' })}: {line.amountWithRoyalties}
            {line.symbol && <span className="ml-1">{line.symbol}</span>}
          </div>
        )}
      </div>
    );
  }
  if (line.kind === 'wallet') {
    return (
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-chia-text">{line.amount}</span>
          <span className="text-xs font-mono text-chia-text-secondary truncate max-w-[55%]">
            {line.walletName ?? `${i18n._(/* i18n */ { id: 'Wallet ID' })} ${shortenId(line.walletId)}`}
          </span>
        </div>
        {line.amountWithRoyalties && (
          <div className="text-xs text-chia-text-secondary">
            {i18n._(/* i18n */ { id: 'Total Amount with Royalties' })}: {line.amountWithRoyalties}
          </div>
        )}
      </div>
    );
  }
  if (line.kind === 'unknown') {
    return (
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-medium text-chia-text">{i18n._(/* i18n */ { id: 'Unknown Asset' })}</span>
        <span className="text-xs font-mono text-chia-text-secondary truncate max-w-[55%]">
          {shortenId(line.assetId)}
        </span>
        <span className="text-xs font-mono text-chia-text-secondary">
          {i18n._(/* i18n */ { id: 'Raw Amount' })}: {line.amount}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      {line.previewUrl ? (
        <img
          src={line.previewUrl}
          alt=""
          className="shrink-0 w-10 h-10 rounded-md object-cover bg-chia-card"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="shrink-0 w-10 h-10 rounded-md bg-chia-primary/15 text-chia-primary flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">
          NFT
        </div>
      )}
      <div className="flex-1 min-w-0">
        {line.name && <div className="text-sm font-medium text-chia-text truncate">{line.name}</div>}
        <span className="text-xs font-mono text-chia-text-secondary truncate block">{shortenId(line.nftId)}</span>
        {line.royaltyPercentage !== undefined && line.royaltyPercentage > 0 && (
          <div className="text-xs font-mono text-chia-text-secondary truncate block">
            {i18n._(/* i18n */ { id: 'Royalties Percentage' })}: {line.royaltyPercentage / 100}%
          </div>
        )}
      </div>
    </div>
  );
}

function WalletDeltaSection({
  walletDelta,
  networkPrefix,
}: {
  walletDelta: NonNullable<ConfirmDisplay['walletDelta']>;
  networkPrefix?: string;
}) {
  const feeUnit = networkPrefix ? networkPrefix.toUpperCase() : 'XCH';
  return (
    <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden divide-y divide-chia-border">
      <div className="px-5 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
          {i18n._(/* i18n */ { id: 'You Spend' })}
        </div>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {walletDelta.spending.length === 0 ? (
            <span className="text-sm text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Nothing' })}</span>
          ) : (
            walletDelta.spending.map((line, i) => (
              <OfferLineRow key={offerLineKey(line, i)} line={line} networkPrefix={networkPrefix} />
            ))
          )}
        </div>
      </div>
      <div className="px-5 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
          {i18n._(/* i18n */ { id: 'You Receive' })}
        </div>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {walletDelta.receiving.length === 0 ? (
            <span className="text-sm text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Nothing' })}</span>
          ) : (
            walletDelta.receiving.map((line, i) => (
              <OfferLineRow key={offerLineKey(line, i)} line={line} networkPrefix={networkPrefix} />
            ))
          )}
        </div>
      </div>
      {walletDelta.fee !== undefined && (
        <div className="px-5 py-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Offer Fees' })}
          </div>
          <div className="mt-0.5 text-sm font-medium text-chia-text">
            {walletDelta.fee} {feeUnit}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Confirm(props: ConfirmProps) {
  const {
    title,
    message,
    confirmLabel,
    destructive,
    rows,
    display,
    data,
    command,
    networkPrefix,
    pair,
    fingerprint,
    showBypassToggle = false,
    styleURL,
    confirmId,
    isDarkMode,
  } = props;

  const hasData = !!data && Object.keys(data).length > 0;
  const walletDelta = display?.walletDelta;

  const requestedFingerprint = fingerprint?.requested;
  const currentFingerprint = fingerprint?.current;
  const requestedKeyLabel = fingerprint?.requestedLabel;
  const currentKeyLabel = fingerprint?.currentLabel;
  const isDifferentFingerprint =
    requestedFingerprint !== undefined &&
    currentFingerprint !== undefined &&
    requestedFingerprint !== currentFingerprint;
  const formatKey = (label?: string, fp?: number) => (label ? `${label} (${fp})` : String(fp));

  const confirmButtonClasses = destructive
    ? 'bg-chia-danger hover:brightness-110 text-white border-transparent'
    : 'bg-chia-primary hover:bg-chia-primary-hover text-[#0f252a] border-transparent';

  return (
    <div className="flex flex-col h-screen bg-chia-bg text-chia-text text-base">
      {/*
       * Iframe is the entire body. Flex column on the outer (rather than CSS
       * Grid) so the replaced iframe element actually stretches with
       * `flex-1 min-h-0`. Inside the iframe document an h-screen
       * overflow-y-auto wrapper is the scroll container; that puts the
       * scrollbar on a regular div, which macOS doesn't hide as an overlay.
       * Footer stays in the parent document so its button click handlers
       * reach `confirmId` and `[data-action="cancel"]`.
       */}
      <SandboxedIframe className="flex-1 min-h-0 w-full border-0" isDarkMode={isDarkMode}>
        <link href={styleURL} type="text/css" rel="stylesheet" />
        <div className="h-screen overflow-y-auto px-7 pt-4 pb-4 space-y-3 text-chia-text font-sans text-base">
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                destructive ? 'bg-chia-danger/15 text-chia-danger' : 'bg-chia-primary-soft text-chia-primary'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
                aria-hidden="true"
              >
                {destructive ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                )}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="m-0 text-2xl font-semibold leading-tight text-chia-text">{title}</h1>
              <p className="mt-0.5 mb-0 text-sm leading-snug text-chia-text-secondary">{message}</p>
            </div>
          </div>

          {pair && (
            <div className="flex items-start gap-3 px-4 py-2.5 rounded-xl border border-chia-border bg-chia-primary-soft">
              <div
                className="shrink-0 w-9 h-9 rounded-md bg-chia-primary/20"
                style={buildIconBackground(pair.metadata.icon)}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                    {i18n._(/* i18n */ { id: 'Request from' })}
                  </span>
                  <span className="text-sm font-semibold truncate text-chia-text">{pair.metadata.name}</span>
                </div>
                {isDisplayableUrl(pair.metadata.url) && (
                  <div className="text-xs text-chia-text-secondary truncate">{pair.metadata.url}</div>
                )}
                {pair.metadata.description && (
                  <div className="mt-1 text-xs text-chia-text-secondary truncate">{pair.metadata.description}</div>
                )}
              </div>
            </div>
          )}

          {isDifferentFingerprint && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-chia-warning/30 bg-chia-warning/10 text-chia-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="shrink-0 w-5 h-5 mt-0.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{i18n._(/* i18n */ { id: 'Different wallet key' })}</div>
                <div className="mt-0.5 text-xs">
                  {i18n._('This app is asking to run under {requested}, but {current} is currently logged in.', {
                    requested: formatKey(requestedKeyLabel, requestedFingerprint),
                    current: formatKey(currentKeyLabel, currentFingerprint),
                  })}
                </div>
              </div>
            </div>
          )}

          {!!command && (
            <section className="rounded-xl border border-chia-border bg-chia-card px-5 py-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">Command</div>
              <div className="mt-1 text-sm font-mono break-all text-chia-text">{command}</div>
            </section>
          )}

          {walletDelta && <WalletDeltaSection walletDelta={walletDelta} networkPrefix={networkPrefix} />}

          {rows.length > 0 && (
            <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden divide-y divide-chia-border">
              {rows.map(({ field, label, value }) => (
                <div className="px-5 py-2.5" key={field}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">{label}</div>
                  <div className="mt-0.5 text-sm font-medium break-all whitespace-pre-wrap text-chia-text">{value}</div>
                </div>
              ))}
            </section>
          )}

          {hasData && (
            <Collapsible title="Raw data">
              <pre className="m-0 text-xs font-mono leading-relaxed break-all whitespace-pre-wrap text-chia-text-secondary">
                {JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2)}
              </pre>
            </Collapsible>
          )}
        </div>
      </SandboxedIframe>

      <div className="flex justify-between items-center gap-2.5 px-7 py-4 border-t border-chia-border bg-chia-bg">
        {showBypassToggle ? (
          <label className="flex items-center gap-2 text-xs text-chia-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              data-form-field="rememberBypass"
              className="w-[16px] h-[16px] accent-chia-primary cursor-pointer"
            />
            <span>{i18n._(/* i18n */ { id: 'Always allow this command without asking' })}</span>
          </label>
        ) : (
          <span aria-hidden="true" />
        )}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-action="cancel"
            className="h-9 px-5 text-sm font-semibold uppercase tracking-wider rounded-md border border-chia-primary bg-transparent text-chia-primary hover:bg-chia-primary-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary"
          >
            {i18n._(/* i18n */ { id: 'Cancel' })}
          </button>
          <button
            type="button"
            id={confirmId}
            data-payload='{"isAllowed":true,"rememberBypass":false}'
            className={`h-9 px-5 text-sm font-semibold uppercase tracking-wider rounded-md border shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary focus-visible:ring-offset-2 focus-visible:ring-offset-chia-bg ${confirmButtonClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
