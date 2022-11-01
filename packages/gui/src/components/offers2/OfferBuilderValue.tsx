import React, { ReactNode } from 'react';
import { useWatch } from 'react-hook-form';
import styled from 'styled-components';
import { t, Trans } from '@lingui/macro';
import {
  Flex,
  Amount,
  Fee,
  Loading,
  TextField,
  Tooltip,
  FormatLargeNumber,
  usePersistState,
} from '@chia/core';
import { Box, Typography, IconButton } from '@mui/material';
import { ConstructionOutlined, Remove } from '@mui/icons-material';
import useOfferBuilderContext from '../../hooks/useOfferBuilderContext';
import OfferBuilderTokenSelector from './OfferBuilderTokenSelector';
import useFilteredNFTs from '../nfts/gallery/NFTfilteredNFTs';
import { NFTInfo } from '@chia/api';
import NFTPreview from '../nfts/NFTPreview';

export type OfferBuilderValueProps = {
  name: string;
  label: ReactNode;
  caption?: ReactNode;
  type?: 'text' | 'amount' | 'fee' | 'token';
  isLoading?: boolean;
  onRemove?: () => void;
  symbol?: string;
  showAmountInMojos?: boolean;
  usedAssets?: string[];
  disableReadOnly?: boolean;
  onSelectNFT: (nftId: string) => void;
};

export default function OfferBuilderValue(props: OfferBuilderValueProps) {
  const {
    name,
    caption,
    label,
    onRemove,
    isLoading = false,
    type = 'text',
    symbol,
    showAmountInMojos,
    usedAssets,
    disableReadOnly = false,
    onSelectNFT,
  } = props;
  const { readOnly: builderReadOnly } = useOfferBuilderContext();

  let value = useWatch({
    name,
  });

  const [walletId] = usePersistState<number | undefined>(
    undefined,
    'nft-profile-dropdown',
  );

  const { filteredNFTs, isLoadingNFTs } = useFilteredNFTs({ walletId });

  const searchPlaceholderRef = React.useRef();

  let searchedNFTidx = -1;

  function changeHighlight(direction) {
    if (searchPlaceholderRef.current) {
      const rows = [
        ...searchPlaceholderRef.current.querySelectorAll('.nft-searched-row'),
      ];
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
          container.scrollBy(
            0,
            rows[searchedNFTidx].offsetTop - container.scrollTop - 50,
          );
        }
      }
    }
  }

  function NFTKeyPressed(e) {
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
  }

  const foundNFTs = React.useMemo(() => {
    return filteredNFTs.filter((nft: NFTInfo) => {
      if (
        nft.metadata &&
        nft.metadata?.name?.toLowerCase().indexOf(value.toLowerCase()) > -1
      ) {
        return true;
      }
      if (nft?.dataUris[0]?.toLowerCase().indexOf(value.toLowerCase()) > -1) {
        return true;
      }
      if (nft?.$nftId.substring(3).indexOf(value) > -1) {
        return true;
      }
      return false;
    });
  }, [filteredNFTs, value]);

  const readOnly = disableReadOnly ? false : builderReadOnly;
  const displayValue = !value ? (
    <Trans>Not Available</Trans>
  ) : ['amount', 'fee', 'token'].includes(type) ? (
    <FormatLargeNumber value={value} />
  ) : (
    value
  );

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

  function selectNFT(nftId: string) {
    onSelectNFT(nftId);
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

  function renderSearchResults() {
    if (value.length > 1 && foundNFTs.length > 0) {
      const nftPreviews = foundNFTs.map((nft: NFTInfo) => {
        return (
          <SearchNFTrow
            className="nft-searched-row"
            onClick={() => selectNFT(nft.$nftId)}
            onMouseEnter={() => {
              searchedNFTidx = -1;
              [
                ...searchPlaceholderRef.current.querySelectorAll(
                  '.nft-searched-row',
                ),
              ].forEach((dom) => (dom.style.backgroundColor = ''));
            }}
          >
            <div>
              <NFTPreview
                nft={nft}
                fit="cover"
                isPreview
                metadata={nft?.metadata}
                isCompact
                miniThumb
              />
            </div>
            <NFTSearchedText>
              <div>
                {highlightSearchedString(value, nft.metadata?.name) ||
                  t`Title Not Available`}
              </div>
              <div>{highlightSearchedString(value, nft.dataUris[0])}</div>
            </NFTSearchedText>
          </SearchNFTrow>
        );
      });
      return (
        <SearchPlaceholder ref={searchPlaceholderRef}>
          <div>
            {isLoadingNFTs ? <Trans>Loading NFTs...</Trans> : nftPreviews}
          </div>
        </SearchPlaceholder>
      );
    }

    return null;
  }

  return (
    <Flex flexDirection="column" minWidth={0} gap={1}>
      {isLoading ? (
        <Loading />
      ) : readOnly ? (
        <>
          <Typography variant="body2" color="textSecondary">
            {label}
          </Typography>
          <Tooltip title={displayValue} copyToClipboard>
            <Typography variant="h6" noWrap>
              {type === 'token' ? (
                <OfferBuilderTokenSelector
                  variant="filled"
                  color="secondary"
                  label={label}
                  name={name}
                  required
                  fullWidth
                  readOnly
                />
              ) : (
                <>
                  {displayValue}
                  &nbsp;
                  {symbol}
                </>
              )}
            </Typography>
          </Tooltip>
        </>
      ) : (
        <Flex gap={2} alignItems="center">
          <Box flexGrow={1} minWidth={0}>
            {type === 'amount' ? (
              <Amount
                variant="filled"
                color="secondary"
                label={label}
                name={name}
                symbol={symbol}
                showAmountInMojos={showAmountInMojos}
                required
                fullWidth
              />
            ) : type === 'fee' ? (
              <Fee
                variant="filled"
                color="secondary"
                label={label}
                name={name}
                required
                fullWidth
              />
            ) : type === 'text' ? (
              <>
                <TextField
                  variant="filled"
                  color="secondary"
                  label={label}
                  name={name}
                  required
                  fullWidth
                  onKeyDown={NFTKeyPressed}
                />
                {renderSearchResults()}
              </>
            ) : type === 'token' ? (
              <OfferBuilderTokenSelector
                variant="filled"
                color="secondary"
                label={label}
                name={name}
                usedAssets={usedAssets}
                required
                fullWidth
              />
            ) : (
              <Typography variant="body2">
                <Trans>{type} is not supported</Trans>
              </Typography>
            )}
          </Box>
          {onRemove && (
            <Box>
              <IconButton onClick={onRemove}>
                <Remove />
              </IconButton>
            </Box>
          )}
        </Flex>
      )}
      {caption && (
        <Typography variant="caption" color="textSecondary">
          {caption}
        </Typography>
      )}
    </Flex>
  );
}
