// eslint-ignore-file - in progress
import type { NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import { Flex, LayoutDashboardSub, Loading, /* useTrans, */ useDarkMode, Tooltip } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { FormControlLabel, RadioGroup, FormControl, Checkbox, Grid, Button, Fade, Box } from '@mui/material';
import { xor, sort } from 'lodash';
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

import type FileType from '../../../@types/FileType';
import FilterIcon from '../../../assets/img/filter.svg';
import MultiSelectIcon from '../../../assets/img/multi-select.svg';
import useFilteredNFTs from '../../../hooks/useFilteredNFTs';
import useHiddenNFTs from '../../../hooks/useHiddenNFTs';
// import useNFTGalleryScrollPosition from '../../../hooks/useNFTGalleryScrollPosition';
import NFTCardLazy from '../NFTCardLazy';
import { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTProfileDropdown from '../NFTProfileDropdown';
import FilterPill from './FilterPill';
import NFTGalleryHero from './NFTGalleryHero';
import Search from './NFTGallerySearch';
import SelectedActionsDialog from './SelectedActionsDialog';

export const defaultCacheSizeLimit = 1024; /* MB */

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

export default function NFTGallery() {
  const [inMultipleSelectionMode, toggleMultipleSelection] = useState(false);
  const [isNFTHidden] = useHiddenNFTs();

  const {
    nfts,
    total,
    isLoading,

    walletId,
    setWalletId,

    search,
    setSearch,

    types,
    setTypes,

    statistics,
  } = useFilteredNFTs();

  const [showFilters, setShowFilters] = useState(false);
  const typesFilterRef = React.useRef<HTMLInputElement>(null);
  const { isDarkMode } = useDarkMode();

  /*
  const [getScrollPosition, setScrollPosition] = useNFTGalleryScrollPosition();
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

*/

  const availableTypes = useMemo(() => {
    const result: FileType[] = [];

    Object.keys(statistics).forEach((key) => {
      if (statistics[key as FileType] > 0) {
        result.push(key as FileType);
      }
    });

    return result;
  }, [statistics]);

  const [selectedNFTIds, setSelectedNFTIds] = useLocalStorage<string[]>('gallery-selected-nfts', []);
  const selectedAll = useMemo(
    () => selectedNFTIds.every((id: string) => nfts.some((nft: NFTInfo) => nft.$nftId === id)),
    [nfts, selectedNFTIds]
  );

  if (isLoading) {
    return (
      <Box padding={3}>
        <Loading center />
      </Box>
    );
  }

  async function handleSelectNFT(nftId: string) {
    if (inMultipleSelectionMode) {
      setSelectedNFTIds(xor(selectedNFTIds, [nftId]));
      return false;
    }

    return true;
  }

  function toggleType(type: FileType) {
    setTypes(xor(types, [type]));
  }

  // console.log('availableTypes', availableTypes);

  function renderTypeFilter() {
    if (!availableTypes.length) {
      return null;
    }

    // sort by name
    const allTypes = sort(availableTypes);

    return (
      <FormControl>
        <RadioGroup>
          {allTypes.map((key: FileType) => (
            <FormControlLabel
              control={<Checkbox />}
              label={t`${key} (${statistics[key]})`}
              checked={typeFilter.indexOf(key) === -1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleType(key);
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>
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

  function selectAll() {
    const visibleNFTIds = nfts.map((nft: NFTInfo) => nft.$nftId);
    setSelectedNFTIds(visibleNFTIds);
  }

  function renderSelectDeselectButtons() {
    if (!inMultipleSelectionMode) return null;

    return (
      <SelectAllButtonStyled
        variant="text"
        onClick={() => {
          setSelectedNFTIds(selectedAll ? [] : selectAll());
        }}
      >
        {!selectedAll ? <Trans>Select all</Trans> : <Trans>Deselect all</Trans>}
      </SelectAllButtonStyled>
    );
  }

  function toggleShowFilters(e: MouseEvent) {
    e.stopPropagation();

    setShowFilters(!showFilters);
  }

  /*
  function forceScrollAwayFromTopOrBottom(e: any, currentScrollTop: number, direction: number) {
    setTimeout(() => {
      e.target.scrollTo(0, currentScrollTop - direction * 380);
    }, 0);
  }

  function handleOnScroll(e: MouseEvent) {
    setScrollPosition((e.target as HTMLElement).scrollTop);
    const nftCount = allowNFTsFiltered.filter((nft: NFTInfo) => showCard(nft)).length;
    if (nftCount > maxNFTsPerPage) {
      const offset = window.document.body.offsetWidth;
      const perRowCount =
        offset > 1535 ? 4 : offset > 899 ? 3 : offset > 599 ? 2 : 1;
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
  }
  */

  return (
    <LayoutDashboardSub
      // sidebar={<NFTGallerySidebar onWalletChange={setWalletId} />}
      // onScroll={handleOnScroll}
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
                    <FilterIconStyled onMouseDown={toggleShowFilters} active={showFilters} />
                  </Box>
                </Tooltip>
              </MultiSelectAndFilterWrapper>
            </Flex>
          </Flex>

          <Flex gap={2} alignItems="center" flexWrap="wrap" justifyContent="space-between" sx={{ padding: '10px 0' }}>
            <TotalItemsStyled>
              <span>{t`Showing ${nfts.length} of ${total} items`}</span>
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
              <div style={{ display: countNFTs('hidden') + countNFTs('visible') > 0 ? 'flex' : 'none' }}>
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
      <Box id="scroll-helper" />
      {!nfts?.length && !isLoading ? (
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
          <StyledGrid
            spacing={2}
            alignItems="stretch"
            container
            className={`${inMultipleSelectionMode ? 'active show-multiple-select' : ''}`}
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
                  style={{ display: 'block', height: '380px' }}
                  className={gridClassNames.join(' ')}
                >
                  <NFTCardLazy
                    nft={nft}
                    canExpandDetails
                    availableActions={NFTContextualActionTypes.All}
                    isOffer={false}
                    search={search}
                    onSelect={handleSelectNFT}
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
