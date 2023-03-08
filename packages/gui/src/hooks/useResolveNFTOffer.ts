import { toBech32m, OfferSummaryRecord } from '@chia-network/api';
import { useSignMessageByIdMutation } from '@chia-network/api-react';
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

async function findFirstOwnedNFT(
  nftIds: string[],
  resolveOwnership: (nftId: string) => Promise<boolean>
): Promise<string | undefined> {
  // eslint-disable-next-line no-restricted-syntax -- Stop on first match
  for (const nftId of nftIds) {
    // eslint-disable-next-line no-await-in-loop -- Stop on first match
    const owned = await resolveOwnership(nftId);
    if (owned) {
      return nftId;
    }
  }

  return undefined;
}

export type UseResolveNFTOfferParams = {
  offerSummary: OfferSummaryRecord;
};

export default function useResolveNFTOffer({ offerSummary }: UseResolveNFTOfferParams) {
  const [signMessageById] = useSignMessageByIdMutation();
  const [resolved, setResolved] = useState(false);
  const [ownedNFTId, setOwnedNFTId] = useState<string | undefined>(undefined);
  const [ownedNFTOfferSide, setOwnedNFTOfferSide] = useState<'requested' | 'offered' | undefined>(undefined);

  // Hacky test to determine if a given NFT is owned by the user
  const signWithNFT = useCallback(
    async (nftId: string) => {
      const { data: result } = await signMessageById({ id: nftId, message: 'x' });
      return result?.success ?? false;
    },
    [signMessageById]
  );

  const nftsBySide: NFTsByOfferSide = useMemo(
    () => allNFTsByOfferSide(offerSummary, ['requested', 'offered']),
    [offerSummary]
  );

  useMemo(async () => {
    const sides = Object.keys(nftsBySide);

    // eslint-disable-next-line no-restricted-syntax -- Stop on first match
    for (const side of sides as ('requested' | 'offered')[]) {
      // eslint-disable-next-line no-await-in-loop -- Stop on first match
      const ownedNftId = await findFirstOwnedNFT(nftsBySide[side]!, signWithNFT);
      if (ownedNftId) {
        setOwnedNFTId(ownedNftId);
        setOwnedNFTOfferSide(side);
        break;
      }
    }

    setResolved(true);
  }, [nftsBySide, signWithNFT, setOwnedNFTId, setOwnedNFTOfferSide, setResolved]);

  return { isResolving: !resolved, ownedNFTId, ownedNFTOfferSide };
}
