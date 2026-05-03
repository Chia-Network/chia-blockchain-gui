import React, { type ReactNode } from 'react';

import { i18n } from '../../../config/locales';
import Collapsible from '../../components/Collapsible';
import SandboxedIframe from '../../components/SandboxedIframe';
import mojoToCatLocaleString from '../../utils/mojoToCATLocaleString';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';

function humanizeChia(amount: string | number | undefined, networkPrefix: string | undefined) {
  if (amount === undefined) {
    return undefined;
  }

  const chiaAmount = mojoToChiaLocaleString(amount);
  if (networkPrefix) {
    return `${chiaAmount} ${networkPrefix.toUpperCase()}`;
  }

  return chiaAmount;
}

function humanizeCAT(amount: string | number | undefined) {
  if (amount === undefined) {
    return undefined;
  }

  const catAmount = mojoToCatLocaleString(amount);
  return `${catAmount}`;
}

export function getTitle(command: string) {
  switch (command) {
    case 'chia_harvester.remove_plot_directory':
      return i18n._(/* i18n */ { id: 'Confirm Remove Plot Directory' });
    case 'chia_wallet.send_transaction':
      return i18n._(/* i18n */ { id: 'Confirm Send Transaction' });
    case 'chia_harvester.delete_plot':
      return i18n._(/* i18n */ { id: 'Confirm Delete Plot' });
    case 'chia_harvester.add_plot_directory':
      return i18n._(/* i18n */ { id: 'Confirm Add Plot Directory' });
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return i18n._(/* i18n */ { id: 'Confirm NFT Transfer' });
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
      return i18n._(/* i18n */ { id: 'Confirm Disconnect' });
    case 'chia_wallet.sign_message_by_address':
      return i18n._(/* i18n */ { id: 'Confirm Sign Message' });
    case 'chia_wallet.create_new_wallet':
      return i18n._(/* i18n */ { id: 'Confirm Create New Wallet' });
    case 'chia_wallet.set_auto_claim':
      return i18n._(/* i18n */ { id: 'Confirm Set Auto Claim' });
    case 'chia_wallet.set_payout_instructions':
      return i18n._(/* i18n */ { id: 'Confirm Set Payout Instructions' });
    case 'chia_wallet.nft_set_nft_did':
      return i18n._(/* i18n */ { id: 'Confirm Move NFT to DID' });
    case 'chia_wallet.nft_set_did_bulk':
      return i18n._(/* i18n */ { id: 'Confirm Move NFTs to DID' });
    case 'chia_wallet.create_offer_for_ids':
      return i18n._(/* i18n */ { id: 'Confirm Create Offer' });
    case 'chia_full_node.open_connection':
      return i18n._(/* i18n */ { id: 'Confirm Open Connection' });
    case 'chia_farmer.set_payout_instructions':
      return i18n._(/* i18n */ { id: 'Confirm Set Payout Instructions' });
    case 'chia_wallet.delete_key':
      return i18n._(/* i18n */ { id: 'Confirm Delete Wallet' });
    default:
      return i18n._(/* i18n */ { id: 'Confirm' });
  }
}

