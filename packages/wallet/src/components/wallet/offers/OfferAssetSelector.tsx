import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Wallet, WalletType } from '@chia/api';
import { useGetCatListQuery, useGetWalletsQuery } from '@chia/api-react';
import { Trans } from '@lingui/macro';
import { FormControl, InputLabel, MenuItem } from '@material-ui/core';
import { Select } from '@chia/core';
import type OfferRowData from './OfferRowData';
import type CATToken from '../../../types/CATToken';

type WalletOfferAssetSelection = {
  walletId: number;
  name: string;
  symbol?: string;
  displayName: string;
  tail?: string;
};

function buildAssetSelectorList(
  wallets: Wallet[],
  catList: CATToken[],
  rows: OfferRowData[],
  selectedWalletId: number): WalletOfferAssetSelection[]
{
  const list: WalletOfferAssetSelection[] = [];
  const usedWalletIds: Set<number> = new Set();

  rows.map(row => {
    if (row.assetWalletId !== undefined && row.assetWalletId !== selectedWalletId) {
      usedWalletIds.add(row.assetWalletId);
    }
  });

  wallets.map(wallet => {
    const walletId: number = wallet.id;
    let name: string | undefined;
    let symbol: string | undefined;
    let tail: string | undefined;

    if (usedWalletIds.has(walletId)) {
      return;
    }

    if (wallet.type === WalletType.STANDARD_WALLET) {
      name = 'Chia';
      symbol = 'XCH';
    }
    else if (wallet.type === WalletType.CAT) {
      name = wallet.name;
      tail = wallet.meta.tail;
      const cat = catList.find(cat => cat.assetId === tail);

      if (cat) {
        symbol = cat.symbol;
      }
    }

    if (name) {
      const displayName = name + (symbol ? `(${symbol})` : '');
      list.push({ walletId, name, symbol, displayName, tail });
    }
  });
  return list;
}

type OfferAssetSelectorProps = {
  name: string;
  id: string;
  tradeSide: 'buy' | 'sell';
  defaultValue: any;
};

function OfferAssetSelector(props: OfferAssetSelectorProps): JSX.Element {
  const { name, id, tradeSide, defaultValue, ...rest } = props;
  const { data: wallets, isLoading } = useGetWalletsQuery();
  const { data: catList = [], isLoading: isCatListLoading } = useGetCatListQuery();
  const { getValues, watch } = useFormContext();
  const rows = watch(tradeSide === 'buy' ? 'takerRows' : 'makerRows');
  const selectedWalletId = getValues(id);
  const options: WalletOfferAssetSelection[] = useMemo(() => {
    if (isLoading || isCatListLoading) {
      return [];
    }
    return buildAssetSelectorList(wallets, catList, rows, selectedWalletId);
  }, [wallets, catList, rows]);

  async function handleSelection(selectedWalletId: number) {
    console.log("handleSelection: " + selectedWalletId);
  }

  return (
    // Form control with popup selection of assets
    <FormControl variant="filled" fullWidth>
      <InputLabel required focused>
        <Trans>Asset Type</Trans>
      </InputLabel>
      <Select name={name} id={id} defaultValue={defaultValue || ''}>
        {options.map((option) => (
          <MenuItem
            value={option.walletId}
            key={option.walletId}
            onClick={() => handleSelection(option.walletId)}
          >
            <Trans>{option.displayName}</Trans>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default OfferAssetSelector;
