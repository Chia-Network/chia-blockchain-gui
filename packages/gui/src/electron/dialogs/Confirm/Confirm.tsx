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

function getFormattedData(
  command: string,
  data: Record<string, unknown>,
  networkPrefix?: string,
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
        { field: 'address', label: i18n._(/* i18n */ { id: 'Address' }), value: data.inner_address as string },
        { field: 'amount', label: i18n._(/* i18n */ { id: 'Amount' }), value: humanizeCAT(data.amount as number) },
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
  reason?: string;
};

export type ConfirmProps = {
  confirmId: string;
  networkPrefix?: string;
  data: Record<string, unknown>;
  command: string;
  principal?: ConfirmPrincipal;
  styleURL?: string;
  isDarkMode?: boolean;
};

export default function Confirm(props: ConfirmProps) {
  const { data, command, principal, styleURL, confirmId, isDarkMode, networkPrefix } = props;

  const hasData = !!data && Object.keys(data).length > 0;
  const hasDataOrCommand = hasData || !!command;

  const title = getTitle(command);
  const message = getMessage(command);
  const confirmButtonText = getConfirmButtonText(command);
  const destructive = isDestructiveCommand(command);
  const formattedData = getFormattedData(command, data, networkPrefix).filter(({ value }) => value !== undefined);

  const confirmButtonClasses = destructive
    ? 'bg-chia-danger hover:brightness-110 text-white border-transparent'
    : 'bg-chia-primary hover:bg-chia-primary-hover text-[#0f252a] border-transparent';

  return (
    <div
      className="grid h-screen bg-chia-bg text-chia-text text-base"
      style={{ gridTemplateRows: '1fr auto' }}
    >
      <div className="min-h-0 flex flex-col gap-5 px-7 pt-7 overflow-hidden">
        {principal && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-chia-primary-soft border border-chia-border">
            <div className="shrink-0 w-8 h-8 rounded-md bg-chia-primary/20 text-chia-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path
                  fillRule="evenodd"
                  d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">
                  Request from
                </span>
                <span className="text-base font-semibold truncate text-chia-text">{principal.name}</span>
              </div>
              {principal.url && <div className="mt-0.5 text-sm text-chia-text-secondary truncate">{principal.url}</div>}
            </div>
            {principal.reason && (
              <span className="shrink-0 text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-chia-card text-chia-text-secondary">
                {principal.reason}
              </span>
            )}
          </div>
        )}

        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
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
            <p className="mt-2 mb-0 text-base leading-relaxed text-chia-text-secondary">{message}</p>
          </div>
        </div>

        {hasDataOrCommand && (
          <SandboxedIframe className="w-full flex-1 border-0" isDarkMode={isDarkMode}>
            <link href={styleURL} type="text/css" rel="stylesheet" />
            <div className="flex flex-col gap-3 h-full text-chia-text font-sans text-base">
              {!!command && (
                <div className="rounded-xl border border-chia-border bg-chia-card px-5 py-4">
                  <div className="text-xs font-semibold tracking-wider uppercase text-chia-text-muted">
                    Command
                  </div>
                  <pre className="m-0 mt-2 text-sm font-mono break-all whitespace-pre-wrap text-chia-text">
                    {command}
                  </pre>
                </div>
              )}

              {hasData && (
                <div className="flex flex-col gap-3">
                  {!!formattedData.length && (
                    <div className="rounded-xl border border-chia-border bg-chia-card divide-y divide-chia-border">
                      {formattedData.map(({ field, label, value }) => (
                        <div className="px-5 py-3.5" key={field}>
                          <div className="text-xs font-semibold tracking-wider uppercase text-chia-text-muted">
                            {label}
                          </div>
                          <div className="mt-1.5 text-base font-medium break-all whitespace-pre-wrap text-chia-text">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Collapsible title="Raw data">
                    <pre className="m-0 text-xs font-mono leading-relaxed break-all whitespace-pre-wrap overflow-x-auto text-chia-text-secondary">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </Collapsible>
                </div>
              )}
            </div>
          </SandboxedIframe>
        )}
      </div>

      <div className="flex justify-end gap-2.5 px-7 py-4 border-t border-chia-border bg-chia-bg">
        <button
          type="button"
          data-action="cancel"
          className="px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-md border border-chia-primary bg-transparent text-chia-primary hover:bg-chia-primary-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary"
        >
          {i18n._(/* i18n */ { id: 'Cancel' })}
        </button>
        <button
          type="button"
          id={confirmId}
          className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-md border shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-chia-primary focus-visible:ring-offset-2 focus-visible:ring-offset-chia-bg ${confirmButtonClasses}`}
        >
          {confirmButtonText}
        </button>
      </div>
    </div>
  );
}
