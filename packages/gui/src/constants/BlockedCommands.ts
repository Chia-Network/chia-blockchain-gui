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

  'chia_wallet.sign_message_by_id',
  'chia_wallet.sign_message_by_address',

  'chia_data_layer.take_offer',
  'chia_data_layer.cancel_offer',

  'chia_wallet.did_update_recovery_ids',
  'chia_wallet.did_message_spend',
  'chia_wallet.did_update_metadata',
  'chia_wallet.did_recovery_spend',
  'chia_wallet.did_create_attest',
  'chia_wallet.did_transfer_did',
  'chia_wallet.did_find_lost', // verify
  'chia_wallet.did_get_current_coin_info', // verify
  'chia_wallet.did_get_information_needed_for_recovery', // verify
  'chia_wallet.did_get_metadata', // verify
  'chia_wallet.did_get_pubkey', // verify
  'chia_wallet.did_get_recovery_list', // verify
  'chia_wallet.vc_spend', // verify
  'chia_wallet.vc_add_proofs', // verify
  'chia_wallet.vc_get_proofs_for_root', // verify
  'chia_wallet.vc_revoke', // verify

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

  'chia_data_layer.add_mirror',
  'chia_data_layer.batch_update',
  'chia_data_layer.add_missing_files',
  'chia_data_layer.cancel_offer',
  'chia_data_layer.check_plugins',
  'chia_data_layer.clear_pending_roots',
  'chia_data_layer.create_data_store',
  'chia_data_layer.delete_key',
  'chia_data_layer.delete_mirror',
  'chia_data_layer.get_ancestors',
  'chia_data_layer.get_keys',
  'chia_data_layer.get_keys_values',
  'chia_data_layer.get_kv_diff',
  'chia_data_layer.get_local_root',
  'chia_data_layer.get_mirrors',
  'chia_data_layer.get_owned_stores',
  'chia_data_layer.get_root',
  'chia_data_layer.get_roots',
  'chia_data_layer.get_root_history',
  'chia_data_layer.get_sync_status',
  'chia_data_layer.get_value',
  'chia_data_layer.insert',
  'chia_data_layer.make_offer',
  'chia_data_layer.take_offer',
  'chia_data_layer.verify_offer',
  'chia_data_layer.remove_subscriptions',
  'chia_data_layer.subscribe',
  'chia_data_layer.subscriptions',
  'chia_data_layer.unsubscribe',

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
];
