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
// import { defineMessage } from '@lingui/macro';
import { WalletReceiveAddressField } from '@chia/wallets';
import type { NFTInfo } from '@chia/api';

import { Box, Grid } from '@mui/material';
// import NFTGallerySidebar from './NFTGallerySidebar';
import NFTCardLazy from '../NFTCardLazy';
import Search from './NFTGallerySearch';
import NFTContextualActions, {
  NFTContextualActionTypes,
} from '../NFTContextualActions';
import NFTProfileDropdown from '../NFTProfileDropdown';
import NFTGalleryHero from './NFTGalleryHero';
import useHiddenNFTs from '../../../hooks/useHiddenNFTs';
import type NFTSelection from '../../../types/NFTSelection';
import useFilteredNFTs from './NFTfilteredNFTs';

export const defaultCacheSizeLimit = 1024; /* MB */

function searchableNFTContent(nft: NFTInfo) {
  const items = [nft.$nftId, nft.dataUris?.join(' ') ?? '', nft.launcherId];

  return items.join(' ').toLowerCase();
}

export default function NFTGallery() {
  const [search, setSearch] = useState<string>('');
  const [selection, setSelection] = useState<NFTSelection>({
    items: [],
  });
  const [isNFTHidden] = useHiddenNFTs();
  const [showHidden, setShowHidden] = usePersistState(false, 'showHiddenNFTs');
  const [walletId, setWalletId] = usePersistState<number | undefined>(
    undefined,
    'nft-profile-dropdown',
  );
  const { filteredNFTs, isLoading } = useFilteredNFTs({ walletId });
  const filteredData = filteredNFTs.filter((nft: NFTInfo) => {
    if (!showHidden && isNFTHidden(nft)) {
      return false;
    }
    const content = searchableNFTContent(nft);
    if (search) {
      return content.includes(search.toLowerCase());
    }
    return true;
  });

  function handleSelect(nft: NFTInfo, selected: boolean) {
    setSelection((currentSelection) => {
      const { items } = currentSelection;

      return {
        items: selected
          ? [...items, nft]
          : items.filter((item) => item.$nftId !== nft.$nftId),
      };
    });
  }

  function handleToggleShowHidden() {
    setShowHidden(!showHidden);
  }

  if (isLoading) {
    return <Loading center />;
  }

  return (
    <LayoutDashboardSub
      // sidebar={<NFTGallerySidebar onWalletChange={setWalletId} />}
      header={
        <Flex
          gap={2}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="space-between"
        >
          <NFTProfileDropdown onChange={setWalletId} walletId={walletId} />
          <Flex justifyContent="flex-end" alignItems="center">
            {null && (
              <>
                <Search
                  onChange={setSearch}
                  value={search}
                  placeholder={t`Search...`}
                />

                <NFTContextualActions selection={selection} />
              </>
            )}
            <Box width={{ xs: 300, sm: 330, md: 600, lg: 780 }}>
              <Flex gap={1}>
                <WalletReceiveAddressField
                  variant="outlined"
                  size="small"
                  fullWidth
                />
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
                      <FormControlLabel
                        control={<Switch checked={showHidden} />}
                        label={<Trans>Show Hidden</Trans>}
                      />
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
        <Grid spacing={2} alignItems="stretch" container>
          {filteredData?.map((nft: NFTInfo) => (
            <Grid xs={12} sm={6} md={4} lg={4} xl={3} key={nft.$nftId} item>
              <NFTCardLazy
                nft={nft}
                onSelect={(selected) => handleSelect(nft, selected)}
                selected={selection.items.some(
                  (item) => item.$nftId === nft.$nftId,
                )}
                canExpandDetails={true}
                availableActions={NFTContextualActionTypes.All}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </LayoutDashboardSub>
  );
}
