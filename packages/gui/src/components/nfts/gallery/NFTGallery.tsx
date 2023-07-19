// eslint-ignore-file - in progress
import type { NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import {
  Button,
  FormatLargeNumber,
  Flex,
  LayoutDashboardSub,
  Tooltip,
  usePersistState,
  Mute,
} from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { FilterList as FilterListIcon, LibraryAddCheck as LibraryAddCheckIcon } from '@mui/icons-material';
import {
  Divider,
  Chip,
  FormControlLabel,
  FormControl,
  Checkbox,
  Fade,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/styles';
import { xor, intersection /* , sortBy */ } from 'lodash';
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

import NFTVisibility from '../../../@types/NFTVisibility';
import FileType from '../../../constants/FileType';
import useFilteredNFTs from '../../../hooks/useFilteredNFTs';
import useHideObjectionableContent from '../../../hooks/useHideObjectionableContent';
import useNFTGalleryScrollPosition from '../../../hooks/useNFTGalleryScrollPosition';
import getNFTId from '../../../util/getNFTId';
import LabelProgress from '../../helpers/LabelProgress';
import NFTCard from '../NFTCard';
import { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTProfileDropdown from '../NFTProfileDropdown';
import FilterPill from './FilterPill';
import NFTGalleryHero from './NFTGalleryHero';
import Search from './NFTGallerySearch';
import SelectedActionsDialog from './SelectedActionsDialog';

function ItemContainer(props: { children?: React.ReactNode }) {
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

const COMPONENTS = {
  Item: ItemContainer,
  List: ListContainer,
};

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

  const [scrollPosition, setScrollPosition] = useNFTGalleryScrollPosition();
  const scrollerRef = useRef<HTMLElement>(null);
  const nftsRef = useRef(nfts);
  nftsRef.current = nfts;

  function handleScrolling() {
    if (scrollerRef.current) {
      const { scrollTop } = scrollerRef.current;
      setScrollPosition(scrollTop);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      if (scrollerRef.current && scrollPosition) {
        scrollerRef.current?.scrollTo(0, scrollPosition);
      }
    }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run during initial render

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

  const [selectedNFTIds, setSelectedNFTIds] = useLocalStorage<string[]>('gallery-selected-nfts', []);

  const selectedVisibleNFTs = useMemo(
    () => nfts.filter((nft: NFTInfo) => selectedNFTIds.includes(nft.$nftId)),
    [nfts, selectedNFTIds]
  );

  const selectedAll = useMemo(() => selectedVisibleNFTs.length === nfts.length, [nfts, selectedVisibleNFTs]);

  const handleSelectNFT = useCallback(
    async (nftId: string) => {
      setSelectedNFTIds((prevSelectedNFTIds) => xor(prevSelectedNFTIds, [nftId]));
      return false;
    },
    [setSelectedNFTIds]
  );

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

  const selectedTypes = useMemo(() => intersection(types, availableTypes), [types, availableTypes]);

  const handleScrollRef = useCallback(
    (ref: HTMLElement | null) => {
      scrollerRef.current = ref;
    },
    [scrollerRef]
  );

  function handleToggleSelectAll() {
    if (selectedAll) {
      setSelectedNFTIds([]);
    } else {
      const visibleNFTIds = nfts.map((nft: NFTInfo) => getNFTId(nft.launcherId));
      setSelectedNFTIds(visibleNFTIds);
    }
  }

  function toggleShowFilters(e: React.MouseEvent<any, MouseEvent>) {
    e.stopPropagation();
    setShowFilters(!showFilters);
  }

  function toggleVisible() {
    switch (visibility) {
      case NFTVisibility.ALL:
        setVisibility(NFTVisibility.HIDDEN);
        return;
      case NFTVisibility.VISIBLE:
        setVisibility(NFTVisibility.NONE);
        return;
      case NFTVisibility.NONE:
        setVisibility(NFTVisibility.VISIBLE);
        return;
      case NFTVisibility.HIDDEN:
      default:
        setVisibility(NFTVisibility.ALL);
    }
  }

  function toggleHidden() {
    switch (visibility) {
      case NFTVisibility.ALL:
        setVisibility(NFTVisibility.VISIBLE);
        return;
      case NFTVisibility.VISIBLE:
        setVisibility(NFTVisibility.ALL);
        return;
      case NFTVisibility.NONE:
        setVisibility(NFTVisibility.HIDDEN);
        return;
      case NFTVisibility.HIDDEN:
      default:
        setVisibility(NFTVisibility.NONE);
    }
  }

  function renderNFTCard(index: number, nft: NFTInfo) {
    return (
      <NFTCard
        id={nft.launcherId}
        canExpandDetails
        availableActions={NFTContextualActionTypes.All}
        isOffer={false}
        search={search}
        selected={selectedNFTIds?.includes(getNFTId(nft.launcherId))}
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
                    <LibraryAddCheckIcon color="info" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={<Trans>Filter</Trans>} placement="top">
                  <IconButton onClick={toggleShowFilters} color={showFilters ? 'primary' : undefined}>
                    <FilterListIcon color="info" />
                  </IconButton>
                </Tooltip>
              </Flex>
            </Flex>
          </Flex>

          <Flex gap={2} alignItems="center" flexWrap="wrap" justifyContent="space-between">
            <Flex gap={1} alignItems="center">
              <Typography variant="body2" display="inline-flex">
                {statistics.total > 0 && (
                  <Trans>
                    <Mute>Showing</Mute>&nbsp;{nfts.length}&nbsp;
                    <Mute>of</Mute>&nbsp;{statistics.total}&nbsp; <Mute>items</Mute>
                  </Trans>
                )}

                {progress < 100 && (
                  <>
                    {statistics.total > 0 && <>,&nbsp;</>}
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
                          Types
                          {availableTypes.length > 0 ? (
                            <>
                              &nbsp;
                              <Chip
                                label={
                                  <>
                                    {selectedTypes.length} / {availableTypes.length}
                                  </>
                                }
                                size="extraSmall"
                              />
                            </>
                          ) : null}
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
                        {availableTypes.length > 0 && <Divider />}
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
                        <Flex flexDirection="column">
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={[NFTVisibility.VISIBLE, NFTVisibility.ALL].includes(visibility)}
                                onChange={toggleVisible}
                              />
                            }
                            label={
                              <Flex width="100%" gap={1} justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Trans>Visible</Trans>
                                </Box>
                                <Chip label={<FormatLargeNumber value={statistics.visible} />} size="extraSmall" />
                              </Flex>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={[NFTVisibility.HIDDEN, NFTVisibility.ALL].includes(visibility)}
                                onChange={toggleHidden}
                              />
                            }
                            label={
                              <Flex width="100%" gap={1} justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Trans>Hidden</Trans>
                                </Box>
                                <Chip label={<FormatLargeNumber value={statistics.hidden} />} size="extraSmall" />
                              </Flex>
                            }
                          />
                        </Flex>
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
            overscan={2000}
            computeItemKey={(_index, nft) => nft.launcherId}
            components={COMPONENTS}
            itemContent={renderNFTCard}
            scrollerRef={handleScrollRef}
            isScrolling={handleScrolling}
          />
        </Box>
      )}
    </LayoutDashboardSub>
  );
}
