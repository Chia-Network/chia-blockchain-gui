enum FeeTxType {
  walletSendXCH = 'send_xch_transaction',
  spendCATtx = 'cat_spend',
  acceptOffer = 'take_offer',
  cancelOffer = 'cancel_offer',
  assignDIDToNFT = 'nft_set_nft_did',
  transferNFT = 'nft_transfer_nft',
  createPlotNFT = 'create_new_pool_wallet',
  claimPoolingReward = 'pw_absorb_rewards',
  createDID = 'create_new_did_wallet',
}

export default FeeTxType;
