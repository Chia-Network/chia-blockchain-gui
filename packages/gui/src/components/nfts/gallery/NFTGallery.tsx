// eslint-ignore-file - in progress
import type { NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import { Button, FormatLargeNumber, Flex, LayoutDashboardSub, Tooltip, usePersistState } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { FilterList as FilterListIcon, LibraryAddCheck as LibraryAddCheckIcon } from '@mui/icons-material';
import {
  Chip,
  ButtonGroup,
  FormControlLabel,
  FormControl,
  Checkbox,
  Fade,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/styles';
import { xor /* , sortBy */ } from 'lodash';
import React, { useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

import FileType from '../../../@types/FileType';
import NFTVisibility from '../../../@types/NFTVisibility';
import useFilteredNFTs from '../../../hooks/useFilteredNFTs';
import useHideObjectionableContent from '../../../hooks/useHideObjectionableContent';
// import useNFTGalleryScrollPosition from '../../../hooks/useNFTGalleryScrollPosition';
import LabelProgress from '../../helpers/LabelProgress';
import NFTCard from '../NFTCard';
import { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTProfileDropdown from '../NFTProfileDropdown';
import FilterPill from './FilterPill';
import NFTGalleryHero from './NFTGalleryHero';
import Search from './NFTGallerySearch';
import SelectedActionsDialog from './SelectedActionsDialog';

function ItemContainer(props: { children: React.ReactNode }) {
  const { children, ...rest } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 2,
        alignContent: 'stretch',
        width: {
          xs: '100%',
          sm: '50%',
          lg: '33.333333%',
          xl: '25%',
        },
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}

const ListContainer = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  paddingLeft: 16,
  paddingRight: 16,
});

const Mute = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const defaultCacheSizeLimit = 1024; /* MB */

export default function NFTGallery() {
  const {
    nfts,
    isLoading,
    progress,

    walletIds,
    setWalletIds,

    search,
    setSearch,

    types,
    setTypes,

    visibility,
    setVisibility,

    statistics,
  } = useFilteredNFTs();

  const [hideSensitiveContent, setHideSensitiveContent] = useHideObjectionableContent();
  const [showFilters, setShowFilters] = usePersistState(false, 'nft-gallery-show-filters');
  const [inMultipleSelectionMode, setInMultipleSelectionMode] = usePersistState(
    false,
    'nft-gallery-multiple-selection'
  );

  function toggleMultipleSelection() {
    setInMultipleSelectionMode(!inMultipleSelectionMode);
  }

  function toggleSensitiveContent() {
    setHideSensitiveContent(!hideSensitiveContent);
  }

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

  function toggleType(type: FileType) {
    setTypes(xor(types, [type]));
  }

  const availableTypes = useMemo(() => {
    const result: FileType[] = [];

    Object.keys(statistics).forEach((type) => {
      if (type.toUpperCase() in FileType && statistics[type as FileType] > 0) {
        result.push(type as FileType);
      }
    });

    return result;
  }, [statistics]);

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

  function renderNFTCard(index: number) {
    const nft = nfts[index];
    return (
      <NFTCard
        nft={nft}
        canExpandDetails
        availableActions={NFTContextualActionTypes.All}
        isOffer={false}
        search={search}
        selected={selectedNFTIds.includes(nft.$nftId)}
        onSelect={inMultipleSelectionMode ? handleSelectNFT : undefined}
      />
    );
  }

  return (
    <LayoutDashboardSub
      gap={2}
      fullHeight
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
                <Tooltip title={<Trans>Multi-select</Trans>} placement="top">
                  <IconButton onClick={toggleMultipleSelection} color={inMultipleSelectionMode ? 'primary' : undefined}>
                    <LibraryAddCheckIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={<Trans>Filter</Trans>} placement="top">
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

                <Fade in={showFilters} unmountOnExit>
                  <Box>
                    <FilterPill
                      title={
                        <Trans>
                          Types &nbsp;
                          <Chip label={<FormatLargeNumber value={availableTypes.length + 1} />} size="extraSmall" />
                        </Trans>
                      }
                    >
                      <Flex flexDirection="column">
                        {availableTypes.map((type: FileType) => (
                          <FormControlLabel
                            key={type}
                            control={<Checkbox checked={types.includes(type)} onChange={() => toggleType(type)} />}
                            label={
                              <Flex width="100%" gap={1} justifyContent="space-between" alignItems="center">
                                <Box textTransform="capitalize">{type}</Box>
                                <Chip label={<FormatLargeNumber value={statistics[type]} />} size="extraSmall" />
                              </Flex>
                            }
                          />
                        ))}
                        <FormControlLabel
                          control={<Checkbox checked={!hideSensitiveContent} onChange={toggleSensitiveContent} />}
                          label={
                            <Flex width="100%" gap={1} justifyContent="space-between" alignItems="center">
                              <Box>
                                <Trans>Objectionable Content</Trans>
                              </Box>
                              <Chip label={<FormatLargeNumber value={statistics.sensitive} />} size="extraSmall" />
                            </Flex>
                          }
                        />
                      </Flex>
                    </FilterPill>
                  </Box>
                </Fade>
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
        <Box sx={{ height: '100%', marginLeft: -3, marginRight: -3 }}>
          <VirtuosoGrid
            style={{ height: '100%' }}
            data={nfts}
            overscan={200}
            computeItemKey={(_index, nft) => nft.$nftId}
            components={{
              Item: ItemContainer,
              List: ListContainer,
            }}
            itemContent={renderNFTCard}
          />
        </Box>
      )}
    </LayoutDashboardSub>
  );
}
