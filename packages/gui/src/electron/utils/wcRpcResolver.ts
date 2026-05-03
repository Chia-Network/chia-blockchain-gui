/**
 * Translates a WalletConnect command name (camelCase, like `spendCAT`) into
 * the daemon RPC name (snake_case, like `cat_spend`). Lives in main because
 * main owns dispatch — the renderer just sends the WC command name and main
 * looks up the right thing to put on the wire. Keeps the WalletConnect
 * command list in the renderer (`WalletConnectCommands.tsx`) free of
 * dispatch metadata it shouldn't carry.
 *
 * Most WC commands camelCase→snake_case correctly via the regex below. The
 * map covers everything that doesn't:
 *  - acronym-bearing names (`spendCAT` → `cat_spend`, not `spend_c_a_t`),
 *  - cases where the daemon RPC name diverges from the WC name regardless
 *    (`mintBulk` → `nft_mint_bulk`, the daemon prefixes `nft_`).
 */

/** WC command name → daemon RPC name. Empty string is never used; absence
 *  from this map means "fall back to camelToSnake(wcCommand)". */
const WC_COMMAND_OVERRIDES: Record<string, string> = {
  // CAT
  spendCAT: 'cat_spend',
  addCATToken: 'cat_asset_id_to_name',
  getCATWalletInfo: 'cat_asset_id_to_name',
  getCATAssetId: 'cat_get_asset_id',

  // NFT
  getNFTs: 'nft_get_nfts',
  getNFTInfo: 'nft_get_info',
  getNFTsCount: 'nft_count_nfts',
  mintBulk: 'nft_mint_bulk',
  mintNFT: 'nft_mint_nft',
  transferNFT: 'nft_transfer_nft',
  setNFTDID: 'nft_set_nft_did',
  getNFTWalletsWithDIDs: 'nft_get_wallets_with_dids',

  // DID
  findLostDID: 'did_find_lost',
  getDIDCurrentCoinInfo: 'did_get_current_coin_info',
  getDID: 'did_get_did',
  getDIDInfo: 'did_get_info',
  getDIDInformationNeededForRecovery: 'did_get_information_needed_for_recovery',
  getDIDMetadata: 'did_get_metadata',
  getDIDPubkey: 'did_get_pubkey',
  getDIDRecoveryList: 'did_get_recovery_list',
  updateDIDMetadata: 'did_update_metadata',
  updateDIDRecoveryIds: 'did_update_recovery_ids',
  getDIDName: 'did_get_wallet_name',
  setDIDName: 'did_set_wallet_name',

  // VC
  getVCList: 'vc_get_list',
  getVC: 'vc_get',
  spendVC: 'vc_spend',
  addVCProofs: 'vc_add_proofs',
  getProofsForRoot: 'vc_get_proofs_for_root',
  revokeVC: 'vc_revoke',

  // DataLayer — WC names carry a "DataLayer" prefix to disambiguate from the
  // wallet's offers, but the daemon RPCs (under destination=chia_data_layer)
  // don't repeat it.
  makeDataLayerOffer: 'make_offer',
  takeDataLayerOffer: 'take_offer',
  cancelDataLayerOffer: 'cancel_offer',
  getDataLayerSyncStatus: 'get_sync_status',
};

function camelToSnake(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Resolve a WC camelCase command name to the daemon RPC name. Pure lookup
 * with a snake_case fallback for the trivial cases.
 */
export function resolveDaemonRpc(wcCommand: string): string {
  return WC_COMMAND_OVERRIDES[wcCommand] ?? camelToSnake(wcCommand);
}

/** Exposed for tests. */
export const WC_RPC_OVERRIDE_KEYS = Object.keys(WC_COMMAND_OVERRIDES);
