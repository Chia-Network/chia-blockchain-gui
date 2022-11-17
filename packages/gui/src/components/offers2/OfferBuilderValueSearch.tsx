import React, { forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
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

let searchedNFTidx = -1;

export default forwardRef((props: OfferBuilderValueSearchProps, ref) => {
  const { value, onSelectNFT } = props;
  const [walletId] = usePersistState<number | undefined>(undefined, 'nft-profile-dropdown');
  const { filteredNFTs, isLoading } = useFilteredNFTs({ walletId });

  useImperativeHandle(ref, () => ({
    keyPressed: (e) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        selectNFT(foundNFTs.map((nft: NFTInfo) => nft.$nftId)[searchedNFTidx]);
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        changeHighlight(1);
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        changeHighlight(-1);
      }
    },
  }));

  const foundNFTs = React.useMemo(() => {
    return filteredNFTs.filter((nft: NFTInfo) => {
      if (nft.metadata && nft.metadata?.name?.toLowerCase().indexOf(value.toLowerCase()) > -1) {
        return true;
      }
      if (nft.metadata && nft.metadata?.collection?.name?.toLowerCase().indexOf(value.toLowerCase()) > -1) {
        return true;
      }
      return false;
    });
  }, [filteredNFTs, value]);

  function changeHighlight(direction) {
    if (searchPlaceholderRef.current) {
      const rows = [...searchPlaceholderRef.current.querySelectorAll('.nft-searched-row')];
      const container = [...searchPlaceholderRef.current.children][0];
      if (direction === 1 && searchedNFTidx + 1 < rows.length) {
        if (searchedNFTidx > -1) {
          rows[searchedNFTidx].style.backgroundColor = '';
        }
        searchedNFTidx++;
        rows[searchedNFTidx].style.backgroundColor = '#eee';
        if (rows[searchedNFTidx].offsetTop > container.scrollTop + 250) {
          container.scrollBy(0, 200);
        }
      }
      if (direction === -1 && searchedNFTidx > 0) {
        rows[searchedNFTidx].style.backgroundColor = '';
        searchedNFTidx--;
        rows[searchedNFTidx].style.backgroundColor = '#eee';
        if (rows[searchedNFTidx].offsetTop - container.scrollTop < 0) {
          container.scrollBy(0, rows[searchedNFTidx].offsetTop - container.scrollTop - 50);
        }
      }
    }
  }

  const searchPlaceholderRef = React.useRef();

  function selectNFT(nftId: string) {
    onSelectNFT(nftId);
    searchedNFTidx = -1;
  }

  if (value.length > 1 && foundNFTs.length > 0) {
    const nftPreviews = foundNFTs.map((nft: NFTInfo) => {
      return (
        <SearchNFTrow
          className="nft-searched-row"
          onClick={() => selectNFT(nft.$nftId)}
          onMouseEnter={() => {
            searchedNFTidx = -1;
            [...searchPlaceholderRef.current.querySelectorAll('.nft-searched-row')].forEach(
              (dom) => (dom.style.backgroundColor = '')
            );
          }}
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
      <SearchPlaceholder ref={searchPlaceholderRef}>
        <div>{isLoading ? <Trans>Loading NFTs...</Trans> : nftPreviews}</div>
      </SearchPlaceholder>
    );
  }
  return null;
});
