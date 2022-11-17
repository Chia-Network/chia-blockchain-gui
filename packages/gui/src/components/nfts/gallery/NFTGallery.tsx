import React, { useState } from 'react';
import {
  Flex,
  LayoutDashboardSub,
  Loading,
  DropdownActions,
  MenuItem,
  /*useTrans,*/ usePersistState,
} from '@chia/core';
import { t, Trans } from '@lingui/macro';
import { Switch, FormGroup, FormControlLabel } from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';
import useHiddenNFTs from '../../../hooks/useHiddenNFTs';
import type NFTSelection from '../../../types/NFTSelection';
import { WalletReceiveAddressField } from '@chia/wallets';
import type { NFTInfo } from '@chia/api';
import { Box, Grid } from '@mui/material';
import NFTCardLazy from '../NFTCardLazy';
import Search from './NFTGallerySearch';
import { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTProfileDropdown from '../NFTProfileDropdown';
import NFTGalleryHero from './NFTGalleryHero';
import useFilteredNFTs from './NFTfilteredNFTs';

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

export default function NFTGallery() {
  let search = '';
  let visibleNFTidxs: number[] = [];
  const [selection, setSelection] = useState<NFTSelection>({
    items: [],
  });
  const [isNFTHidden] = useHiddenNFTs();
  const [showHidden, setShowHidden] = usePersistState(false, 'showHiddenNFTs');
  const [walletId, setWalletId] = usePersistState<number | undefined>(undefined, 'nft-profile-dropdown');
  const { filteredNFTs, isLoading } = useFilteredNFTs({ walletId });

  const nftContainerRef = React.useRef(null);
  const galleryHeroRef = React.useRef(null);

  const filteredData = filteredNFTs.filter((nft: NFTInfo) => {
    if (!showHidden && isNFTHidden(nft)) {
      return false;
    }
    return true;
  });

  function handleSelect(nft: NFTInfo, selected: boolean) {
    setSelection((currentSelection) => {
      const { items } = currentSelection;

      return {
        items: selected ? [...items, nft] : items.filter((item) => item.$nftId !== nft.$nftId),
      };
    });
  }

  function handleToggleShowHidden() {
    setShowHidden(!showHidden);
  }

  if (isLoading) {
    return <Loading center />;
  }

  function setSearch(value) {
    galleryHeroRef.current.style.display = 'none';
    search = value;
    if (nftContainerRef.current) {
      visibleNFTidxs = [];
      filteredData.forEach((nft, idx) => {
        const content = searchableNFTContent(nft);
        if (content.includes(search.toLowerCase())) {
          visibleNFTidxs.push(idx);
        }
      });
      [...nftContainerRef.current.children].forEach((node, idx) => {
        node.style.display = visibleNFTidxs.indexOf(idx) > -1 || value === '' ? 'block' : 'none';
      });
      if (visibleNFTidxs.length === 0) {
        galleryHeroRef.current.style.display = 'block';
      }
    }
  }

  return (
    <LayoutDashboardSub
      // sidebar={<NFTGallerySidebar onWalletChange={setWalletId} />}
      header={
        <Flex gap={2} alignItems="center" flexWrap="wrap" justifyContent="space-between">
          <Search onChange={setSearch} placeholder={t`Search...`} />
          <NFTProfileDropdown onChange={setWalletId} walletId={walletId} />
          <Flex justifyContent="flex-end" alignItems="center">
            <Box width={{ xs: 300, sm: 330, md: 600, lg: 780 }}>
              <Flex gap={1}>
                <WalletReceiveAddressField variant="outlined" size="small" fullWidth />
                <DropdownActions
                  label={<Trans>Filters</Trans>}
                  startIcon={<FilterListIcon />}
                  endIcon={undefined}
                  variant="text"
                  color="secondary"
                  size="large"
                >
                  <MenuItem onClick={handleToggleShowHidden}>
                    <FormGroup>
                      <FormControlLabel control={<Switch checked={showHidden} />} label={<Trans>Show Hidden</Trans>} />
                    </FormGroup>
                  </MenuItem>
                </DropdownActions>
              </Flex>
            </Box>
          </Flex>
        </Flex>
      }
    >
      {!filteredData?.length ? (
        <NFTGalleryHero />
      ) : (
        <>
          <div ref={galleryHeroRef} style={{ display: 'none' }}>
            <NFTGalleryHero />
          </div>
          <Grid spacing={2} alignItems="stretch" container ref={nftContainerRef}>
            {filteredData?.map((nft: NFTInfo) => (
              <Grid xs={12} sm={6} md={4} lg={4} xl={3} key={nft.$nftId} item>
                <NFTCardLazy
                  nft={nft}
                  onSelect={(selected) => handleSelect(nft, selected)}
                  selected={selection.items.some((item) => item.$nftId === nft.$nftId)}
                  canExpandDetails={true}
                  availableActions={NFTContextualActionTypes.All}
                  isOffer={false}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </LayoutDashboardSub>
  );
}
