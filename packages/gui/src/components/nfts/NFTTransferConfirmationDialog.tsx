import React from 'react';
import { Trans, Plural } from '@lingui/macro';
import styled from 'styled-components';
import {
  useCurrencyCode,
  chiaToMojo,
  ConfirmDialog,
  Flex,
  TooltipIcon,
  FormatLargeNumber,
} from '@chia/core';
import { Box, Divider, Typography } from '@mui/material';

const StyledTitle = styled(Box)`
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
`;

const StyledValue = styled(Box)`
  word-break: break-all;
`;

export type NFTTransferConfirmationDialogProps = {
  destination: string;
  fee: string;
  open?: boolean; // For use in openDialog()
};

export default function NFTTransferConfirmationDialog(
  props: NFTTransferConfirmationDialogProps,
) {
  const { destination, fee, ...rest } = props;
  const feeInMojos = chiaToMojo(fee || 0);
  const currencyCode = useCurrencyCode();

  return (
    <ConfirmDialog
      title={<Trans>Confirm NFT Transfer</Trans>}
      confirmTitle={<Trans>Transfer</Trans>}
      confirmColor="secondary"
      cancelTitle={<Trans>Cancel</Trans>}
      {...rest}
    >
      <Flex flexDirection="column" gap={3}>
        <Typography variant="body1">
          <Trans>
            Once you initiate this transfer, you will not be able to cancel the
            transaction. Are you sure you want to transfer the NFT?
          </Trans>
        </Typography>
        <Divider />
        <Flex flexDirection="column" gap={1}>
          <Flex flexDirection="row" gap={1}>
            <Flex flexShrink={0}>
              <Typography variant="body1">
                <Trans>Destination:</Trans>
              </Typography>
            </Flex>
            <Flex
              flexDirection="row"
              alignItems="center"
              gap={1}
              sx={{ overflow: 'hidden' }}
            >
              <Typography noWrap variant="body1">
                {destination}
              </Typography>
              <TooltipIcon interactive>
                <Flex flexDirection="column" gap={1}>
                  <StyledTitle>
                    <Trans>Destination</Trans>
                  </StyledTitle>
                  <StyledValue>
                    <Typography variant="caption">{destination}</Typography>
                  </StyledValue>
                </Flex>
              </TooltipIcon>
            </Flex>
          </Flex>
          <Flex flexDirection="row" gap={1}>
            <Typography variant="body1">Fee:</Typography>
            <Typography variant="body1">
              {fee || '0'} {currencyCode}
            </Typography>
            {feeInMojos > 0 && (
              <>
                <FormatLargeNumber value={feeInMojos} />
                <Box>
                  <Plural
                    value={feeInMojos.toNumber()}
                    one="mojo"
                    other="mojos"
                  />
                </Box>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>
    </ConfirmDialog>
  );
}
