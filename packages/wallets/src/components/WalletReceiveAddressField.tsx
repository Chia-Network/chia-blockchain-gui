import { useGetCurrentAddressQuery, useGetNextAddressMutation } from '@chia/api-react';
import { CopyToClipboard } from '@chia/core';
import { t } from '@lingui/macro';
import { TextField, IconButton } from '@mui/material';
import React, { useState } from 'react';
import styled from 'styled-components';

function ReloadIconSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18.453 10.893C18.1752 13.5029 16.6964 15.9487 14.2494 17.3614C10.1839 19.7086 4.98539 18.3157 2.63818 14.2502L2.38818 13.8172M1.54613 9.10701C1.82393 6.49711 3.30272 4.05138 5.74971 2.63862C9.8152 0.291406 15.0137 1.68434 17.3609 5.74983L17.6109 6.18285M1.49316 16.0661L2.22521 13.334L4.95727 14.0661M15.0424 5.93401L17.7744 6.66606L18.5065 3.93401"
        stroke="#757575"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WalletReceiveAddressWrapper = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  padding: 9px;
  background: #fff;
  border-radius: 5px;
  border: 1px solid #e2e2e2;
  > div {
    background: #f4f4f4;
  }
  input {
    padding: 3px 8px;
    border: 0;
  }
  height: 48px;
  button {
    padding: 3px 5px;
  }
  fieldSet {
    border: 1px solid rgba(0, 0, 0, 0.15);
  }
`;

export type WalletReceiveAddressProps = {
  walletId?: number;
};

export default function WalletReceiveAddressField(props: WalletReceiveAddressProps) {
  const { walletId = 1, ...rest } = props;
  const { data: address = '' } = useGetCurrentAddressQuery({
    walletId,
  });
  const [newAddress] = useGetNextAddressMutation();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleNewAddress() {
    try {
      setIsLoading(true);
      await newAddress({
        walletId,
        newAddress: true,
      }).unwrap();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <WalletReceiveAddressWrapper>
      <TextField
        value={address}
        placeholder={t`Loading...`}
        variant="filled"
        {...rest}
        sx={{
          width: 'initial',
          flex: 1,
          width: '100%',
        }}
      />
      <CopyToClipboard value={address} />
      <IconButton onClick={handleNewAddress} size="small">
        <ReloadIconSvg />
      </IconButton>
    </WalletReceiveAddressWrapper>
  );
}
