// eslint-ignore-file - in progress
import type { NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import { Button, FormatLargeNumber, Flex, LayoutDashboardSub, Tooltip } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { FilterList as FilterListIcon, LibraryAddCheck as LibraryAddCheckIcon } from '@mui/icons-material';
import {
  Chip,
  ButtonGroup,
  // FormControlLabel,
  // RadioGroup,
  FormControl,
  // Checkbox,
  Grid,
  Fade,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { xor /* , sortBy */ } from 'lodash';
import React, { useState, useMemo } from 'react';
import { useToggle } from 'react-use';
import styled from 'styled-components';

// import type FileType from '../../../@types/FileType';
import NFTVisibility from '../../../@types/NFTVisibility';
import useFilteredNFTs from '../../../hooks/useFilteredNFTs';
// import useNFTGalleryScrollPosition from '../../../hooks/useNFTGalleryScrollPosition';
import LabelProgress from '../../helpers/LabelProgress';
import NFTCardLazy from '../NFTCardLazy';
import { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTProfileDropdown from '../NFTProfileDropdown';
import FilterPill from './FilterPill';
import NFTGalleryHero from './NFTGalleryHero';
import Search from './NFTGallerySearch';
import SelectedActionsDialog from './SelectedActionsDialog';

const Mute = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

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

/*
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
*/

export default function NFTGallery() {
  const [inMultipleSelectionMode, toggleMultipleSelection] = useToggle(false);

  const {
    nfts,
    isLoading,
    progress,

    walletIds,
    setWalletIds,

    search,
    setSearch,

    // types,
    // setTypes,

    visibility,
    setVisibility,

    statistics,
  } = useFilteredNFTs();

  const [showFilters, setShowFilters] = useState(false);

  function handleSetWalletId(walletId: number | undefined) {
    setWalletIds(walletId ? [walletId] : []);
  }

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

  const availableTypes = useMemo(() => {
    const result: FileType[] = [];

    Object.keys(statistics).forEach((key) => {
      if (statistics[key as FileType] > 0) {
        result.push(key as FileType);
      }
    });

    return result;
  }, [statistics]);
  */

  const [selectedNFTIds, setSelectedNFTIds] = useLocalStorage<string[]>('gallery-selected-nfts', []);

  const selectedVisibleNFTs = useMemo(
    () => nfts.filter((nft: NFTInfo) => selectedNFTIds.includes(nft.$nftId)),
    [nfts, selectedNFTIds]
  );

  const selectedAll = useMemo(() => selectedVisibleNFTs.length === nfts.length, [nfts, selectedVisibleNFTs]);

  async function handleSelectNFT(nftId: string) {
    if (inMultipleSelectionMode) {
      setSelectedNFTIds(xor(selectedNFTIds, [nftId]));
      return false;
    }

    return true;
  }
  /*
  function toggleType(type: FileType) {
    setTypes(xor(types, [type]));
  }

  /*
  function renderTypeFilter() {
    if (!availableTypes.length) {
      return null;
    }

    // sort by name
    const allTypes = sortBy(availableTypes);

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
  */

  function handleToggleSelectAll() {
    if (selectedAll) {
      setSelectedNFTIds([]);
    } else {
      const visibleNFTIds = nfts.map((nft: NFTInfo) => nft.$nftId);
      setSelectedNFTIds(visibleNFTIds);
    }
  }

  function toggleShowFilters(e: React.MouseEvent<any, MouseEvent>) {
    e.stopPropagation();
    setShowFilters(!showFilters);
  }

  function handleSetVisibility(e: React.MouseEvent<any, MouseEvent>, newVisibility: NFTVisibility) {
    e.stopPropagation();
    setVisibility(newVisibility);
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
        <Flex gap={1} flexDirection="column">
          <Flex gap={2} alignItems="stretch" flexWrap="wrap" justifyContent="space-between">
            <NFTProfileDropdown onChange={handleSetWalletId} walletId={walletIds?.[0]} />
            <Flex gap={2} alignItems="stretch" justifyContent="space-between">
              <Search onUpdate={setSearch} placeholder={t`Search...`} defaultValue={search} />
              <Flex
                alignItems="center"
                sx={{
                  backgroundColor: 'background.paper',
                  paddingX: 1,
                  borderRadius: 1,
                  borderColor: 'action.focus',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              >
                <Tooltip title={<Trans>Multi-select</Trans>}>
                  <IconButton onClick={toggleMultipleSelection} color={inMultipleSelectionMode ? 'primary' : undefined}>
                    <LibraryAddCheckIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={<Trans>Filter</Trans>}>
                  <IconButton onClick={toggleShowFilters} color={showFilters ? 'primary' : undefined}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
              </Flex>
            </Flex>
          </Flex>

          <Flex gap={2} alignItems="center" flexWrap="wrap" justifyContent="space-between">
            <Flex gap={1} alignItems="center">
              <Typography variant="body2" display="inline-flex">
                <Trans>
                  <Mute>Showing</Mute>&nbsp;{nfts.length}&nbsp;
                  <Mute>of</Mute>&nbsp;{statistics.total}&nbsp; <Mute>items</Mute>
                </Trans>
                {progress < 100 && (
                  <>
                    ,&nbsp;
                    <LabelProgress value={progress} hideValue>
                      <Trans>
                        <Mute>Loading...</Mute>&nbsp;{Math.floor(progress)}%
                      </Trans>
                    </LabelProgress>
                  </>
                )}
              </Typography>
            </Flex>

            <Box sx={{ minHeight: 32 }}>
              <Flex gap={2} alignItems="center">
                <Fade in={inMultipleSelectionMode} unmountOnExit>
                  <Box>
                    <Button color="secondary" variant="text" size="small" onClick={handleToggleSelectAll}>
                      {!selectedAll ? <Trans>Select all</Trans> : <Trans>Deselect all</Trans>}
                    </Button>
                  </Box>
                </Fade>

                {/*
                  <Fade in={showFilters} unmountOnExit>
                <Box>
                  <FilterPill
                    title={t`Types (${Object.keys(nftTypes).length - checkedNftTypes(nftTypes, typeFilter)}/${
                      allTypes.length
                    })`}
                  >
                    <VisibilityRadioWrapper isDarkMode={isDarkMode}>
                      <div>{renderTypeFilter()}</div>
                    </VisibilityRadioWrapper>
                  </FilterPill>
                </Box>
                </Fade>
                */}
                <Fade in={showFilters} unmountOnExit>
                  <Box>
                    <FilterPill
                      title={
                        visibility === NFTVisibility.ALL ? (
                          <Trans>
                            Visible and Hidden &nbsp;
                            <Chip label={<FormatLargeNumber value={statistics.total} />} size="extraSmall" />
                          </Trans>
                        ) : visibility === NFTVisibility.VISIBLE ? (
                          <Trans>
                            Visible &nbsp;
                            <Chip label={<FormatLargeNumber value={statistics.visible} />} size="extraSmall" />
                          </Trans>
                        ) : visibility === NFTVisibility.HIDDEN ? (
                          <Trans>
                            Hidden &nbsp;
                            <Chip label={<FormatLargeNumber value={statistics.hidden} />} size="extraSmall" />
                          </Trans>
                        ) : (
                          <Trans>None (0)</Trans>
                        )
                      }
                    >
                      <FormControl>
                        <ButtonGroup size="small" color="secondary">
                          <Button
                            key="all"
                            selected={visibility === NFTVisibility.ALL}
                            onClick={(e: any) => handleSetVisibility(e, NFTVisibility.ALL)}
                          >
                            <Trans>All</Trans>
                            &nbsp;
                            <Chip label={<FormatLargeNumber value={statistics.total} />} size="extraSmall" />
                          </Button>
                          <Button
                            key="visible"
                            selected={visibility === NFTVisibility.VISIBLE}
                            onClick={(e: any) => handleSetVisibility(e, NFTVisibility.VISIBLE)}
                          >
                            <Trans>Visible</Trans>
                            &nbsp;
                            <Chip label={<FormatLargeNumber value={statistics.visible} />} size="extraSmall" />
                          </Button>
                          <Button
                            key="hidden"
                            selected={visibility === NFTVisibility.HIDDEN}
                            onClick={(e: any) => handleSetVisibility(e, NFTVisibility.HIDDEN)}
                          >
                            <Trans>Hidden</Trans>
                            &nbsp;
                            <Chip label={<FormatLargeNumber value={statistics.hidden} />} size="extraSmall" />
                          </Button>
                        </ButtonGroup>
                      </FormControl>
                    </FilterPill>
                  </Box>
                </Fade>
              </Flex>
            </Box>
          </Flex>
        </Flex>
      }
    >
      <Fade in={inMultipleSelectionMode && !!selectedVisibleNFTs.length}>
        <Box position="fixed" zIndex={7} bottom={16} alignSelf="center">
          <SelectedActionsDialog allCount={nfts.length} nfts={selectedVisibleNFTs} />
        </Box>
      </Fade>
      <Box id="scroll-helper" />
      {!nfts?.length && !isLoading ? (
        <NFTGalleryHero />
      ) : (
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
            return (
              <Grid
                xs={12}
                sm={6}
                md={4}
                lg={4}
                xl={3}
                key={nft.$nftId}
                style={{ display: 'block', height: '380px' }}
                className={gridClassNames.join(' ')}
                item
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
      )}
    </LayoutDashboardSub>
  );
}
