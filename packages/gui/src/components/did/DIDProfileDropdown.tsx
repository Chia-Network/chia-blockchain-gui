import type { Wallet } from '@chia-network/api';
import { useGetDIDsQuery } from '@chia-network/api-react';
import { DropdownActions, DropdownActionsProps, MenuItem, truncateValue } from '@chia-network/core';
import type { TruncateValueOptions } from '@chia-network/core/src/components/Truncate/Truncate';
import { Trans, t } from '@lingui/macro';
import { PermIdentity as PermIdentityIcon } from '@mui/icons-material';
import { ListItemIcon } from '@mui/material';
import React, { useMemo } from 'react';

import { didFromDIDId } from '../../util/dids';

type DIDProfileDropdownProps = DropdownActionsProps & {
  walletId?: number;
  onChange?: (walletId?: number) => void;
  defaultTitle?: string | React.ReactElement;
  currentDID?: string;
  includeNoneOption?: boolean;
  truncate?: TruncateValueOptions | boolean;
};

export default function DIDProfileDropdown(props: DIDProfileDropdownProps) {
  const {
    walletId,
    onChange,
    defaultTitle = t`All Profiles`,
    currentDID = '',
    includeNoneOption = false,
    truncate,
    ...rest
  } = props;
  const { data: allDIDWallets, isLoading } = useGetDIDsQuery();

  const didWallets = useMemo(() => {
    if (!allDIDWallets) {
      return [];
    }

    const excludeDIDs: string[] = [];
    if (currentDID) {
      const did = didFromDIDId(currentDID);
      if (did) {
        excludeDIDs.push(did);
      }
    }

    return allDIDWallets.filter((wallet: Wallet) => !excludeDIDs.includes(wallet.myDid));
  }, [allDIDWallets, currentDID]);

  const label = useMemo(() => {
    if (isLoading) {
      return t`Loading...`;
    }

    const wallet = didWallets?.find((walletItem: Wallet) => walletItem.id === walletId);

    const retVal = wallet?.name || defaultTitle;
    if (!truncate) {
      return retVal;
    }

    const truncateOptions = truncate === true ? {} : truncate;

    return truncateValue(retVal, truncateOptions);
  }, [defaultTitle, didWallets, isLoading, walletId, truncate]);

  function handleWalletChange(newWalletId?: number) {
    onChange?.(newWalletId);
  }

  return (
    <DropdownActions
      onSelect={handleWalletChange}
      label={label}
      variant="text"
      color="secondary"
      size="large"
      {...rest}
    >
      {(didWallets ?? []).map((wallet: Wallet, index: number) => (
        <MenuItem
          key={wallet.id}
          onClick={() => handleWalletChange(wallet.id)}
          selected={wallet.id === walletId}
          divider={index === (didWallets?.length ?? 0) - 1 && includeNoneOption}
          close
        >
          <ListItemIcon>
            <PermIdentityIcon />
          </ListItemIcon>
          {wallet.name}
        </MenuItem>
      ))}
      {includeNoneOption && (
        <MenuItem key="<none>" onClick={() => handleWalletChange()} selected={!walletId && !currentDID} close>
          <ListItemIcon>
            <PermIdentityIcon />
          </ListItemIcon>
          <Trans>None</Trans>
        </MenuItem>
      )}
    </DropdownActions>
  );
}
