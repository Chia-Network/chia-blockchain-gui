import React, { type ReactNode } from 'react';

import Collapsible from '../../components/Collapsible';
import SandboxedIframe from '../../components/SandboxedIframe';
import mojoToCatLocaleString from '../../utils/mojoToCATLocaleString';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';

function humanizeChia(amount: string | number | undefined, networkPrefix: string) {
  if (amount === undefined) {
    return undefined;
  }

  const chiaAmount = mojoToChiaLocaleString(amount);
  return `${chiaAmount} ${networkPrefix.toUpperCase()}`;
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
      return 'Confirm Remove Plot Directory';
    case 'chia_wallet.send_transaction':
      return 'Confirm Send Transaction';
    case 'chia_harvester.delete_plot':
      return 'ConfirmDelete Plot';
    case 'chia_harvester.add_plot_directory':
      return 'Confirm Add Plot Directory';
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return 'Confirm NFT Transfer';
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
      return 'Confirm Disconnect';
    case 'chia_wallet.sign_message_by_address':
      return 'Confirm Sign Message';
    case 'chia_wallet.create_new_wallet':
      return 'Confirm Create New Wallet';
    case 'chia_wallet.set_auto_claim':
      return 'Confirm Set Auto Claim';
    case 'chia_wallet.set_payout_instructions':
      return 'Confirm Set Payout Instructions';
    case 'chia_wallet.nft_set_nft_did':
      return 'Confirm Move NFT to DID';
    case 'chia_wallet.nft_set_did_bulk':
      return 'Confirm Move NFTs to DID';
    case 'chia_wallet.create_offer_for_ids':
      return 'Confirm Create Offer';
    case 'chia_full_node.open_connection':
      return 'Confirm Open Connection';
    case 'chia_farmer.set_payout_instructions':
      return 'Confirm Set Payout Instructions';
    case 'chia_wallet.delete_key':
      return 'Confirm Delete Wallet';
    default:
      return 'Confirm';
  }
}

function getMessage(command: string) {
  switch (command) {
    case 'chia_wallet.send_transaction':
      return 'Please carefully review and confirm this blockchain transaction. This action cannot be undone.';
    case 'chia_wallet.cat_spend':
      return 'Please carefully review and confirm this CAT spend. This action cannot be undone.';
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return 'Please carefully review and confirm this NFT transfer. This action cannot be undone.';
    case 'chia_wallet.create_offer_for_ids':
      return 'Please carefully review and confirm this offer creation. When creating an offer, any assets that are being offered will be locked and unavailable until the offer is accepted or cancelled, resulting in your spendable balance changing.';
    case 'chia_wallet.take_offer':
      return 'Please carefully review and confirm this offer acceptance. This action cannot be undone.';
    case 'chia_wallet.cancel_offer':
      return 'Please carefully review and confirm this offer cancellation. This action cannot be undone.';
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
      return 'Are you sure you want to disconnect?';
    case 'daemon.stop_plotting':
      return 'Are you sure you want to stop plotting? The plot cannot be recovered.';
    case 'chia_harvester.delete_plot':
      return 'Are you sure you want to delete the plot? The plot cannot be recovered.';
    case 'chia_harvester.remove_plot_directory':
      return 'Are you sure you want to remove the plot directory?';
    case 'chia_wallet.sign_message_by_id':
    case 'chia_wallet.sign_message_by_address':
      return 'Are you sure you want to sign this message?';
    case 'chia_wallet.create_new_wallet':
      return 'Are you sure you want to create a new wallet?';
    case 'chia_wallet.set_auto_claim':
      return 'Are you sure you want to set auto claim?';
    case 'chia_wallet.set_payout_instructions':
      return 'Are you sure you want to set payout instructions?';
    case 'chia_wallet.nft_set_nft_did':
      return 'Are you sure you want to move this NFT to the specified profile?';
    case 'chia_wallet.nft_set_did_bulk':
      return 'Are you sure you want to move these NFTs to the specified profile?';
    case 'chia_full_node.open_connection':
      return 'Are you sure you want to open a connection to the specified node?';
    case 'chia_farmer.set_payout_instructions':
      return 'Are you sure you want to set payout instructions?';
    case 'chia_wallet.delete_key':
      return 'Are you sure you want to delete this wallet?';
    default:
      return 'Please review and confirm this action.';
  }
}

function getConfirmButtonText(command: string) {
  switch (command) {
    case 'chia_wallet.send_transaction':
    case 'chia_wallet.cat_spend':
      return 'Send';
    case 'daemon.stop_plotting':
      return 'Stop';
    case 'chia_harvester.delete_plot':
    case 'chia_wallet.delete_key':
      return 'Delete';
    case 'chia_harvester.add_plot_directory':
      return 'Add';
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return 'Transfer';
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
      return 'Disconnect';
    case 'chia_full_node.open_connection':
      return 'Connect';
    case 'chia_wallet.sign_message_by_id':
    case 'chia_wallet.sign_message_by_address':
      return 'Sign';
    case 'chia_wallet.create_new_wallet':
      return 'Create';
    case 'chia_wallet.set_auto_claim':
    case 'chia_farmer.set_payout_instructions':
      return 'Set';
    case 'chia_wallet.nft_set_nft_did':
    case 'chia_wallet.nft_set_did_bulk':
      return 'Move';
    case 'chia_wallet.create_offer_for_ids':
      return 'Create';
    default:
      return 'Proceed';
  }
}