function getMessage(command: string) {
  switch (command) {
    case 'chia_wallet.send_transaction':
      return i18n._(/* i18n */ { id: 'Please carefully review and confirm this blockchain transaction.' });
    case 'chia_wallet.cat_spend':
      return i18n._(/* i18n */ { id: 'Please carefully review and confirm this CAT spend.' });
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' });
    case 'chia_wallet.create_offer_for_ids':
      return i18n._(
        /* i18n */ {
          id: 'Please carefully review and confirm this offer creation. When creating an offer, any assets that are being offered will be locked and unavailable until the offer is accepted or cancelled, resulting in your spendable balance changing.',
        },
      );
    case 'chia_wallet.take_offer':
      return i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer acceptance.' });
    case 'chia_wallet.cancel_offer':
      return i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer cancellation.' });
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
      return i18n._(/* i18n */ { id: 'Are you sure you want to disconnect?' });
    case 'daemon.stop_plotting':
      return i18n._(/* i18n */ { id: 'Are you sure you want to stop plotting? The plot cannot be recovered.' });
    case 'chia_harvester.delete_plot':
      return i18n._(/* i18n */ { id: 'Are you sure you want to delete the plot? The plot cannot be recovered.' });
    case 'chia_harvester.remove_plot_directory':
      return i18n._(/* i18n */ { id: 'Are you sure you want to remove the plot directory?' });
    case 'chia_wallet.sign_message_by_id':
    case 'chia_wallet.sign_message_by_address':
      return i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' });
    case 'chia_wallet.create_new_wallet':
      return i18n._(/* i18n */ { id: 'Are you sure you want to create a new wallet?' });
    case 'chia_wallet.set_auto_claim':
      return i18n._(/* i18n */ { id: 'Are you sure you want to set auto claim?' });
    case 'chia_wallet.set_payout_instructions':
      return i18n._(/* i18n */ { id: 'Are you sure you want to set payout instructions?' });
    case 'chia_wallet.nft_set_nft_did':
      return i18n._(/* i18n */ { id: 'Are you sure you want to move this NFT to the specified profile?' });
    case 'chia_wallet.nft_set_did_bulk':
      return i18n._(/* i18n */ { id: 'Are you sure you want to move these NFTs to the specified profile?' });
    case 'chia_full_node.open_connection':
      return i18n._(/* i18n */ { id: 'Are you sure you want to open a connection to the specified node?' });
    case 'chia_farmer.set_payout_instructions':
      return i18n._(/* i18n */ { id: 'Are you sure you want to set payout instructions?' });
    case 'chia_wallet.delete_key':
      return i18n._(/* i18n */ { id: 'Are you sure you want to delete this wallet?' });
    default:
      return i18n._(/* i18n */ { id: 'Please review and confirm this action.' });
  }
}

function getConfirmButtonText(command: string) {
  switch (command) {
    case 'chia_wallet.send_transaction':
    case 'chia_wallet.cat_spend':
      return i18n._(/* i18n */ { id: 'Send' });
    case 'daemon.stop_plotting':
      return i18n._(/* i18n */ { id: 'Stop' });
    case 'chia_harvester.delete_plot':
    case 'chia_wallet.delete_key':
      return i18n._(/* i18n */ { id: 'Delete' });
    case 'chia_harvester.add_plot_directory':
      return i18n._(/* i18n */ { id: 'Add' });
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return i18n._(/* i18n */ { id: 'Transfer' });
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
      return i18n._(/* i18n */ { id: 'Disconnect' });
    case 'chia_full_node.open_connection':
      return i18n._(/* i18n */ { id: 'Connect' });
    case 'chia_wallet.sign_message_by_id':
    case 'chia_wallet.sign_message_by_address':
      return i18n._(/* i18n */ { id: 'Sign' });
    case 'chia_wallet.create_new_wallet':
      return i18n._(/* i18n */ { id: 'Create' });
    case 'chia_wallet.set_auto_claim':
    case 'chia_farmer.set_payout_instructions':
      return i18n._(/* i18n */ { id: 'Set' });
    case 'chia_wallet.nft_set_nft_did':
    case 'chia_wallet.nft_set_did_bulk':
      return i18n._(/* i18n */ { id: 'Move' });
    case 'chia_wallet.create_offer_for_ids':
      return i18n._(/* i18n */ { id: 'Create' });
    default:
      return i18n._(/* i18n */ { id: 'Proceed' });
  }
}

function isDestructiveCommand(command: string) {
  switch (command) {
    case 'chia_harvester.delete_plot':
    case 'chia_wallet.delete_key':
    case 'chia_harvester.remove_plot_directory':
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
    case 'daemon.stop_plotting':
    case 'chia_wallet.cancel_offer':
      return true;
    default:
      return false;
  }
}

