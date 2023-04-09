import type BigNumber from 'bignumber.js';

type NFTInfo = {
  chainInfo: string;
  dataHash: string;
  dataUris: string[];
  editionNumber: BigNumber | number;
  editionTotal: BigNumber | number;
  launcherId: string;
  launcherPuzhash: string;
  licenseHash: string;
  licenseUris: string[];
  metadataHash: string;
  metadataUris: string[];
  mintHeight: number;
  minterDid: string;
  nftCoinId: string;
  ownerDid: string;
  ownerPubkey: string;
  pendingTransaction: boolean;
  royaltyPercentage: number; // e.g. 175 == 1.75%
  royaltyPuzzleHash: string;
  supportsDid: boolean;
  p2Address: string;
  updaterPuzhash: string;
  offChainMetadata: string;
  nftCoinConfirmationHeight: number;

  // TODO move these Properties added by the frontend to the frontend
  //  walletId: number | undefined;
  //  $nftId: string; // bech32m-encoding of the launcherId e.g. nft1eryfv3va6lftjslhq3jhyx30dk8wtsfd8epseuq3rnlf2tavpjmsq0ljcv
};

export default NFTInfo;
