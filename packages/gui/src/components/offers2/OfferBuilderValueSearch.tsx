import React from 'react';
import styled from 'styled-components';
import { t, Trans } from '@lingui/macro';
import NFTPreview from '../nfts/NFTPreview';
import useFilteredNFTs from '../nfts/gallery/NFTfilteredNFTs';
import { NFTInfo } from '@chia/api';
import { usePersistState } from '@chia/core';

const SearchNFTrow = styled.div`
  cursor: pointer;
  width: 100%;
  padding: 5px;
  display: table;
  &:hover {
    background: #eee !important;
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
    background: #fafafa;
    ::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border: 4px solid transparent;
      border-radius: 8px;
      background-clip: padding-box;
    }
    ::-webkit-scrollbar {
      width: 16px;
    }
    border: 1px solid #ddd;
    border-radius: 15px;
    box-shadow: 0px 0px 25px 0 rgba(0, 0, 0, 0.2);
    max-height: 300px;
    width: 450px;
    overflow-x: hidden;
    overflow-y: hidden;
    overflow-y: auto;
    position: absolute;
    > div:nth-child(odd) {
      background: #f8f8f8;
    }
    > div:nth-child(even) {
      background: #fff;
    }
  }
`;

type OfferBuilderValueSearchProps = {
  value: string;
  onSelectNFT: (nftId: string) => void;
};

function isNFTInSearchValue(value, nft: NFTInfo) {
  if (nft.metadata && nft.metadata?.name?.toLowerCase().indexOf(value.toLowerCase()) > -1) {
    return true;
  }
  if (nft.metadata && nft.metadata?.collection?.name?.toLowerCase().indexOf(value.toLowerCase()) > -1) {
    return true;
  }
  return false;
}

function highlightSearchedString(searchString: string, str: string) {
  if (!str) return '';
  const r = new RegExp('(' + searchString + ')', 'i');
  return str.split(r).map((part) => {
    return part.toLocaleLowerCase() === searchString.toLocaleLowerCase() ? (
      <span className="highlight">{part}</span>
    ) : (
      <span>{part}</span>
    );
  });
}

export default function OfferBuilderValueSearch(props: OfferBuilderValueSearchProps) {
  const { value, onSelectNFT } = props;
  const [walletId] = usePersistState<number | undefined>(undefined, 'nft-profile-dropdown');
  const { filteredNFTs, isLoading } = useFilteredNFTs({ walletId });

  function selectNFT(nftId: string) {
    onSelectNFT(nftId);
  }

  const nftPreviews = filteredNFTs.map((nft: NFTInfo) => {
    return (
      <SearchNFTrow
        className="nft-searched-row"
        onClick={() => selectNFT(nft.$nftId)}
        style={{ display: isNFTInSearchValue(value, nft) ? 'block' : 'none' }}
      >
        <div>
          <NFTPreview nft={nft} fit="cover" isPreview metadata={nft?.metadata} isCompact miniThumb />
        </div>
        <NFTSearchedText>
          <div>{highlightSearchedString(value, nft.metadata?.name) || t`Title Not Available`}</div>
          <div>{highlightSearchedString(value, nft.metadata?.collection?.name)}</div>
        </NFTSearchedText>
      </SearchNFTrow>
    );
  });
  return (
    <SearchPlaceholder style={{ display: value.length > 0 ? 'block' : 'none' }}>
      <div>{isLoading ? <Trans>Loading NFTs...</Trans> : nftPreviews}</div>
    </SearchPlaceholder>
  );
}
