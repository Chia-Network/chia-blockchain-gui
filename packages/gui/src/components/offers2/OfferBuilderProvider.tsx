import { uniq } from 'lodash';
import React, { ReactNode, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import {
  fungibleAssetFromAssetIdAndAmount,
  royaltyAssetFromNFTInfo,
} from '@chia/api';
import type { CalculateRoyaltiesRequest, NFTInfo } from '@chia/api';
import {
  useCalculateRoyaltiesForNFTsQuery,
  useGetNFTsByNFTIDsQuery,
  useGetWalletsQuery,
} from '@chia/api-react';
import { catToMojo, chiaToMojo } from '@chia/core';
import OfferBuilderContext from './OfferBuilderContext';
import getUnknownCATs from '../../util/getUnknownCATs';

export type OfferBuilderProviderProps = {
  children: ReactNode;
  readOnly?: boolean;
  isMyOffer?: boolean;
  imported?: boolean;
};

export default function OfferBuilderProvider(props: OfferBuilderProviderProps) {
  const {
    children,
    readOnly = false,
    isMyOffer = false,
    imported = false,
  } = props;
  let royaltyNFTsSelector = undefined;
  let fungibleXCHSelector = undefined;
  let fungibleTokenSelector = undefined;

  if (readOnly && isMyOffer) {
    royaltyNFTsSelector = 'requested.nfts';
    fungibleXCHSelector = 'offered.xch';
    fungibleTokenSelector = 'offered.tokens';
  } else {
    royaltyNFTsSelector = 'offered.nfts';
    fungibleXCHSelector = 'requested.xch';
    fungibleTokenSelector = 'requested.tokens';
  }

  const offeredTokens = useWatch({
    name: 'offered.tokens',
  });

  const requestedTokens = useWatch({
    name: 'requested.tokens',
  });

  const royaltyNFTIds = useWatch({
    name: royaltyNFTsSelector,
  })?.map(({ nftId }) => nftId);

  const fungibleXCH = useWatch({
    name: fungibleXCHSelector,
  });

  const fungibleTokens = useWatch({
    name: fungibleTokenSelector,
  });

  const { data: wallets } = useGetWalletsQuery();

  const [offeredUnknownCATs, requestedUnknownCATs] = useMemo(() => {
    if ((!offeredTokens && !requestedTokens) || !wallets) {
      return [];
    }

    const offeredUnknownCATs = getUnknownCATs(
      wallets,
      offeredTokens.map(({ assetId }) => assetId),
    );
    const requestedUnknownCATs = getUnknownCATs(
      wallets,
      requestedTokens.map(({ assetId }) => assetId),
    );

    return [offeredUnknownCATs, requestedUnknownCATs];
  }, [offeredTokens, requestedTokens, wallets]);

  const { data: royaltyNFTs } = useGetNFTsByNFTIDsQuery(
    { nftIds: royaltyNFTIds },
    { skip: royaltyNFTIds.length === 0 },
  );

  const royaltyAssets = (royaltyNFTs ?? [])
    .filter((nft: NFTInfo) => nft?.royaltyPercentage > 0)
    .map((nft: NFTInfo) => royaltyAssetFromNFTInfo(nft));

  const fungibleAssets = [
    ...(fungibleXCH ?? [])
      .filter(({ amount }) => amount > 0)
      .map(({ amount }) =>
        fungibleAssetFromAssetIdAndAmount('xch', chiaToMojo(amount)),
      ),
    ...(fungibleTokens ?? [])
      .filter(({ assetId, amount }) => assetId?.length > 0 && amount > 0)
      .map(({ amount, assetId }) =>
        fungibleAssetFromAssetIdAndAmount(assetId, catToMojo(amount)),
      ),
  ];

  const request: CalculateRoyaltiesRequest = {
    royaltyAssets,
    fungibleAssets,
  };

  const skipRoyalitiesCalculation =
    request.royaltyAssets.length === 0 || request.fungibleAssets.length === 0;
  const { data: updatedRoyalties, isLoading: isCalculatingRoyalties } =
    useCalculateRoyaltiesForNFTsQuery(request, {
      skip: skipRoyalitiesCalculation,
    });
  const royalties = skipRoyalitiesCalculation ? undefined : updatedRoyalties;

  const usedAssetIds = useMemo(() => {
    const used: string[] = [];

    offeredTokens?.forEach(({ assetId }: { assetId: string }) => {
      if (assetId) {
        used.push(assetId);
      }
    });
    requestedTokens?.forEach(({ assetId }: { assetId: string }) => {
      if (assetId) {
        used.push(assetId);
      }
    });

    return uniq(used);
  }, [offeredTokens, requestedTokens]);

  const context = useMemo(
    () => ({
      readOnly,
      imported,
      offeredUnknownCATs,
      requestedUnknownCATs,
      usedAssetIds,
      royalties,
      isCalculatingRoyalties,
    }),
    [
      readOnly,
      imported,
      offeredUnknownCATs,
      requestedUnknownCATs,
      usedAssetIds,
      royalties,
      isCalculatingRoyalties,
    ],
  );

  return (
    <OfferBuilderContext.Provider value={context}>
      {children}
    </OfferBuilderContext.Provider>
  );
}
