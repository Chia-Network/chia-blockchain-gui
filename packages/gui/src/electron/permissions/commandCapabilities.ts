import AllowedCommands from '../constants/AllowedCommands';

import type { CommandClassification } from './types';

const READ_ONLY = new Set(AllowedCommands);

export function classifyCommand(command: string): CommandClassification {
  if (READ_ONLY.has(command)) {
    return { kind: 'allow' };
  }

  switch (command) {
    case 'chia_wallet.send_transaction':
    case 'chia_wallet.cat_spend':
      return { kind: 'capability', capability: 'spend', amountField: 'amount' };

    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
    case 'chia_wallet.nft_set_nft_did':
    case 'chia_wallet.nft_set_did_bulk':
      return { kind: 'capability', capability: 'spend' };

    case 'chia_wallet.create_offer_for_ids':
    case 'chia_wallet.take_offer':
    case 'chia_wallet.cancel_offer':
      return { kind: 'capability', capability: 'offer' };

    case 'chia_wallet.create_new_wallet':
    case 'chia_wallet.create_new_remote_wallet':
      return { kind: 'capability', capability: 'walletCreate' };

    case 'chia_wallet.sign_message_by_address':
    case 'chia_wallet.sign_message_by_id':
      return { kind: 'capability', capability: 'sign' };

    case 'chia_wallet.register_remote_coins':
      return { kind: 'capability', capability: 'watch' };

    case 'chia_wallet.delete_key':
    case 'chia_harvester.delete_plot':
    case 'chia_harvester.add_plot_directory':
    case 'chia_harvester.remove_plot_directory':
    case 'chia_full_node.open_connection':
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
    case 'chia_farmer.set_payout_instructions':
    case 'chia_wallet.set_payout_instructions':
    case 'chia_wallet.set_auto_claim':
    case 'daemon.stop_plotting':
      return { kind: 'never' };

    default:
      return { kind: 'never' };
  }
}
