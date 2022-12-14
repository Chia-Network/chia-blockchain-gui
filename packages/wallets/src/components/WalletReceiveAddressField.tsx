import { useGetCurrentAddressQuery, useGetNextAddressMutation } from '@chia-network/api-react';
import { CopyToClipboard, Loading } from '@chia-network/core';
import { Reload } from '@chia-network/icons';
import { t } from '@lingui/macro';
import { TextField, IconButton } from '@mui/material';
import React, { useState } from 'react';
import styled from 'styled-components';

const ReloadIconSvg = styled(Reload)`
  path {
    fill: none;
    stroke: ${(props) => (props.isDarkMode ? props.theme.palette.common.white : props.theme.palette.text.secondary)};
  }
`;

const WalletReceiveAddressWrapper = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  padding: 9px;
  background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
  border-radius: 5px;
  border: 1px solid ${(props) => (props.isDarkMode ? '#333' : '#e2e2e2')};
  > div {
    background: ${(props) => (props.isDarkMode ? '#444' : '#f4f4f4')};
    border-radius: 5px;
  }
  input {
    padding: 3px 8px;
    border: 0;
    outline: none;
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
    <WalletReceiveAddressWrapper isDarkMode={props?.isDarkMode}>
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
      {isLoading ? (
        <Loading size="1em" />
      ) : (
        <IconButton onClick={handleNewAddress} size="small">
          <ReloadIconSvg isDarkMode={props?.isDarkMode} />
        </IconButton>
      )}
    </WalletReceiveAddressWrapper>
  );
}
