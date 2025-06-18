export default [
  'chia_full_node.push_tx',

  'chia_wallet.create_new_wallet',
  'chia_wallet.send_transaction',
  'chia_wallet.create_signed_transaction',

  'chia_wallet.send_transaction_multi',
  'chia_wallet.spend_clawback_coins',
  'chia_wallet.send_notification',
  'chia_wallet.cat_spend',
  'chia_wallet.create_offer_for_ids',
  'chia_wallet.take_offer',
  'chia_wallet.cancel_offer',
  'chia_wallet.cancel_offers',

  'chia_data_layer.take_offer',
  'chia_data_layer.cancel_offer',

  'chia_wallet.did_update_recovery_ids',
  'chia_wallet.did_message_spend',
  'chia_wallet.did_update_metadata',
  'chia_wallet.did_recovery_spend',
  'chia_wallet.did_create_attest',
  'chia_wallet.did_transfer_did',

  /*
  'dao_add_funds_to_treasury',
  'dao_send_to_lockup',
  'dao_exit_lockup',
  'dao_create_proposal',
  'dao_vote_on_proposal',
  'dao_close_proposal',
  'dao_free_coins_from_finished_proposals',
  */

  'chia_wallet.pw_join_pool',
  'chia_wallet.pw_self_pool',
  'chia_wallet.pw_absorb_rewards',

  /*
  'create_new_dl',
  'dl_update_root',
  'dl_update_multiple',
  'dl_new_mirror',
  'dl_delete_mirror',
  */

  'chia_wallet.create_new_wallet',
  'chia_wallet.delete_key',
  'chia_wallet.delete_all_keys',

  /*
  // DataLayer commands
  'add_mirror',
  'batch_update',
  'cancel_offer',
  'create_data_store',
  'delete_key',
  'delete_mirror',
  'insert',
  'make_offer',
  'take_offer',
  'verify_offer',
  */

  // NFT commands
  'chia_wallet.nft_mint_nft',
  'chia_wallet.nft_set_nft_did',
  'chia_wallet.nft_set_did_bulk',
  'chia_wallet.nft_transfer_bulk',
  'chia_wallet.nft_transfer_nft',
  'chia_wallet.nft_add_uri',
  'chia_wallet.nft_mint_bulk',

  'chia_farmer.set_payout_instructions',

  /*
  'daemon.set_keyring_passphrase',
  'daemon.remove_keyring_passphrase',
  'daemon.unlock_keyring',
  'daemon.migrate_keyring',
  */
  'daemon.stop_plotting',
  'daemon.start_plotting',
];
