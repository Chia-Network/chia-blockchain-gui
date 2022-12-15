import { toBech32m } from '@chia-network/api';
import { Box } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import useCurrencyCode from '../../hooks/useCurrencyCode';
import CopyToClipboard from '../CopyToClipboard';
import Flex from '../Flex';
import Tooltip from '../Tooltip';

const StyledValue = styled(Box)`
  word-break: break-all;
`;

type Props = {
  value: string;
  copyToClipboard?: boolean;
  tooltip?: boolean;
  children?: (address: string) => JSX.Element;
};

export default function Address(props: Props) {
  const { value, copyToClipboard = false, tooltip = false, children } = props;
  const currencyCode = useCurrencyCode();
  const address = currencyCode && value ? toBech32m(value, currencyCode.toLowerCase()) : '';

  if (!children) {
    if (copyToClipboard) {
      return (
        <Flex alignItems="center" gap={1}>
          <StyledValue>{address}</StyledValue>
          <CopyToClipboard value={address} fontSize="small" />
        </Flex>
      );
    }

    return address;
  }

  if (tooltip) {
    return (
      <Tooltip title={address} copyToClipboard={copyToClipboard}>
        {children(address)}
      </Tooltip>
    );
  }

  if (copyToClipboard) {
    return (
      <Flex alignItems="center" gap={1}>
        {children(address)} asdf
        <CopyToClipboard value={address} fontSize="small" />
      </Flex>
    );
  }

  return children(address);
}
