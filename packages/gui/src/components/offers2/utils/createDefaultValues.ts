import { WalletType } from '@chia-network/api';
import _ from 'lodash';

import type OfferBuilderData from '../../../@types/OfferBuilderData';
import { emptyDefaultValues } from './defaultValues';

type CreateDefaultValuesParams = {
  walletType?: WalletType; // CAT or STANDARD_WALLET (XCH), indicates whether a token or CAT has a default entry
  assetId?: string; // Asset ID of the CAT
  nftId?: string; // NFT to include in the offer by default
  nftIds?: string[]; // multiple NFT selection
  nftWalletId?: number; // If set, indicates that we are offering the NFT, otherwise we are requesting it
};

/**
 * Creates default values for OfferBuilder's form data. OfferBuilder can be instantiated with default values
 * for creating an XCH offer, a CAT offer, or an NFT offer. XCH and CAT offers will have a default entry in
 * the offered section. NFT offers can have default entries in either the offered or requested sections
 * depending on whether the NFTs and an NFT wallet id are provided.
 */
export default function createDefaultValues(params: CreateDefaultValuesParams | undefined = {}): OfferBuilderData {
  const { walletType, assetId, nftId, nftWalletId, nftIds } = params;

  const nfts =
    nftIds && nftWalletId ? nftIds.map((nftIdItem) => ({ nftId: nftIdItem })) : nftId && nftWalletId ? [{ nftId }] : [];

  // Deep clone the emptyDefaultValues object using Lodash's cloneDeep
  const clonedEmptyDefaultValues = _.cloneDeep(emptyDefaultValues);

  return {
    ...clonedEmptyDefaultValues,
    offered: {
      ...clonedEmptyDefaultValues.offered,
      nfts,
      xch: walletType === WalletType.STANDARD_WALLET ? [{ amount: '' }] : [],
      tokens: walletType === WalletType.CAT && assetId ? [{ assetId, amount: '' }] : [],
    },
    requested: {
      ...clonedEmptyDefaultValues.requested,
      nfts: nftId && !nftWalletId ? [{ nftId }] : [], // NFTs that are not in a wallet are requested
    },
  };
}
