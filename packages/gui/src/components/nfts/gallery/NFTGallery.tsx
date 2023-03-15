import type { NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import {
  Flex,
  LayoutDashboardSub,
  Loading,
  /* useTrans, */ useDarkMode,
  usePersistState,
  Tooltip,
} from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { FormControlLabel, RadioGroup, FormControl, Checkbox, Grid, Button, Fade, Box } from '@mui/material';
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import FilterIcon from '../../../assets/img/filter.svg';
import MultiSelectIcon from '../../../assets/img/multi-select.svg';
import useAllowFilteredShow from '../../../hooks/useAllowFilteredShow';
import useHiddenNFTs from '../../../hooks/useHiddenNFTs';
import useHideObjectionableContent from '../../../hooks/useHideObjectionableContent';
import useNFTGalleryScrollPosition from '../../../hooks/useNFTGalleryScrollPosition';
import useSyncCache from '../../../hooks/useSyncCache';
import { mimeTypeRegex, isImage, isDocument, getNFTFileType } from '../../../util/utils';
import NFTCardLazy from '../NFTCardLazy';
import { NFTContextualActionTypes } from '../NFTContextualActions';
import { NFTFilterContext } from '../NFTFilterProvider';
import NFTProfileDropdown from '../NFTProfileDropdown';
import FilterPill from './FilterPill';
import NFTGalleryHero from './NFTGalleryHero';
import Search from './NFTGallerySearch';
import useFilteredNFTs from './NFTfilteredNFTs';
import SelectedActionsDialog from './SelectedActionsDialog';

export const defaultCacheSizeLimit = 1024; /* MB */

const maxNFTsPerPage = 200;

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
  position: fixed;
  text-align: center;
  width: 100%;
  bottom: 25px;
  z-index: 7;
  &.active {
    display: block;
  }
`;

const VisibilityRadioWrapper = styled.div<{ isDarkMode: boolean }>`
  position: relative;
  z-index: 7;
  > div {
    position: absolute;
    right: -15px;
    top: 30px;
    background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
    padding: 15px;
    border: 1px solid ${(props) => (props.isDarkMode ? '#333' : '#e0e0e0')};
  }
  span {
    white-space: nowrap;
  }
`;

const MultiSelectAndFilterWrapper = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 15px;
  background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
  border: 1px solid ${(props) => (props.isDarkMode ? '#333' : '#e0e0e0')};
  border-radius: 5px;
  margin-left: 15px;
  > * + * {
    margin-left: 20px;
  }
  &.active {
    svg:first-child {
      path {
        stroke: ${(props) => props.theme.palette.primary.main} !important;
      }
      rect {
        stroke: ${(props) => props.theme.palette.primary.main} !important;
      }
      rect:nth-child(3) {
        fill: ${(props) => props.theme.palette.primary.main} !important;
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

const FilterIconStyled = styled(FilterIcon)<{ active: boolean; onMouseDown: any }>`
  cursor: pointer;
  position: relative;
  top: 2px;
  path {
    stroke: ${(props) => (props.active ? props.theme.palette.primary.main : '')};
  }
`;

const MultiSelectIconStyled = styled(MultiSelectIcon)<{ isDarkMode: boolean }>`
  cursor: pointer;
  position: relative;
  top: 3px;
  path {
    stroke: ${(props) => (props.isDarkMode ? props.theme.palette.common.white : props.theme.palette.text.secondary)};
  }
  rect {
    stroke: ${(props) => (props.isDarkMode ? props.theme.palette.common.white : props.theme.palette.text.secondary)};
  }
  rect:nth-child(3) {
    stroke: ${(props) => (props.isDarkMode ? props.theme.palette.common.white : props.theme.palette.text.secondary)};
  }
`;

const LoadingWrapper = styled.div`
  padding: 25px;
`;

const TotalItemsStyled = styled.div`
  display: flex;
  align-items: center;
  > span {
    margin-right: 15px;
  }
`;

const SelectAllButtonStyled = styled(Button)`
  color: ${(props) => props.theme.palette.primary.main};
  margin: 0 10px;
  user-select: none;
`;

let visibleIndex = 0;
const allowNFTsFilteredObject: any = {};
let allowNFTsFilteredNftIds: string[] = [];

export default function NFTGallery() {
  const filterContext = useContext(NFTFilterContext);

  if (!filterContext) {
    throw new Error('NFTGallery must be used within a NFTFilterProvider');
  }

  const walletId = filterContext.getWalletId();
  const { setWalletId } = filterContext;
  const typeFilter = filterContext.getTypeFilter();
  const { setTypeFilter } = filterContext;
  const visibilityFilters = filterContext.getVisibilityFilters();
  const { setVisibilityFilters } = filterContext;
  const search = filterContext.getSearchFilter();
  const { setSearchFilter: setSearch } = filterContext;
  const [inMultipleSelectionMode, toggleMultipleSelection] = useState(false);
  const [isNFTHidden] = useHiddenNFTs();
  const { filteredNFTs, isLoading } = useFilteredNFTs({ walletId });
  const [nfts, setNfts] = useState<NFTInfo[]>([]);
  const [hideObjectionableContent] = useHideObjectionableContent();
  const { isSyncingCache } = useSyncCache();
  const {
    allowNFTsFiltered,
    isDoneLoadingAllowedNFTs,
    isLoading: isLoadingAllowedNFTs,
  } = useAllowFilteredShow(filteredNFTs, hideObjectionableContent, isLoading || isSyncingCache);

  const [filtersShown, setFiltersShown] = useState<string[]>([]);
  const typesFilterRef = React.useRef<HTMLInputElement>(null);
  const visibilityFilterRef = React.useRef<HTMLInputElement>(null);
  const { isDarkMode } = useDarkMode();
  const [nftTypes, setNftTypes] = useState<any>([]);
  const [getScrollPosition, setScrollPosition] = useNFTGalleryScrollPosition();
  const allTypes = Array.from(new Set([...Object.keys(nftTypes), ...typeFilter]));
  const navigate = useNavigate();

  const [, setVisibleNFTs] = usePersistState<string[]>([], `visibleNFTs`);

  useEffect(() => {
    if (allowNFTsFiltered.length) {
      allowNFTsFiltered.forEach((nft) => {
        allowNFTsFilteredObject[nft.$nftId] = nft;
      });
      allowNFTsFilteredNftIds = allowNFTsFiltered.map((nft) => nft.$nftId);
      setNfts(
        allowNFTsFiltered.length > maxNFTsPerPage
          ? allowNFTsFiltered.filter((_: any, idx: number) => idx < maxNFTsPerPage)
          : allowNFTsFiltered
      );
    }
  }, [allowNFTsFiltered, allowNFTsFiltered.length]);

  const applyTypeFilter = React.useCallback(
    (nft: NFTInfo) => {
      if (typeFilter.indexOf(getNFTFileType(nft)) > -1) {
        return false;
      }
      return true;
    },
    [typeFilter]
  );

  const showCard = useCallback(
    (nft: NFTInfo) => {
      if (allowNFTsFilteredNftIds.indexOf(nft?.$nftId) === -1) {
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
      const metadataObj = allowNFTsFilteredObject[nft.$nftId] || {};
      const content = searchableNFTContent({ ...nft, metadata: metadataObj.metadata });
      return content.includes(search.toLowerCase());
    },
    [isNFTHidden, search, visibilityFilters, applyTypeFilter]
  );

  const nftsFiltered = useCallback((): NFTInfo[] => {
    if (allowNFTsFiltered.length) {
      return allowNFTsFiltered.filter((nft: NFTInfo) => showCard(nft)).length > maxNFTsPerPage
        ? allowNFTsFiltered
            .filter((nft: NFTInfo) => showCard(nft))
            .filter((_: any, idx: number) => idx < maxNFTsPerPage)
        : allowNFTsFiltered.filter((nft: NFTInfo) => showCard(nft));
    }
    return [];
  }, [allowNFTsFiltered, showCard]);

  useEffect(() => {
    setNfts(nftsFiltered);
    visibleIndex = 0;
  }, [search, nftsFiltered]);

  useEffect(() => {
    const listener = (event: any) => {
      if (
        !typesFilterRef.current ||
        typesFilterRef.current.contains(event.target) ||
        !visibilityFilterRef.current ||
        visibilityFilterRef.current.contains(event.target)
      ) {
        return;
      }
      if (event?.target) {
        setFiltersShown([]);
      }
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, []);

  const restoreScrollPosition = useCallback(() => {
    const scrollHelper = document.getElementById('scroll-helper');
    const scrollPosition = getScrollPosition();
    if (scrollHelper && scrollPosition > 0) {
      if (scrollHelper?.parentNode) {
        (scrollHelper?.parentNode as HTMLElement).scrollTo(0, scrollPosition);
      }
    }
  }, [getScrollPosition]);

  useEffect(() => {
    if (isDoneLoadingAllowedNFTs) {
      restoreScrollPosition();
    }
  }, [restoreScrollPosition, isDoneLoadingAllowedNFTs]);

  const filteredShownNFTs = useCallback(
    () =>
      allowNFTsFiltered.filter((nft: NFTInfo) => {
        if (applyTypeFilter(nft) === false) {
          return false;
        }
        if (visibilityFilters.indexOf('hidden') === -1 && isNFTHidden(nft)) {
          return false;
        }
        if (visibilityFilters.indexOf('visible') === -1 && !isNFTHidden(nft)) {
          return false;
        }
        const metadataObj = allowNFTsFilteredObject[nft.$nftId] || {};
        const content = searchableNFTContent({ ...nft, metadata: metadataObj.metadata });
        return content.includes(search.toLowerCase());
      }),
    [allowNFTsFiltered, applyTypeFilter, isNFTHidden, visibilityFilters, search]
  );

  useEffect(() => {
    if (isDoneLoadingAllowedNFTs) {
      setVisibleNFTs(filteredShownNFTs().map((nft: NFTInfo) => nft.$nftId));
    }
  }, [isDoneLoadingAllowedNFTs, filteredShownNFTs, setVisibleNFTs]);

  useEffect(() => {
    const nftTypesObject: any = {};
    if (allowNFTsFilteredNftIds.length && nfts.length) {
      allowNFTsFiltered
        .filter((nft: NFTInfo) => {
          if (allowNFTsFilteredNftIds.indexOf(nft.$nftId) === -1) {
            return false;
          }
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
            let isDocumentTemp: boolean = false;
            try {
              const extension = new URL(file).pathname.split('.').slice(-1)[0];
              if (extension.match(/^[a-zA-Z0-9]+$/) && isDocument(extension)) {
                nftTypesObject.Document = (nftTypesObject.Document || 0) + 1;
                isDocumentTemp = true;
              }
            } catch (e) {
              console.error(`Failed to check file extension for ${file}: ${e}`);
            }
            if (!isDocumentTemp) {
              if (mimeTypeRegex(file, /^audio/)) {
                nftTypesObject.Audio = (nftTypesObject.Audio || 0) + 1;
              } else if (mimeTypeRegex(file, /^video/)) {
                nftTypesObject.Video = (nftTypesObject.Video || 0) + 1;
              } else if (mimeTypeRegex(file, /^model/)) {
                nftTypesObject.Model = (nftTypesObject.Model || 0) + 1;
              } else if (isImage(file)) {
                nftTypesObject.Image = (nftTypesObject.Image || 0) + 1;
              } else {
                nftTypesObject.Unknown = (nftTypesObject.Unknown || 0) + 1;
              }
            }
          }
        });
    }
    setNftTypes(nftTypesObject);
  }, [allowNFTsFiltered, visibilityFilters, isNFTHidden, nfts]);

  const nftContainerRef = React.useRef(null);
  const galleryHeroRef = React.useRef(null);

  const [selectedNFTIds, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);

  if (isLoading || isLoadingAllowedNFTs) {
    return (
      <LoadingWrapper>
        <Loading center />
      </LoadingWrapper>
    );
  }

  function selectedItemAction(nftId: string) {
    if (inMultipleSelectionMode) {
      setSelectedNFTIds(
        selectedNFTIds.indexOf(nftId) === -1
          ? selectedNFTIds.concat(nftId)
          : selectedNFTIds.filter((x: string) => x !== nftId)
      );
    } else {
      navigate(`/dashboard/nfts/${nftId}`);
    }
  }

  function countNFTs(type: any) {
    return filteredNFTs.filter((nft: NFTInfo) => {
      if (applyTypeFilter(nft) === false) {
        return false;
      }
      if (!allowNFTsFilteredObject[nft?.$nftId]) {
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
    if (Object.keys(allTypes).length === 0) return null;
    return (
      <div>
        <FormControl>
          <RadioGroup>
            {allTypes.sort().map((key: string) => (
              <FormControlLabel
                control={<Checkbox />}
                label={t`${key} (${nftTypes[key] || 0})`}
                checked={typeFilter.indexOf(key) === -1}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTypeFilter(
                    typeFilter.indexOf(key) === -1
                      ? typeFilter.concat(key)
                      : typeFilter.filter((x: string) => key !== x)
                  );
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </div>
    );
  }

  function toggleVisibilityFilter(e: MouseEvent, type: string) {
    e.preventDefault();
    e.stopPropagation();
    setVisibilityFilters(
      visibilityFilters.indexOf(type) === -1
        ? visibilityFilters.concat(type)
        : visibilityFilters.filter((x: string) => x !== type)
    );
  }

  function checkedNftTypes(nftTypeKeys: any, typeFilterArray: string[]) {
    return Object.keys(nftTypeKeys).filter((key) => typeFilterArray.indexOf(key) > -1).length;
  }

  function renderSelectDeselectButtons() {
    if (!inMultipleSelectionMode) return null;
    const isSelectAll = selectedNFTIds.length < filteredShownNFTs().length;
    return (
      <SelectAllButtonStyled
        variant="text"
        onClick={() => {
          setSelectedNFTIds(isSelectAll ? filteredShownNFTs().map((nft: NFTInfo) => nft.$nftId) : []);
        }}
      >
        {isSelectAll ? <Trans>Select all</Trans> : <Trans>Deselect all</Trans>}
      </SelectAllButtonStyled>
    );
  }

  function toggleShowFilters(e: MouseEvent) {
    setFiltersShown(filtersShown.length < 2 ? ['types', 'visibility'] : []);
    e.stopPropagation();
  }

  function forceScrollAwayFromTopOrBottom(e: any, currentScrollTop: number, direction: number) {
    setTimeout(() => {
      e.target.scrollTo(0, currentScrollTop - direction * 380);
    }, 0);
  }

  return (
    <LayoutDashboardSub
      // sidebar={<NFTGallerySidebar onWalletChange={setWalletId} />}
      onScroll={(e: MouseEvent) => {
        setScrollPosition((e.target as HTMLElement).scrollTop);
        const nftCount = allowNFTsFiltered.filter((nft: NFTInfo) => showCard(nft)).length;
        if (nftCount > maxNFTsPerPage) {
          const offset = window.document.body.offsetWidth;
          const perRowCount =
            offset > 1535 ? 4 : offset > 899 ? 3 : offset > 599 ? 2 : 1; /* number of NFTs in one row */
          const oldVisibleIndex = visibleIndex;
          if (
            (e.target as HTMLElement).scrollHeight -
              (e.target as HTMLElement).scrollTop -
              (e.target as HTMLElement).offsetHeight -
              767 <
              0 &&
            visibleIndex + maxNFTsPerPage < nftCount
          ) {
            visibleIndex += perRowCount;
            forceScrollAwayFromTopOrBottom(e, (e.target as HTMLElement).scrollTop, 1);
          } else if ((e.target as HTMLElement).scrollTop < 360 && visibleIndex - perRowCount >= 0) {
            visibleIndex -= perRowCount;
            forceScrollAwayFromTopOrBottom(e, (e.target as HTMLElement).scrollTop, -1);
          }
          if (oldVisibleIndex !== visibleIndex) {
            setNfts(
              allowNFTsFiltered
                .filter((nft: NFTInfo) => showCard(nft))
                .filter((_: any, idx: number) => idx >= visibleIndex && idx < maxNFTsPerPage + visibleIndex)
            );
          }
        }
      }}
      header={
        <>
          <Flex gap={2} alignItems="stretch" flexWrap="wrap" justifyContent="space-between">
            <NFTProfileDropdown onChange={setWalletId} walletId={walletId} />
            <Flex alignItems="stretch" justifyContent="space-between">
              <Search onUpdate={setSearch} placeholder={t`Search...`} defaultValue={search || undefined} />
              <MultiSelectAndFilterWrapper className={inMultipleSelectionMode ? 'active' : ''} isDarkMode={isDarkMode}>
                <Tooltip title={<Trans>Multi-select</Trans>}>
                  <Box>
                    <MultiSelectIconStyled
                      onClick={() => toggleMultipleSelection(!inMultipleSelectionMode)}
                      isDarkMode={isDarkMode}
                    />
                  </Box>
                </Tooltip>
                <Tooltip title={<Trans>Filter</Trans>}>
                  <Box>
                    <FilterIconStyled onMouseDown={toggleShowFilters} active={filtersShown.length > 0} />
                  </Box>
                </Tooltip>
              </MultiSelectAndFilterWrapper>
            </Flex>
          </Flex>

          <Flex gap={2} alignItems="center" flexWrap="wrap" justifyContent="space-between" sx={{ padding: '10px 0' }}>
            <TotalItemsStyled>
              <span>{t`Showing ${filteredShownNFTs().length} of ${allowNFTsFiltered.length} items`}</span>
              {renderSelectDeselectButtons()}
            </TotalItemsStyled>
            <Filters>
              <div ref={typesFilterRef} style={{ display: allTypes.length > 0 ? 'flex' : 'none' }}>
                <FilterPill
                  setFiltersShown={setFiltersShown}
                  filtersShown={filtersShown}
                  which="types"
                  title={t`Types (${Object.keys(nftTypes).length - checkedNftTypes(nftTypes, typeFilter)}/${
                    allTypes.length
                  })`}
                  isDarkMode={isDarkMode}
                >
                  <VisibilityRadioWrapper isDarkMode={isDarkMode}>
                    <div>{renderTypeFilter()}</div>
                  </VisibilityRadioWrapper>
                </FilterPill>
              </div>
              <div
                ref={visibilityFilterRef}
                style={{ display: countNFTs('hidden') + countNFTs('visible') > 0 ? 'flex' : 'none' }}
              >
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
                            onClick={(e) => toggleVisibilityFilter(e as any, 'visible')}
                          />
                          <FormControlLabel
                            control={<Checkbox />}
                            label={`${t`Hidden`} (${countNFTs('hidden')})`}
                            checked={visibilityFilters.indexOf('hidden') > -1}
                            onClick={(e) => toggleVisibilityFilter(e as any, 'hidden')}
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
      <div id="scroll-helper" />
      {!nfts?.length && !isLoading && !isLoadingAllowedNFTs && !isSyncingCache ? (
        <NFTGalleryHero />
      ) : (
        <>
          <Fade in={inMultipleSelectionMode} timeout={600}>
            <SelectedActionsContainer style={{ opacity: inMultipleSelectionMode ? 1 : 0 }}>
              <SelectedActionsDialog
                allCount={allowNFTsFiltered.length}
                nfts={nfts.filter((nft: NFTInfo) => selectedNFTIds.indexOf(nft.$nftId) > -1)}
              />
            </SelectedActionsContainer>
          </Fade>
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
            {nfts.map((nft: NFTInfo) => {
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
                  style={{ display: showCard(nft) ? 'block' : 'none', height: '380px' }}
                  className={gridClassNames.join(' ')}
                >
                  <NFTCardLazy
                    nft={nft}
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
