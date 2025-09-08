import { toBech32m, OfferSummaryRecord } from '@chia-network/api';
import { useCallback, useMemo, useState } from 'react';

type NFTsByOfferSide = {
  requested?: string[];
  offered?: string[];
};

function allNFTsByOfferSide(offerSummary: OfferSummaryRecord, sides: ('requested' | 'offered')[]): NFTsByOfferSide {
  const allNFTs: NFTsByOfferSide = {};
  sides.forEach((side) => {
    allNFTs[side] = Object.keys(offerSummary[side])
      .filter((assetId) => (offerSummary.infos[assetId]?.type as any) === 'singleton')
      .map((assetId) => toBech32m(assetId, 'nft'));
  });

  return allNFTs;
}

export type UseResolveNFTOfferParams = {
  offerSummary: OfferSummaryRecord;
};

export default function useResolveNFTOffer({ offerSummary }: UseResolveNFTOfferParams) {
  const [resolved, setResolved] = useState(false);
  const [ownedNFTIds, setOwnedNFTIds] = useState<string[]>([]);
  const [unownedNFTIds, setUnownedNFTIds] = useState<string[]>([]);
  const [ownedNFTOfferSides, setOwnedNFTOfferSides] = useState<('requested' | 'offered')[]>([]);

  // Check if a given NFT is owned by the user
  const checkNFTOwnership = useCallback(async (nftId: string) => {
    try {
      return await window.appAPI.checkNFTOwnership(nftId);
    } catch (error) {
      return false;
    }
  }, []);

  const nftsBySide: NFTsByOfferSide = useMemo(
    () => allNFTsByOfferSide(offerSummary, ['requested', 'offered']),
    [offerSummary],
  );

  useMemo(async () => {
    const sides = Object.keys(nftsBySide) as ('requested' | 'offered')[];

    sides.forEach(async (side) => {
      nftsBySide[side]!.forEach(async (nftId) => {
        if (ownedNFTIds.includes(nftId) || unownedNFTIds.includes(nftId)) {
          return;
        }

        const owned = await checkNFTOwnership(nftId);

        if (owned) {
          setOwnedNFTIds([...ownedNFTIds, nftId]);
          setOwnedNFTOfferSides([...ownedNFTOfferSides, side as any]);
        } else {
          setUnownedNFTIds([...unownedNFTIds, nftId]);
        }
      });
    });

    setResolved(true);
  }, [
    nftsBySide,
    checkNFTOwnership,
    setOwnedNFTIds,
    setUnownedNFTIds,
    setOwnedNFTOfferSides,
    setResolved,
    ownedNFTIds,
    unownedNFTIds,
    ownedNFTOfferSides,
  ]);

  return { isResolving: !resolved, ownedNFTIds, unownedNFTIds, ownedNFTOfferSides };
}
