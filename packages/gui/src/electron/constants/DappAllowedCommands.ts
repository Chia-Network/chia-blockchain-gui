import AllowedCommands from './AllowedCommands';

/**
 * Commands a paired dapp may call without prompting the user, when it is the
 * pair principal making the call.
 *
 * This is a conservative subset of `AllowedCommands.ts`. The bigger list is
 * for the wallet UI itself (it needs to start services, manage keys, etc.).
 * A dapp must never be able to do those things silently — even if the
 * underlying call is read-only, exposing things like fingerprint switching
 * or service control opens an attack surface.
 *
 * Rule of thumb for adding to this list:
 *   - read-only (no state change in the wallet, daemon, or services), AND
 *   - safe to expose to an external application by definition
 *     (no key material, no service lifecycle, no preference mutation), AND
 *   - already in AllowedCommands.ts.
 *
 * Balance reads (`get_wallet_balance`/`get_wallet_balances`) are intentionally
 * NOT in this list — they are gated by the balance capability grant in
 * `permissions.ts` (see `isBalanceCommand`).
 *
 * Spend-bundle pushing (`push_transactions`) is also NOT in this list — it
 * moves funds and is always prompted for pair principals (see
 * `isSpendBundleCommand`).
 */
const DappAllowedCommands = [
  // Wallet/account info
  'chia_wallet.get_wallets',
  'chia_wallet.get_next_address',
  'chia_wallet.get_logged_in_fingerprint',
  'chia_wallet.get_network_info',
  'chia_wallet.get_sync_status',
  'chia_wallet.get_current_derivation_index',
  'chia_wallet.get_auto_claim',
  'chia_wallet.get_notifications',

  // Coin & blockchain reads
  'chia_wallet.get_coin_records_by_names',
  'chia_wallet.get_spendable_coins',
  'chia_wallet.select_coins',
  'chia_wallet.get_height_info',
  'chia_wallet.get_puzzle_and_solution',
  'chia_wallet.get_timestamp_for_height',

  // Transaction reads
  'chia_wallet.get_transaction',
  'chia_wallet.get_transactions',
  'chia_wallet.get_transaction_count',
  'chia_wallet.get_transaction_memo',
  'chia_wallet.get_farmed_amount',

  // Offer reads
  'chia_wallet.get_offer',
  'chia_wallet.get_offer_summary',
  'chia_wallet.check_offer_validity',
  'chia_wallet.get_offers_count',
  'chia_wallet.get_all_offers',

  // CAT info
  'chia_wallet.cat_get_asset_id',
  'chia_wallet.cat_get_name',
  'chia_wallet.cat_asset_id_to_name',
  'chia_wallet.get_cat_list',
  'chia_wallet.get_stray_cats',

  // NFT reads
  'chia_wallet.nft_count_nfts',
  'chia_wallet.nft_get_nfts',
  'chia_wallet.nft_get_info',
  'chia_wallet.nft_get_wallet_did',
  'chia_wallet.nft_get_wallets_with_dids',
  'chia_wallet.nft_calculate_royalties',

  // VC reads
  'chia_wallet.vc_get',
  'chia_wallet.vc_get_list',
  'chia_wallet.vc_get_proofs_for_root',

  // DID reads
  'chia_wallet.did_get_did',
  'chia_wallet.did_get_info',
  'chia_wallet.did_get_metadata',
  'chia_wallet.did_get_pubkey',
  'chia_wallet.did_get_recovery_list',
  'chia_wallet.did_get_information_needed_for_recovery',
  'chia_wallet.did_get_current_coin_info',
  'chia_wallet.did_get_wallet_name',

  // Pool wallet status
  'chia_wallet.pw_status',

  // Signature verification (verifies a provided signature, does not sign)
  'chia_wallet.verify_signature',

  // Pings
  'chia_wallet.ping',
] as const;

// Build-time invariant: every dapp-allowed command must also be in the wider
// UI allow list. If this throws on app start, either remove the entry below
// or add it to AllowedCommands.ts (it has to be silent for the UI principal
// too, otherwise the UI itself would break when calling it).
const uiAllowed = new Set<string>(AllowedCommands);
DappAllowedCommands.forEach((cmd) => {
  if (!uiAllowed.has(cmd)) {
    throw new Error(
      `DappAllowedCommands contains '${cmd}' which is not in AllowedCommands.ts. ` +
        'Every dapp-allowed command must also be UI-allowed.',
    );
  }
});

export default DappAllowedCommands;
