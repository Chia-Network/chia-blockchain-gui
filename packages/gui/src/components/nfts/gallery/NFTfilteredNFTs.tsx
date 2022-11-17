import { useMemo } from 'react';
import { useGetNFTWallets } from '@chia/api-react';
import useFetchNFTs from '../../../hooks/useFetchNFTs';
import useHideObjectionableContent from '../../../hooks/useHideObjectionableContent';
import useNachoNFTs from '../../../hooks/useNachoNFTs';
import useNFTMetadata from '../../../hooks/useNFTMetadata';
import type { NFTInfo } from '@chia/api';

type FilteredNFTtype = {
  walletId: number | undefined;
};

export default function useFilteredNFTs(props: FilteredNFTtype) {
  const { walletId } = props;
  const { wallets: nftWallets, isLoading: isLoadingWallets } =
    useGetNFTWallets();
  let { nfts, isLoading: isLoadingNFTs } = useFetchNFTs(
    nftWallets.map((wallet: Wallet) => wallet.id),
  );
  const noMetadataNFTs = nfts
    .filter((nft) => {
      return (
        !nft?.metadataUris ||
        (Array.isArray(nft.metadataUris) && nft.metadataUris.length === 0)
      );
    })
    .map((nft) => nft.$nftId);

  const { allowedNFTsWithMetadata } = useNFTMetadata(
    nfts.filter((nft: NFTInfo) => {
      return (
        !nft?.metadataUris ||
        (Array.isArray(nft?.metadataUris) && nft?.metadataUris.length > 0)
      );
    }),
    true,
  );

  const NFTmetadataObj: any = {};
  allowedNFTsWithMetadata.forEach((nft) => {
    if (nft.metadata) {
      NFTmetadataObj[nft.$nftId] = nft.metadata;
    }
  });

  const allAllowedNFTs = noMetadataNFTs.concat(
    allowedNFTsWithMetadata.map((nft) => nft.$nftId),
  );

  const isLoading = isLoadingWallets || isLoadingNFTs;
  const [hideObjectionableContent] = useHideObjectionableContent();

  const { data: nachoNFTs } = useNachoNFTs();

  const filteredData = useMemo(() => {
    if (nachoNFTs && walletId === -1) {
      return nachoNFTs;
    }

    if (!nfts) {
      return nfts;
    }

    return nfts
      .filter((nft) => {
        if (walletId !== undefined && nft.walletId !== walletId) {
          return false;
        }

        if (
          hideObjectionableContent &&
          allAllowedNFTs.indexOf(nft.$nftId) === -1
        ) {
          return false;
        }

        return true;
      })
      .map((nft) => {
        if (NFTmetadataObj[nft.$nftId]) {
          return { ...nft, metadata: NFTmetadataObj[nft.$nftId] };
        }
        return nft;
      });
  }, [walletId, nfts, hideObjectionableContent, nachoNFTs, allAllowedNFTs]);

  return {
    filteredNFTs: filteredData,
    isLoading,
  };
}