function getFormattedData(
  command: string,
  data: Record<string, unknown>,
  networkPrefix: string,
): {
  field: string;
  label: ReactNode;
  value: string | undefined;
}[] {
  switch (command) {
    case 'chia_wallet.send_transaction':
      return [
        { field: 'address', label: 'Address', value: data.address as string },
        { field: 'amount', label: 'Amount', value: humanizeChia(data.amount as number, networkPrefix) },
        { field: 'fee', label: 'Fee', value: humanizeChia(data.fee as number, networkPrefix) },
      ];
    case 'chia_wallet.cat_spend':
      return [
        { field: 'address', label: 'Address', value: data.inner_address as string },
        { field: 'amount', label: 'Amount', value: humanizeCAT(data.amount as number) },
        { field: 'fee', label: 'Fee', value: humanizeChia(data.fee as number, networkPrefix) },
      ];
    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
      return [
        { field: 'target_address', label: 'Destination Address', value: data.target_address as string },
        { field: 'fee', label: 'Fee', value: humanizeChia(data.fee as string, networkPrefix) },
      ];
    case 'chia_wallet.cancel_offer':
      return [{ field: 'fee', label: 'Fee', value: humanizeChia(data.fee as string, networkPrefix) }];
    case 'chia_harvester.delete_plot':
      return [{ field: 'filename', label: 'Filename', value: data.filename as string }];
    case 'chia_harvester.add_plot_directory':
    case 'chia_harvester.remove_plot_directory':
      return [{ field: 'directory', label: 'Directory', value: data.dirname as string }];
    case 'chia_farmer.set_payout_instructions':
      return [
        { field: 'payout_instructions', label: 'Payout Instructions', value: data.payout_instructions as string },
      ];
    case 'chia_wallet.set_auto_claim':
      return [
        { field: 'auto_claim', label: 'Enabled', value: data.enabled ? 'Yes' : 'No' },
        { field: 'tx_fee', label: 'Transaction Fee', value: humanizeChia(data.tx_fee as string, networkPrefix) },
        { field: 'min_amount', label: 'Min Amount', value: humanizeChia(data.min_amount as string, networkPrefix) },
      ];
    case 'chia_wallet.create_new_wallet':
      return [
        { field: 'name', label: 'Name', value: data.wallet_name as string },
        { field: 'type', label: 'Type', value: data.wallet_type as string },
        { field: 'asset_id', label: 'Asset ID', value: data.asset_id as string },
        { field: 'fee', label: 'Fee', value: humanizeChia(data.fee as string, networkPrefix) },
      ];
    case 'chia_wallet.sign_message_by_address':
      return [
        { field: 'address', label: 'Address', value: data.address as string },
        { field: 'message', label: 'Message', value: data.message as string },
      ];
    case 'chia_wallet.sign_message_by_id':
      return [
        { field: 'id', label: 'Id', value: data.id as string },
        { field: 'message', label: 'Message', value: data.message as string },
      ];
    case 'chia_wallet.nft_set_nft_did':
      return [
        { field: 'did_id', label: 'DID', value: data.did_id as string },
        { field: 'fee', label: 'Fee', value: humanizeChia(data.fee as string, networkPrefix) },
      ];
    case 'chia_wallet.nft_set_did_bulk':
      return [
        { field: 'did_id', label: 'DID', value: data.did_id as string },
        { field: 'fee', label: 'Fee', value: humanizeChia(data.fee as string, networkPrefix) },
      ];
    case 'chia_wallet.create_offer_for_ids':
      return [{ field: 'fee', label: 'Fee', value: humanizeChia(data.fee as string, networkPrefix) }];
    case 'chia_full_node.open_connection':
      return [
        { field: 'host', label: 'Host', value: data.host as string },
        { field: 'port', label: 'Port', value: data.port as string },
      ];
    case 'chia_wallet.delete_key':
      return [{ field: 'fingerprint', label: 'fingerprint', value: data.fingerprint as string }];
    default:
      return [];
  }
}

export type ConfirmProps = {
  confirmId: string;
  networkPrefix: string;
  data: Record<string, unknown>;
  command: string;
  styleURL?: string;
  isDarkMode?: boolean;
};

export default function Confirm(props: ConfirmProps) {
  const { data, command, styleURL, confirmId, isDarkMode, networkPrefix } = props;

  const hasData = !!data && Object.keys(data).length > 0;
  const hasDataOrCommand = hasData || !!command;

  const message = getMessage(command);
  const confirmButtonText = getConfirmButtonText(command);
  const formattedData = getFormattedData(command, data, networkPrefix).filter(({ value }) => value !== undefined);

  return (
    <div className="p-4 flex flex-col h-full text-gray-900 dark:text-gray-100">
      <div className="mb-4 flex-1 flex flex-col">
        <p className="mt-0 mb-4 text-base">{message}</p>

        {hasDataOrCommand && (
          <SandboxedIframe className="w-full flex-1" isDarkMode={isDarkMode}>
            <link href={styleURL} type="text/css" rel="stylesheet" />
            <div className="flex flex-col gap-4 h-full">
              {!!command && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Command</span>
                  <pre className="break-all mt-1 text-sm">{command}</pre>
                </div>
              )}

              {hasData && (
                <div className="flex flex-col gap-4">
                  {!!formattedData.length && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="grid gap-3">
                        {formattedData.map(({ field, label, value }) => (
                          <div className="flex flex-col" key={field}>
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{label}</span>
                            <span className="font-medium mt-1 break-all whitespace-normal">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Collapsible title="More Details">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Data:</span>
                      <pre className="break-all overflow-x-auto text-xs mt-1">{JSON.stringify(data, null, 2)}</pre>
                    </div>
                  </Collapsible>
                </div>
              )}
            </div>
          </SandboxedIframe>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          data-action="cancel"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancel
        </button>
        <button
          type="button"
          id={confirmId}
          className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {confirmButtonText}
        </button>
      </div>
    </div>
  );
}
