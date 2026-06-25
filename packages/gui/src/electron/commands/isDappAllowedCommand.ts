import { Commands } from './Commands';

// list of chia commands that are allowed to be used by dapp without confirmation
const DAPP_ALLOWED_COMMANDS = new Set<keyof typeof Commands>([
  'chia_wallet.get_wallets',
  'chia_wallet.get_next_address',
  'chia_wallet.get_sync_status',
  'chia_wallet.get_coin_records_by_names',
  'chia_wallet.select_coins',
  'chia_wallet.get_height_info',
  'chia_wallet.get_puzzle_and_solution',
  'chia_wallet.get_timestamp_for_height',
  'chia_wallet.get_transaction',
  'chia_wallet.get_offer',
  'chia_wallet.get_offer_summary',
  'chia_wallet.check_offer_validity',
  'chia_wallet.cat_get_asset_id',
  'chia_wallet.cat_get_name',
  'chia_wallet.cat_asset_id_to_name',
  'chia_wallet.nft_get_info',
  'chia_wallet.nft_get_wallet_did',
  'chia_wallet.nft_calculate_royalties',
  'chia_wallet.vc_get',
  'chia_wallet.vc_get_proofs_for_root',
  'chia_wallet.did_get_did',
  'chia_wallet.did_get_info',
  'chia_wallet.did_get_metadata',
  'chia_wallet.did_get_pubkey',
  'chia_wallet.did_get_current_coin_info',
  'chia_wallet.did_get_wallet_name',
  'chia_wallet.pw_status',
  'chia_wallet.verify_signature',
  'chia_wallet.ping',
]);

export function isDappAllowedCommand(command: string): boolean {
  return DAPP_ALLOWED_COMMANDS.has(command);
}
