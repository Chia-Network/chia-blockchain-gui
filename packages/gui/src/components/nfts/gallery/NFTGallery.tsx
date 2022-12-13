import type { NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import { Flex, LayoutDashboardSub, Loading, /* useTrans, */ usePersistState, useDarkMode } from '@chia-network/core';
import { WalletReceiveAddressField } from '@chia-network/wallets';
import { t, Trans } from '@lingui/macro';
import { FormControlLabel, RadioGroup, FormControl, Checkbox, Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import FilterIcon from '../../../assets/img/filter.svg';
import MultiSelectIcon from '../../../assets/img/multi-select.svg';
import useAllowFilteredShow from '../../../hooks/useAllowFilteredShow';
import useHiddenNFTs from '../../../hooks/useHiddenNFTs';
import useHideObjectionableContent from '../../../hooks/useHideObjectionableContent';
import type NFTSelection from '../../../types/NFTSelection';
import { mimeTypeRegex, isImage, isDocument, getNFTFileType } from '../../../util/utils';
import NFTCardLazy from '../NFTCardLazy';
import { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTProfileDropdown from '../NFTProfileDropdown';
import FilterPill from './FilterPill';
import NFTGalleryHero from './NFTGalleryHero';
import Search from './NFTGallerySearch';
import useFilteredNFTs from './NFTfilteredNFTs';
import SelectedActionsDialog from './SelectedActionsDialog';

export const defaultCacheSizeLimit = 1024; /* MB */

export function searchableNFTContent(nft: NFTInfo) {
  const items = [
    nft.$nftId,
    nft.dataUris?.join(' ') ?? '',
    nft.launcherId,
    nft.metadata?.name,
    nft.metadata?.collection?.name,
  ];

  return items.join(' ').toLowerCase();
}

const StyledGrid = styled(Grid)`
  &.show-multiple-select .empty .multiple-selection-empty {
    display: inline-block !important;
  }
  &.show-multiple-select .multiple-selection-empty {
    display: none;
  }
  &.show-multiple-select .multiple-selection .card-wrapper {
    border: 1px solid ${(props) => props.theme.palette.primary.main};
    box-shadow: inset 0px 0px 0px 1px ${(props) => props.theme.palette.primary.main};
    padding: 0;
    border-radius: 5px;
    .multiple-selection-checkmark {
      display: inline-block;
    }
  }
  .hidden .card-wrapper {
    opacity: 0.5;
  }
`;

const SelectedActionsContainer = styled.div`
  position: absolute;
  text-align: center;
  width: 100%;
  background: green;
  display: none;
  &.active {
    display: block;
  }
`;

const VisibilityRadioWrapper = styled.div`
  position: relative;
  z-index: 7;
  > div {
    position: absolute;
    right: -15px;
    top: 30px;
    background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
    padding: 15px;
    border: 1px solid ${(props) => (props.isDarkMode ? '#333' : '#fff')};
  }
  span {
    white-space: nowrap;
  }
`;

const MultiSelectAndFilterWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 15px;
  background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
  border: 1px solid ${(props) => (props.isDarkMode ? '#333' : '#e0e0e0')};
  border-radius: 5px;
  > * {
    cursor: pointer;
  }
  > * + * {
    margin-left: 20px;
  }
  &.active {
    svg:first-child {
      path {
        stroke: ${(props) => props.theme.palette.primary.main};
      }
      rect {
        stroke: ${(props) => props.theme.palette.primary.main};
      }
      rect:nth-child(3) {
        fill: ${(props) => props.theme.palette.primary.main};
      }
    }
  }
`;

const Filters = styled.div`
  display: flex;
  > * + * {
    margin-left: 15px;
  }
`;

const FilterIconStyled = styled(FilterIcon)`
  path {
    stroke: ${(props) => (props.active ? props.theme.palette.primary.main : '#aaa')};
  }
`;

export default function NFTGallery() {
  const [selection, setSelection] = useState<NFTSelection>({
    items: [],
  });
  const [search, setSearch] = useState('');
  const [inMultipleSelectionMode, toggleMultipleSelection] = useState(false);
  const [typeFilter, setTypeFilter] = useLocalStorage('typeFilter', []); /* exclude types that are inside array */
  const [isNFTHidden] = useHiddenNFTs();
  const [walletId, setWalletId] = usePersistState<number | undefined>(undefined, 'nft-profile-dropdown');
  const { filteredNFTs, isLoading } = useFilteredNFTs({ walletId });
  const [hideObjectionableContent] = useHideObjectionableContent();
  const { allowNFTsFiltered } = useAllowFilteredShow(filteredNFTs, hideObjectionableContent, isLoading);
  const [filtersShown, setFiltersShown] = useState<string[]>([]);
  const [visibilityFilters, setVisibilityFilters] = useLocalStorage('visibilityFilters', ['visible']);
  const typesFilterRef = React.useRef();
  const visibilityFilterRef = React.useRef();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    const listener = (event) => {
      if (
        !typesFilterRef.current ||
        typesFilterRef.current.contains(event.target) ||
        !visibilityFilterRef.current ||
        visibilityFilterRef.current.contains(event.target)
      ) {
        return;
      }
      setFiltersShown([]);
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, []);

  const nftTypes: any = {};

  filteredNFTs
    .filter((nft: NFTInfo) => {
      if (visibilityFilters.indexOf('hidden') === -1 && isNFTHidden(nft)) {
        return false;
      }
      if (visibilityFilters.indexOf('visible') === -1 && !isNFTHidden(nft)) {
        return false;
      }
      return true;
    })
    .forEach((nft: NFTInfo) => {
      const file = Array.isArray(nft.dataUris) && nft.dataUris[0];
      if (file) {
        if (mimeTypeRegex(file, /^audio/)) {
          nftTypes.Audio = (nftTypes.Audio || 0) + 1;
        } else if (mimeTypeRegex(file, /^video/)) {
          nftTypes.Video = (nftTypes.Video || 0) + 1;
        } else if (mimeTypeRegex(file, /^model/)) {
          nftTypes.Model = (nftTypes.Model || 0) + 1;
        } else if (isImage(file)) {
          nftTypes.Image = (nftTypes.Image || 0) + 1;
        } else {
          nftTypes.Unknown = (nftTypes.Unknown || 0) + 1;
        }
        try {
          const extension = new URL(file).pathname.split('.').slice(-1)[0];
          if (extension.match(/^[a-zA-Z0-9]+$/) && isDocument(extension)) {
            nftTypes.Document = (nftTypes.Document || 0) + 1;
          }
        } catch (e) {
          console.error(`Failed to check file extension for ${file}: ${e}`);
        }
      }
    });

  const nftContainerRef = React.useRef(null);
  const galleryHeroRef = React.useRef(null);

  const navigate = useNavigate();

  const [selectedNFTIds, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);

  function handleSelect(nft: NFTInfo, selected: boolean) {
    setSelection((currentSelection) => {
      const { items } = currentSelection;

      return {
        items: selected ? [...items, nft] : items.filter((item) => item.$nftId !== nft.$nftId),
      };
    });
  }

  if (isLoading) {
    return <Loading center />;
  }

  function applyTypeFilter(nft: NFTInfo) {
    if (typeFilter.indexOf(getNFTFileType(nft)) > -1) {
      return false;
    }
    return true;
  }

  function showCard(nft: NFTInfo) {
    if (allowNFTsFiltered.map((nft) => nft.nftId).indexOf(nft?.$nftId) === -1) {
      return false;
    }
    if (visibilityFilters.indexOf('hidden') === -1 && isNFTHidden(nft)) {
      return false;
    }
    if (visibilityFilters.indexOf('visible') === -1 && !isNFTHidden(nft)) {
      return false;
    }
    if (applyTypeFilter(nft) === false) {
      return false;
    }

    const metadataObj = allowNFTsFiltered.find((obj: any) => obj.nftId === nft.$nftId) || {};
    const content = searchableNFTContent({ ...nft, metadata: metadataObj.metadata });
    return content.includes(search.toLowerCase());
  }

  function showCount() {
    return filteredNFTs.filter((nft) => {
      if (allowNFTsFiltered.map((nft) => nft.nftId).indexOf(nft?.$nftId) === -1) {
        return false;
      }
      if (applyTypeFilter(nft) === false) {
        return false;
      }
      if (visibilityFilters.indexOf('hidden') === -1 && isNFTHidden(nft)) {
        return false;
      }
      if (visibilityFilters.indexOf('visible') === -1 && !isNFTHidden(nft)) {
        return false;
      }
      const metadataObj = allowNFTsFiltered.find((obj: any) => obj.nftId === nft.$nftId) || {};
      const content = searchableNFTContent({ ...nft, metadata: metadataObj.metadata });
      return content.includes(search.toLowerCase());
    }).length;
  }

  function selectedItemAction(nftId: string) {
    if (inMultipleSelectionMode) {
      setSelectedNFTIds(
        selectedNFTIds.indexOf(nftId) === -1 ? selectedNFTIds.concat(nftId) : selectedNFTIds.filter((x) => x !== nftId)
      );
    } else {
      navigate(`/dashboard/nfts/${nftId}`);
    }
  }

  function countNFTs(type: any) {
    return filteredNFTs.filter((nft) => {
      if (applyTypeFilter(nft) === false) {
        return false;
      }
      if (allowNFTsFiltered.map((nft) => nft.nftId).indexOf(nft?.$nftId) === -1) {
        return false;
      }
      if (type === 'visible' && isNFTHidden(nft)) {
        return false;
      }
      if (type === 'hidden' && !isNFTHidden(nft)) {
        return false;
      }
      return true;
    }).length;
  }

  function renderTypeFilter() {
    if (Object.keys(nftTypes).length === 0) return null;
    return (
      <div>
        <FormControl>
          <RadioGroup>
            {Object.keys(nftTypes)
              .sort()
              .map((key: string) => (
                <FormControlLabel
                  control={<Checkbox />}
                  label={t`${key} (${nftTypes[key]})`}
                  checked={typeFilter.indexOf(key) === -1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTypeFilter(
                      typeFilter.indexOf(key) === -1 ? typeFilter.concat(key) : typeFilter.filter((x) => key !== x)
                    );
                  }}
                />
              ))}
          </RadioGroup>
        </FormControl>
      </div>
    );
  }

  function toggleVisibilityFilter(e, type: string) {
    e.preventDefault();
    e.stopPropagation();
    setVisibilityFilters(
      visibilityFilters.indexOf(type) === -1
        ? visibilityFilters.concat(type)
        : visibilityFilters.filter((x) => x !== type)
    );
  }

  function checkedNftTypes(nftTypes: any, typeFilter: string[]) {
    return Object.keys(nftTypes).filter((key) => typeFilter.indexOf(key) > -1).length;
  }

  return (
    <LayoutDashboardSub
      // sidebar={<NFTGallerySidebar onWalletChange={setWalletId} />}
      header={
        <>
          <Flex gap={2} alignItems="stretch" flexWrap="wrap" justifyContent="space-between">
            <NFTProfileDropdown onChange={setWalletId} walletId={walletId} />
            <Search onChange={setSearch} placeholder={t`Search...`} />
            <WalletReceiveAddressField variant="outlined" size="small" fullWidth isDarkMode={isDarkMode} />
            <MultiSelectAndFilterWrapper className={inMultipleSelectionMode ? 'active' : ''} isDarkMode={isDarkMode}>
              <MultiSelectIcon onClick={() => toggleMultipleSelection(!inMultipleSelectionMode)} />
              <FilterIconStyled active={typeFilter.length > 0 || visibilityFilters.length !== 1} />
            </MultiSelectAndFilterWrapper>
          </Flex>

          <Flex gap={2} alignItems="center" flexWrap="wrap" justifyContent="space-between" sx={{ padding: '10px 0' }}>
            {t`Showing ${showCount()} of ${allowNFTsFiltered.length} items`}

            <Filters>
              <div ref={typesFilterRef} style={{ display: Object.keys(nftTypes).length ? 'block' : 'none' }}>
                <FilterPill
                  setFiltersShown={setFiltersShown}
                  filtersShown={filtersShown}
                  which="types"
                  title={t`Types (${Object.keys(nftTypes).length - checkedNftTypes(nftTypes, typeFilter)} /
                      ${Object.keys(nftTypes).length})`}
                  isDarkMode={isDarkMode}
                >
                  <VisibilityRadioWrapper isDarkMode={isDarkMode}>
                    <div>{renderTypeFilter()}</div>
                  </VisibilityRadioWrapper>
                </FilterPill>
              </div>
              <div ref={visibilityFilterRef}>
                <FilterPill
                  setFiltersShown={setFiltersShown}
                  filtersShown={filtersShown}
                  which="visibility"
                  title={
                    visibilityFilters.length > 1
                      ? t`Visible and hidden (${countNFTs('hidden') + countNFTs('visible')})`
                      : visibilityFilters[0] === 'visible'
                      ? t`Visible (${countNFTs('visible')})`
                      : t`Hidden (${countNFTs('hidden')})`
                  }
                  isDarkMode={isDarkMode}
                >
                  <VisibilityRadioWrapper isDarkMode={isDarkMode}>
                    <div>
                      <FormControl>
                        <RadioGroup>
                          <FormControlLabel
                            control={<Checkbox />}
                            label={`${t`Visible`} (${countNFTs('visible')})`}
                            checked={visibilityFilters.indexOf('visible') > -1}
                            onClick={(e) => toggleVisibilityFilter(e, 'visible')}
                          />
                          <FormControlLabel
                            control={<Checkbox />}
                            label={`${t`Hidden`} (${countNFTs('hidden')})`}
                            checked={visibilityFilters.indexOf('hidden') > -1}
                            onClick={(e) => toggleVisibilityFilter(e, 'hidden')}
                          />
                        </RadioGroup>
                      </FormControl>
                    </div>
                  </VisibilityRadioWrapper>
                </FilterPill>
              </div>
            </Filters>
          </Flex>
        </>
      }
    >
      {!filteredNFTs?.length ? (
        <NFTGalleryHero />
      ) : (
        <>
          <SelectedActionsContainer
            style={{ display: inMultipleSelectionMode ? 'block' : 'none' }}
            className={inMultipleSelectionMode && 'active'}
          >
            <SelectedActionsDialog
              allCount={allowNFTsFiltered.length}
              nfts={filteredNFTs.filter((nft: NFTInfo) => selectedNFTIds.indexOf(nft.$nftId) > -1)}
            />
          </SelectedActionsContainer>
          <div ref={galleryHeroRef} style={{ display: 'none' }}>
            <NFTGalleryHero />
          </div>
          <StyledGrid
            spacing={2}
            alignItems="stretch"
            container
            className={`${inMultipleSelectionMode ? 'active show-multiple-select' : ''}`}
            ref={nftContainerRef}
          >
            {filteredNFTs.map((nft: NFTInfo) => {
              const gridClassNames = [];
              if (selectedNFTIds.indexOf(nft.$nftId) > -1) {
                gridClassNames.push('multiple-selection');
              } else {
                gridClassNames.push('empty');
              }
              if (isNFTHidden(nft)) {
                gridClassNames.push('hidden');
              }
              return (
                <Grid
                  xs={12}
                  sm={6}
                  md={4}
                  lg={4}
                  xl={3}
                  key={nft.$nftId}
                  item
                  style={{ display: showCard(nft) ? 'block' : 'none' }}
                  className={gridClassNames.join(' ')}
                >
                  <NFTCardLazy
                    nft={nft}
                    onSelect={(selected) => handleSelect(nft, selected)}
                    selected={selection.items.some((item) => item.$nftId === nft.$nftId)}
                    canExpandDetails
                    availableActions={NFTContextualActionTypes.All}
                    isOffer={false}
                    selectedItemAction={selectedItemAction}
                  />
                </Grid>
              );
            })}
          </StyledGrid>
        </>
      )}
    </LayoutDashboardSub>
  );
}