function humanizeCATWithSymbol(amount: string | number | undefined, symbol?: string) {
  if (amount === undefined) return undefined;
  const formatted = mojoToCatLocaleString(amount);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

function getFormattedData(
  command: string,
  data: Record<string, unknown>,
  networkPrefix?: string,
  display?: ConfirmDisplay,
): {
  field: string;
  label: ReactNode;
  value: string | undefined;
}[] {
  switch (command) {
    case 'chia_wallet.send_transaction':
      return [
        { field: 'address', label: i18n._(/* i18n */ { id: 'Address' }), value: data.address as string },
        {
          field: 'amount',
          label: i18n._(/* i18n */ { id: 'Amount' }),
          value: humanizeChia(data.amount as number, networkPrefix),
        },
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as number, networkPrefix),
        },
      ];
    case 'chia_wallet.cat_spend':
      return [
        {
          field: 'address',
          label: i18n._(/* i18n */ { id: 'Address' }),
          value: (data.inner_address ?? data.innerAddress) as string,
        },
        {
          field: 'amount',
          label: display?.cat?.isRevocable
            ? i18n._(/* i18n */ { id: 'Amount (revocable token)' })
            : i18n._(/* i18n */ { id: 'Amount' }),
          value: humanizeCATWithSymbol(data.amount as number, display?.cat?.displayName),
        },
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as number, networkPrefix),
        },
      ];
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return [
        {
          field: 'target_address',
          label: i18n._(/* i18n */ { id: 'Target Address' }),
          value: data.target_address as string,
        },
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as string, networkPrefix),
        },
      ];
    case 'chia_wallet.cancel_offer':
      return [
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as string, networkPrefix),
        },
      ];
    case 'chia_harvester.delete_plot':
      return [{ field: 'filename', label: i18n._(/* i18n */ { id: 'Filename' }), value: data.filename as string }];
    case 'chia_harvester.add_plot_directory':
    case 'chia_harvester.remove_plot_directory':
      return [{ field: 'directory', label: i18n._(/* i18n */ { id: 'Directory' }), value: data.dirname as string }];
    case 'chia_farmer.set_payout_instructions':
      return [
        {
          field: 'payout_instructions',
          label: i18n._(/* i18n */ { id: 'Payout Instructions' }),
          value: data.payout_instructions as string,
        },
      ];
    case 'chia_wallet.set_auto_claim':
      return [
        { field: 'auto_claim', label: i18n._(/* i18n */ { id: 'Enabled' }), value: data.enabled ? 'Yes' : 'No' },
        {
          field: 'tx_fee',
          label: i18n._(/* i18n */ { id: 'Transaction Fee' }),
          value: humanizeChia(data.tx_fee as string, networkPrefix),
        },
        {
          field: 'min_amount',
          label: i18n._(/* i18n */ { id: 'Min Amount' }),
          value: humanizeChia(data.min_amount as string, networkPrefix),
        },
      ];
    case 'chia_wallet.create_new_wallet':
      return [
        { field: 'name', label: i18n._(/* i18n */ { id: 'Name' }), value: data.wallet_name as string },
        { field: 'type', label: i18n._(/* i18n */ { id: 'Type' }), value: data.wallet_type as string },
        { field: 'asset_id', label: i18n._(/* i18n */ { id: 'Asset ID' }), value: data.asset_id as string },
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as string, networkPrefix),
        },
      ];
    case 'chia_wallet.sign_message_by_address':
      return [
        { field: 'address', label: i18n._(/* i18n */ { id: 'Address' }), value: data.address as string },
        { field: 'message', label: i18n._(/* i18n */ { id: 'Message' }), value: data.message as string },
      ];
    case 'chia_wallet.sign_message_by_id':
      return [
        { field: 'id', label: i18n._(/* i18n */ { id: 'Id' }), value: data.id as string },
        { field: 'message', label: i18n._(/* i18n */ { id: 'Message' }), value: data.message as string },
      ];
    case 'chia_wallet.nft_set_nft_did':
      return [
        { field: 'did_id', label: i18n._(/* i18n */ { id: 'DID' }), value: data.did_id as string },
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as string, networkPrefix),
        },
      ];
    case 'chia_wallet.nft_set_did_bulk':
      return [
        { field: 'did_id', label: i18n._(/* i18n */ { id: 'DID' }), value: data.did_id as string },
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as string, networkPrefix),
        },
      ];
    case 'chia_wallet.create_offer_for_ids':
      return [
        {
          field: 'fee',
          label: i18n._(/* i18n */ { id: 'Fee' }),
          value: humanizeChia(data.fee as string, networkPrefix),
        },
      ];
    case 'chia_full_node.open_connection':
      return [
        { field: 'host', label: i18n._(/* i18n */ { id: 'Host' }), value: data.host as string },
        { field: 'port', label: i18n._(/* i18n */ { id: 'Port' }), value: data.port as string },
      ];
    case 'chia_wallet.delete_key':
      return [
        { field: 'fingerprint', label: i18n._(/* i18n */ { id: 'Fingerprint' }), value: data.fingerprint as string },
      ];
    default:
      return [];
  }
}

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
 * Pre-formatted, GUI-only enrichment computed by the renderer (where the
 * asset registry and offer parser live) and forwarded across IPC. Main does
 * no conversion — it just renders these strings/lines.
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
  | { kind: 'cat'; amount: string; assetId: string }
  | { kind: 'nft'; nftId: string; name?: string; previewUrl?: string };

