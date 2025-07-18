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

  'chia_wallet.did_update_recovery_ids',
  'chia_wallet.did_message_spend',
  'chia_wallet.did_update_metadata',
  'chia_wallet.did_recovery_spend',
  'chia_wallet.did_create_attest',
  'chia_wallet.did_transfer_did',

  'chia_wallet.vc_spend',
  'chia_wallet.vc_revoke',

  'chia_wallet.pw_join_pool',
  'chia_wallet.pw_self_pool',
  'chia_wallet.pw_absorb_rewards',

  'chia_wallet.create_new_wallet',
  'chia_wallet.delete_key',
  'chia_wallet.delete_all_keys',

  // data layer commands
  'chia_data_layer.cancel_offer',
  'chia_data_layer.create_data_store',
  'chia_data_layer.delete_key',
  'chia_data_layer.delete_mirror',
  'chia_data_layer.insert',
  'chia_data_layer.make_offer',
  'chia_data_layer.take_offer',
  'chia_data_layer.add_mirror',
  'chia_data_layer.batch_update',

  // NFT commands
  'chia_wallet.nft_mint_nft',
  'chia_wallet.nft_set_nft_did',
  'chia_wallet.nft_set_did_bulk',
  'chia_wallet.nft_transfer_bulk',
  'chia_wallet.nft_transfer_nft',
  'chia_wallet.nft_add_uri',
  'chia_wallet.nft_mint_bulk',

  'chia_farmer.set_payout_instructions',

  'daemon.stop_plotting',
  /*
  'daemon.set_keyring_passphrase',
  'daemon.remove_keyring_passphrase',
  'daemon.unlock_keyring',
  'daemon.migrate_keyring',
  */
];
