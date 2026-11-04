import { Commands } from './Commands';

const SPEND_COMMANDS = new Set<keyof typeof Commands>([
  'chia_wallet.send_transaction',
  'chia_wallet.cat_spend',
  'chia_wallet.nft_transfer_nft',
  'chia_wallet.cancel_offer',
  'chia_wallet.create_offer_for_ids',
  'chia_wallet.take_offer',
  'chia_wallet.spend_clawback_coins',
  'chia_wallet.did_transfer_did',
  'chia_wallet.push_transactions',
]);

export function isSpendCommand(command: string): boolean {
  return SPEND_COMMANDS.has(command);
}
