import { Flex, useDarkMode } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';
import styled from 'styled-components';

import useHideObjectionableContent from '../../hooks/useHideObjectionableContent';
import useNFTs from '../../hooks/useNFTs';
import NFTMetadata from '../nfts/NFTMetadata';
import NFTPreview from '../nfts/NFTPreview';
import NFTTitle from '../nfts/NFTTitle';

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

export type OfferBuilderValueSearchProps = {
  value: string;
  onSelectNFT: (nftId: string) => void;
};

export default function OfferBuilderValueSearch(props: OfferBuilderValueSearchProps) {
  const { value = '', onSelectNFT } = props;
  const [hideObjectionableContent] = useHideObjectionableContent();
  const { nfts, isLoading } = useNFTs({
    hideSensitiveContent: hideObjectionableContent,
    search: value,
  });

  const { isDarkMode } = useDarkMode();

  function selectNFT(nftId: string) {
    onSelectNFT(nftId);
  }

  return (
    <SearchPlaceholder isDarkMode={isDarkMode} style={{ display: value.length ? 'block' : 'none' }}>
      <div>
        {isLoading ? (
          <Trans>Loading NFTs...</Trans>
        ) : (
          nfts.map((nft) => (
            <SearchNFTrow className="nft-searched-row" onClick={() => selectNFT(nft.$nftId)} isDarkMode={isDarkMode}>
              <div>
                <NFTPreview nft={nft} fit="cover" isCompact preview />
              </div>
              <NFTSearchedText>
                <Flex flexDirection="column">
                  <NFTTitle nftId={nft.$nftId} highlight={value} />
                  <NFTMetadata nftId={nft.$nftId} path="collection?.name" highlight={value} />
                </Flex>
              </NFTSearchedText>
            </SearchNFTrow>
          ))
        )}
      </div>
    </SearchPlaceholder>
  );
}