export type ConfirmProps = {
  confirmId: string;
  networkPrefix?: string;
  data: Record<string, unknown>;
  command: string;
  display?: ConfirmDisplay;
  principal?: ConfirmPrincipal;
  fingerprint?: ConfirmFingerprint;
  styleURL?: string;
  isDarkMode?: boolean;
};

// Inline SVG fallback for the dapp icon. Used as the second layer in a
// CSS multi-layer background — when the dapp's icon URL fails to load (or
// isn't provided), the next layer renders. Pure CSS; no script needed,
// which matters because the dialog HTML is server-rendered and the CSP
// blocks inline event handlers.
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
  // Filter out obvious placeholders ('#', '/', empty fragment-only) and any
  // non-http(s) scheme. Real dapps will always have a proper https URL.
  return /^https?:\/\//i.test(value);
}

function shortenId(id: string, head = 12, tail = 8): string {
  if (id.length <= head + tail + 3) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

function OfferLineRow({ line, networkPrefix }: { line: ConfirmOfferLine; networkPrefix?: string }) {
  if (line.kind === 'xch') {
    return (
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-chia-text">{line.amount}</span>
        <span className="text-xs uppercase tracking-wider text-chia-text-muted">
          {networkPrefix ? networkPrefix.toUpperCase() : 'XCH'}
        </span>
      </div>
    );
  }
  if (line.kind === 'cat') {
    return (
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-chia-text">{line.amount}</span>
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
            offer.offered.map((line, i) => <OfferLineRow key={i} line={line} networkPrefix={networkPrefix} />)
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
            offer.requested.map((line, i) => <OfferLineRow key={i} line={line} networkPrefix={networkPrefix} />)
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
  const { data, command, principal, display, fingerprint, styleURL, confirmId, isDarkMode, networkPrefix } = props;

  const hasData = !!data && Object.keys(data).length > 0;

  const title = getTitle(command);
  const message = getMessage(command);
  const confirmButtonText = getConfirmButtonText(command);
  const destructive = isDestructiveCommand(command);
  const formattedData = getFormattedData(command, data, networkPrefix, display).filter(
    ({ value }) => value !== undefined,
  );
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
       * The iframe is the entire body of the dialog. Flex column on the outer
       * (rather than CSS Grid) is deliberate: replaced elements like iframes
       * don't honor `align-self: stretch` in grid cells and percentage heights
       * on grid items have indefinite resolution, so the iframe would sit at
       * its intrinsic 300×150 and leave a huge gap above the footer. With
       * `flex-1 min-h-0` the iframe actually stretches to fill remaining space.
       *
       * Inside the iframe document, an h-screen overflow-y-auto wrapper is the
       * scroll container — `100vh` resolves to the iframe element's allotted
       * height, and putting the scrollbar on a regular div surfaces it on
       * macOS, where the iframe's native scrollbar is hidden as an overlay.
       *
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
                <div className="text-sm font-semibold">
                  {i18n._(/* i18n */ { id: 'Different wallet key' })}
                </div>
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
              <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                Command
              </div>
              <div className="mt-1 text-sm font-mono break-all text-chia-text">{command}</div>
            </section>
          )}

          {hasData && !!formattedData.length && (
            <section className="rounded-xl border border-chia-border bg-chia-card overflow-hidden divide-y divide-chia-border">
              {formattedData.map(({ field, label, value }) => (
                <div className="px-5 py-2.5" key={field}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                    {label}
                  </div>
                  <div className="mt-0.5 text-sm font-medium break-all whitespace-pre-wrap text-chia-text">
                    {value}
                  </div>
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

      <div className="flex justify-end items-center gap-2.5 px-7 py-4 border-t border-chia-border bg-chia-bg">
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
          {confirmButtonText}
        </button>
      </div>
    </div>
  );
}
