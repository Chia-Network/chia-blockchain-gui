import BigNumber from 'bignumber.js';

import { NFTInfo, RoyaltyCalculationFungibleAsset, RoyaltyCalculationRoyaltyAsset } from '../@types';
import toBech32m from './toBech32m';

// TODO remove the added fields or move this whole file to the GUI
type NFTInfoWithFrontEndData = NFTInfo & {
  walletId: number | undefined;
  $nftId: string; // bech32m-encoding of the launcherId e.g. nft1eryfv3va6lftjslhq3jhyx30dk8wtsfd8epseuq3rnlf2tavpjmsq0ljcv
};

export default function royaltyAssetFromNFTInfo(
  nftInfo: NFTInfoWithFrontEndData,
  testnet = false
): RoyaltyCalculationRoyaltyAsset {
  return {
    asset: nftInfo.$nftId,
    royaltyAddress: toBech32m(nftInfo.royaltyPuzzleHash, testnet ? 'txch' : 'xch'),
    royaltyPercentage: nftInfo.royaltyPercentage,
  };
}

export function fungibleAssetFromWalletIdAndAmount(
  walletId: number | string,
  amount: BigNumber
): RoyaltyCalculationFungibleAsset {
  return {
    asset: walletId.toString(),
    amount,
  };
}

export function fungibleAssetFromAssetIdAndAmount(assetId: string, amount: BigNumber): RoyaltyCalculationFungibleAsset {
  return {
    asset: assetId,
    amount,
  };
}
