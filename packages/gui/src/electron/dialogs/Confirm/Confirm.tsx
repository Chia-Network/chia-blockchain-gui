import React from 'react';

import { i18n } from '../../../config/locales';
import Collapsible from '../../components/Collapsible';
import SandboxedIframe from '../../components/SandboxedIframe';

export type ConfirmPrincipal = {
  kind: 'pair';
  name: string;
  url?: string;
  icon?: string;
  description?: string;
};

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

/**
 * Pre-formatted, GUI-only enrichment computed by main from `data` (via daemon
 * RPCs). The renderer never sees this; main builds it in
 * `electron/utils/dappEnrichment.ts` and `renderConfirm.ts`.
 */
export type ConfirmDisplay = {
  cat?: { displayName: string; isRevocable: boolean };
  offer?: {
    offered: ConfirmOfferLine[];
    requested: ConfirmOfferLine[];
    fee?: string;
  };
};

export type ConfirmOfferLine =
  | { kind: 'xch'; amount: string }
  | { kind: 'cat'; amount: string; assetId: string; symbol?: string }
  | { kind: 'nft'; nftId: string; name?: string; previewUrl?: string };

/** A single label/value row resolved from the schema. */
export type ConfirmRow = {
  field: string;
  label: string;
  value: string;
};

export type ConfirmProps = {
  confirmId: string;
  /** Pre-resolved per-command label and copy from `confirmSchemas`. */
  title: string;
  message: string;
  confirmLabel: string;
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
  principal?: ConfirmPrincipal;
  fingerprint?: ConfirmFingerprint;
  /** Show the "Don't ask again for this command" checkbox. Set by main only
   *  for pair-principal prompts on commands that don't have a spending
   *  classification — bypass should not let dapps slip past the budget. */
  showBypassToggle?: boolean;
  styleURL?: string;
  isDarkMode?: boolean;
};

// Inline SVG fallback for the dapp icon. Used as the second layer in a CSS
// multi-layer background — when the dapp's icon URL fails to load (or isn't
// provided), the fallback shows. Pure CSS; no script needed, which matters
// because the dialog HTML is server-rendered and the CSP blocks inline event
// handlers.
const DAPP_ICON_FALLBACK_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%235ece71'><path fill-rule='evenodd' d='M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z' clip-rule='evenodd'/></svg>";

function buildIconBackground(iconUrl?: string): React.CSSProperties {
  const fallback = `url(${JSON.stringify(DAPP_ICON_FALLBACK_SVG)})`;
  const primary = iconUrl ? `url(${JSON.stringify(iconUrl)}), ${fallback}` : fallback;
  return {
    backgroundImage: primary,
    backgroundSize: iconUrl ? 'cover, 50%' : '50%',
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

function offerLineKey(line: ConfirmOfferLine, index: number): string {
  if (line.kind === 'xch') return `xch-${line.amount}-${index}`;
  if (line.kind === 'cat') return `cat-${line.assetId}-${line.amount}-${index}`;
  return `nft-${line.nftId}-${index}`;
}

function OfferLineRow({ line, networkPrefix }: { line: ConfirmOfferLine; networkPrefix?: string }) {
  if (line.kind === 'xch') {
    // Inline `{amount} {unit}` matches the FEE row in the offer card so a
    // single-line summary doesn't look like a wide-spaced table row.
    return (
      <div className="text-sm font-medium text-chia-text">
        {line.amount} {networkPrefix ? networkPrefix.toUpperCase() : 'XCH'}
      </div>
    );
  }
  if (line.kind === 'cat') {
    return (
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-chia-text">
          {line.amount}
          {line.symbol && <span className="ml-1 text-chia-text-secondary">{line.symbol}</span>}
        </span>
        <span className="text-xs font-mono text-chia-text-secondary truncate max-w-[55%]">
          {shortenId(line.assetId)}
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
      </div>
    </div>
  );
}

function OfferSummarySection({
  offer,
  networkPrefix,
}: {
  offer: NonNullable<ConfirmDisplay['offer']>;
  networkPrefix?: string;
}) {
  const feeUnit = networkPrefix ? networkPrefix.toUpperCase() : 'XCH';
  return (
    <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden divide-y divide-chia-border">
      <div className="px-5 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
          {i18n._(/* i18n */ { id: 'Offered' })}
        </div>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {offer.offered.length === 0 ? (
            <span className="text-sm text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Nothing' })}</span>
          ) : (
            offer.offered.map((line, i) => (
              <OfferLineRow key={offerLineKey(line, i)} line={line} networkPrefix={networkPrefix} />
            ))
          )}
        </div>
      </div>
      <div className="px-5 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
          {i18n._(/* i18n */ { id: 'Requested' })}
        </div>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {offer.requested.length === 0 ? (
            <span className="text-sm text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Nothing' })}</span>
          ) : (
            offer.requested.map((line, i) => (
              <OfferLineRow key={offerLineKey(line, i)} line={line} networkPrefix={networkPrefix} />
            ))
          )}
        </div>
      </div>
      {offer.fee !== undefined && (
        <div className="px-5 py-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
            {i18n._(/* i18n */ { id: 'Fee' })}
          </div>
          <div className="mt-0.5 text-sm font-medium text-chia-text">
            {offer.fee} {feeUnit}
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
    principal,
    fingerprint,
    showBypassToggle = false,
    styleURL,
    confirmId,
    isDarkMode,
  } = props;

  const hasData = !!data && Object.keys(data).length > 0;
  const offerDisplay = display?.offer;

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

          {principal && (
            <div className="flex items-start gap-3 px-4 py-2.5 rounded-xl border border-chia-border bg-chia-primary-soft">
              <div
                className="shrink-0 w-9 h-9 rounded-md bg-chia-primary/20"
                style={buildIconBackground(principal.icon)}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                    {i18n._(/* i18n */ { id: 'Request from' })}
                  </span>
                  <span className="text-sm font-semibold truncate text-chia-text">{principal.name}</span>
                </div>
                {isDisplayableUrl(principal.url) && (
                  <div className="text-xs text-chia-text-secondary truncate">{principal.url}</div>
                )}
                {principal.description && (
                  <div className="mt-1 text-xs text-chia-text-secondary truncate">{principal.description}</div>
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

          {offerDisplay && <OfferSummarySection offer={offerDisplay} networkPrefix={networkPrefix} />}

          {hasData && (
            <Collapsible title="Raw data">
              <pre className="m-0 text-xs font-mono leading-relaxed break-all whitespace-pre-wrap text-chia-text-secondary">
                {JSON.stringify(data, null, 2)}
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
              data-form-field="bypass"
              className="w-[16px] h-[16px] accent-chia-primary cursor-pointer"
            />
            <span>{i18n._(/* i18n */ { id: "Don't ask again for this command" })}</span>
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
            className={`h-9 px-5 text-sm font-semibold uppercase tracking-wider rounded-md border shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary focus-visible:ring-offset-2 focus-visible:ring-offset-chia-bg ${confirmButtonClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
