import { NFTInfo, Wallet } from '@chia-network/api';
import { useGetNFTWallets } from '@chia-network/api-react';
import { useDarkMode } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import React from 'react';
import styled from 'styled-components';

import useAllowFilteredShow from '../../hooks/useAllowFilteredShow';
import useFetchNFTs from '../../hooks/useFetchNFTs';
import useHideObjectionableContent from '../../hooks/useHideObjectionableContent';
import NFTPreview from '../nfts/NFTPreview';

const SearchNFTrow = styled.div`
  cursor: pointer;
  width: 100%;
  padding: 5px;
  display: table;
  &:hover {
    background: ${(props) => (props.isDarkMode ? '#444' : '#eee')} !important;
  }
  > div:first-child {
    width: 50px;
  }
  > div {
    display: table-cell;
    vertical-align: top;
    padding: 5px;
    text-align: left;
  }
`;

const NFTSearchedText = styled.div`
  .highlight {
    color: ${(props) => props.theme.palette.primary.main};
  }
  div:last-child {
    font-size: 13px;
  }
`;

const SearchPlaceholder = styled.div`
  position: relative;
  top: 10px;
  z-index: 3;
  background: red;
  > div {
    background: ${(props) => (props.isDarkMode ? '#222' : '#fafafa')};
    ::-webkit-scrollbar-thumb {
      background-color: ${(props) => (props.isDarkMode ? '#444' : '#ddd')};
      border: 4px solid transparent;
      border-radius: 8px;
      background-clip: padding-box;
    }
    ::-webkit-scrollbar {
      width: 16px;
    }
    border: 1px solid ${(props) => (props.isDarkMode ? '#222' : '#ddd')};
    border-radius: 15px;
    box-shadow: 0px 0px 25px 0 rgba(0, 0, 0, 0.2);
    max-height: 300px;
    width: 450px;
    overflow-x: hidden;
    overflow-y: hidden;
    overflow-y: auto;
    position: absolute;
    > div:nth-child(odd) {
      background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
    }
    > div:nth-child(even) {
      background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
    }
  }
`;

type OfferBuilderValueSearchProps = {
  value: string;
  onSelectNFT: (nftId: string) => void;
};

function highlightSearchedString(searchString: string, str: string) {
  if (!str) return '';
  const r = new RegExp(`(${searchString})`, 'i');
  return str
    .split(r)
    .map((part) =>
      part.toLocaleLowerCase() === searchString.toLocaleLowerCase() ? (
        <span className="highlight">{part}</span>
      ) : (
        <span>{part}</span>
      )
    );
}

export default function OfferBuilderValueSearch(props: OfferBuilderValueSearchProps) {
  const { value, onSelectNFT } = props;
  const { wallets: nftWallets } = useGetNFTWallets();
  const { nfts, isLoading } = useFetchNFTs(nftWallets.map((wallet: Wallet) => wallet.id));
  const [hideObjectionableContent] = useHideObjectionableContent();
  const { allowNFTsFiltered } = useAllowFilteredShow(nfts, hideObjectionableContent, isLoading);
  const { isDarkMode } = useDarkMode();

  function isNFTInSearchValue(searchString: string, nft: NFTInfo) {
    const metadataObj = allowNFTsFiltered.find((obj: any) => obj.nftId === nft.$nftId) || {};
    if (metadataObj.metadata?.name?.toLowerCase().indexOf(searchString.toLowerCase()) > -1) {
      return true;
    }
    if (
      nft.metadata &&
      metadataObj.metadata?.collection?.name?.toLowerCase().indexOf(searchString.toLowerCase()) > -1
    ) {
      return true;
    }
    return false;
  }

  function selectNFT(nftId: string) {
    onSelectNFT(nftId);
  }

  const nftPreviews = nfts
    .map((nft: NFTInfo) => {
      const metadataObj = allowNFTsFiltered.find((obj: any) => obj.nftId === nft.$nftId) || {};
      const metadata = metadataObj?.metadata;
      return { ...nft, metadata };
    })
    .map((nft: NFTInfo) => (
      <SearchNFTrow
        className="nft-searched-row"
        onClick={() => selectNFT(nft.$nftId)}
        style={{ display: isNFTInSearchValue(value, nft) ? 'block' : 'none' }}
        isDarkMode={isDarkMode}
      >
        <div>
          <NFTPreview nft={nft} fit="cover" isPreview metadata={nft?.metadata} isCompact miniThumb />
        </div>
        <NFTSearchedText>
          <div>{highlightSearchedString(value, nft.metadata?.name) || t`Title Not Available`}</div>
          <div>{highlightSearchedString(value, nft.metadata?.collection?.name)}</div>
        </NFTSearchedText>
      </SearchNFTrow>
    ));
  return (
    <SearchPlaceholder isDarkMode={isDarkMode} style={{ display: value.length > 0 ? 'block' : 'none' }}>
      <div>{isLoading ? <Trans>Loading NFTs...</Trans> : nftPreviews}</div>
    </SearchPlaceholder>
  );
}
