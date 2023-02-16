import { fungibleAssetFromAssetIdAndAmount, royaltyAssetFromNFTInfo } from '@chia-network/api';
import type { CalculateRoyaltiesRequest, NFTInfo } from '@chia-network/api';
import {
  useCalculateRoyaltiesForNFTsQuery,
  useGetNFTsByNFTIDsQuery,
  useGetWalletsQuery,
} from '@chia-network/api-react';
import { catToMojo, chiaToMojo } from '@chia-network/core';
import { uniq } from 'lodash';
import React, { ReactNode, useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import getUnknownCATs from '../../util/getUnknownCATs';
import OfferState from '../offers/OfferState';
import OfferBuilderContext from './OfferBuilderContext';

export type OfferBuilderProviderProps = {
  children: ReactNode;
  readOnly?: boolean;
  isMyOffer?: boolean;
  imported?: boolean;
  state?: OfferState;
};

export default function OfferBuilderProvider(props: OfferBuilderProviderProps) {
  const { children, readOnly = false, isMyOffer = false, imported = false, state } = props;

  const requestedNFTIds = useWatch({
    name: 'requested.nfts',
  })?.map(({ nftId }) => nftId);

  const offeredNFTIds = useWatch({
    name: 'offered.nfts',
  })?.map(({ nftId }) => nftId);

  const requestedXCH = useWatch({
    name: 'requested.xch',
  });

  const offeredXCH = useWatch({
    name: 'offered.xch',
  });

  const requestedTokens = useWatch({
    name: 'requested.tokens',
  });

  const offeredTokens = useWatch({
    name: 'offered.tokens',
  });

  const { data: wallets } = useGetWalletsQuery();

  const [offeredUnknownCATs, requestedUnknownCATs] = useMemo(() => {
    if ((!offeredTokens && !requestedTokens) || !wallets) {
      return [];
    }

    const offeredUnknownCATsLocal = getUnknownCATs(
      wallets,
      offeredTokens.map(({ assetId }) => assetId)
    );
    const requestedUnknownCATsLocal = getUnknownCATs(
      wallets,
      requestedTokens.map(({ assetId }) => assetId)
    );

    return [offeredUnknownCATsLocal, requestedUnknownCATsLocal];
  }, [offeredTokens, requestedTokens, wallets]);

  const { data: loadedRequestedNFTs, isLoading: isLoadingRequestedNFTs } = useGetNFTsByNFTIDsQuery(
    { nftIds: requestedNFTIds },
    { skip: requestedNFTIds.length === 0 }
  );

  const requestedNFTs = !isLoadingRequestedNFTs && requestedNFTIds.length > 0 ? loadedRequestedNFTs : [];

  const { data: offeredNFTs } = useGetNFTsByNFTIDsQuery(
    { nftIds: offeredNFTIds },
    { skip: offeredNFTIds.length === 0 }
  );

  const requestedRoyaltyAssets = (requestedNFTs || [])
    .filter((nft: NFTInfo) => nft?.royaltyPercentage > 0)
    .map((nft: NFTInfo) => royaltyAssetFromNFTInfo(nft));

  const offeredRoyaltyAssets = (offeredNFTs || [])
    .filter((nft: NFTInfo) => nft?.royaltyPercentage > 0)
    .map((nft: NFTInfo) => royaltyAssetFromNFTInfo(nft));

  const requestedFungibleAssets = [
    ...(requestedXCH ?? [])
      .filter(({ amount }) => amount > 0)
      .map(({ amount }) => fungibleAssetFromAssetIdAndAmount('xch', chiaToMojo(amount))),
    ...(requestedTokens ?? [])
      .filter(({ assetId, amount }) => assetId?.length > 0 && amount > 0)
      .map(({ amount, assetId }) => fungibleAssetFromAssetIdAndAmount(assetId, catToMojo(amount))),
  ];

  const offeredFungibleAssets = [
    ...(offeredXCH ?? [])
      .filter(({ amount }) => amount > 0)
      .map(({ amount }) => fungibleAssetFromAssetIdAndAmount('xch', chiaToMojo(amount))),
    ...(offeredTokens ?? [])
      .filter(({ assetId, amount }) => assetId?.length > 0 && amount > 0)
      .map(({ amount, assetId }) => fungibleAssetFromAssetIdAndAmount(assetId, catToMojo(amount))),
  ];

  const requestedRoyaltiesRequest: CalculateRoyaltiesRequest = {
    royaltyAssets: requestedRoyaltyAssets,
    fungibleAssets: offeredFungibleAssets,
  };

  const offeredRoyaltiesRequest: CalculateRoyaltiesRequest = {
    royaltyAssets: offeredRoyaltyAssets,
    fungibleAssets: requestedFungibleAssets,
  };

  const skipRequestedRoyalitiesCalculation =
    requestedRoyaltiesRequest.royaltyAssets.length === 0 || requestedRoyaltiesRequest.fungibleAssets.length === 0;

  const skipOfferedRoyalitiesCalculation =
    offeredRoyaltiesRequest.royaltyAssets.length === 0 || offeredRoyaltiesRequest.fungibleAssets.length === 0;

  const { data: requestedRoyaltiesData, isLoading: isCalculatingRequestedRoyalties } =
    useCalculateRoyaltiesForNFTsQuery(requestedRoyaltiesRequest, {
      skip: skipRequestedRoyalitiesCalculation,
    });

  const { data: offeredRoyaltiesData, isLoading: isCalculatingOfferedRoyalties } = useCalculateRoyaltiesForNFTsQuery(
    offeredRoyaltiesRequest,
    {
      skip: skipOfferedRoyalitiesCalculation,
    }
  );

  const requestedRoyalties = skipRequestedRoyalitiesCalculation ? undefined : requestedRoyaltiesData?.royalties;

  const offeredRoyalties = skipOfferedRoyalitiesCalculation ? undefined : offeredRoyaltiesData?.royalties;

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
      isMyOffer,
      state,
      offeredUnknownCATs,
      requestedUnknownCATs,
      usedAssetIds,
      requestedRoyalties,
      offeredRoyalties,
      isCalculatingRoyalties: isCalculatingRequestedRoyalties || isCalculatingOfferedRoyalties,
    }),
    [
      readOnly,
      imported,
      isMyOffer,
      state,
      offeredUnknownCATs,
      requestedUnknownCATs,
      usedAssetIds,
      requestedRoyalties,
      offeredRoyalties,
      isCalculatingRequestedRoyalties,
      isCalculatingOfferedRoyalties,
    ]
  );

  return <OfferBuilderContext.Provider value={context}>{children}</OfferBuilderContext.Provider>;
}
