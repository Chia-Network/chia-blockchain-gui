import { useGetCurrentAddressQuery, useGetNextAddressMutation } from '@chia-network/api-react';
import { Color, Flex, Loading, truncateValue, useColorModeValue } from '@chia-network/core';
import { Reload } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { alpha, Button, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import { useTimeout } from 'react-use-timeout';
import styled from 'styled-components';

const ReloadIconSvg = styled(Reload)`
  path {
    fill: none;
    stroke: ${(props) => (props.isDarkMode ? props.theme.palette.common.white : props.theme.palette.sidebarIcon)};
  }
`;

const WalletReceiveAddressWrapper = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  width: 100%;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid ${(props) => (props.isDarkMode ? props.theme.palette.border.dark : props.theme.palette.border.main)};
  > .MuiButton-root {
    border: 1px solid
      ${(props) => (props.isDarkMode ? props.theme.palette.border.dark : props.theme.palette.border.main)};
    border-radius: 4px;
    background: ${(props) => (props.isDarkMode ? Color.Neutral[800] : Color.Neutral[100])};
  }
  > .MuiButton-root:hover {
    background: ${({ theme }) => useColorModeValue(theme, 'sidebarBackground')};
  }
  input {
    padding: 4px 8px;
    height: 22px;
    border: 0;
    outline: none;
  }
  button {
    padding: 3px 5px;
  }
  fieldSet {
    border: 1px solid ${alpha(Color.Neutral[900], 0.15)};
  }
`;

export type WalletReceiveAddressProps = {
  walletId?: number;
  clearCopiedDelay?: number;
};

export default function WalletReceiveAddressField(props: WalletReceiveAddressProps) {
  const { walletId = 1, clearCopiedDelay = 1000 } = props;
  const { data: address = '' } = useGetCurrentAddressQuery({
    walletId,
  });
  const [newAddress] = useGetNextAddressMutation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const timeout = useTimeout(() => {
    setCopied(false);
  }, clearCopiedDelay);
  const [prefix, suffix] = address.split('1');
  const truncatedAddress = truncateValue(suffix, {});
  const rejoinedPrefix = prefix ? `${prefix}1` : '';

  const tooltipTitle = copied ? (
    <Trans>Copied</Trans>
  ) : (
    <Flex flexDirection="column" gap={0.5}>
      <Typography variant="caption">
        <Trans>Copy wallet address</Trans>
      </Typography>
      <Typography variant="caption">{address}</Typography>
    </Flex>
  );

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

  function handleCopyToClipboard() {
    copyToClipboard(address);
    setCopied(true);
    timeout.start();
  }

  return (
    <WalletReceiveAddressWrapper isDarkMode={props?.isDarkMode}>
      <Tooltip title={tooltipTitle}>
        <Button onClick={handleCopyToClipboard} variant="text" sx={{ textTransform: 'none', flexGrow: 1 }}>
          <Typography variant="body1" color="primary">
            {rejoinedPrefix}
          </Typography>
          <Typography variant="body1" color="textPrimary">
            {truncatedAddress}
          </Typography>
        </Button>
      </Tooltip>
      {isLoading ? (
        <Loading size="1em" />
      ) : (
        <Tooltip title={<Trans>New Receive Address</Trans>}>
          <IconButton onClick={handleNewAddress} size="small">
            <ReloadIconSvg isDarkMode={props?.isDarkMode} />
          </IconButton>
        </Tooltip>
      )}
    </WalletReceiveAddressWrapper>
  );
}
