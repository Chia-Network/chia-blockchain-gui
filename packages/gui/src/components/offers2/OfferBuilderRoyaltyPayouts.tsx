import React from 'react';
import { Trans } from '@lingui/macro';
import { RoyaltyCalculationFungibleAssetPayout } from '@chia/api';
import { CopyToClipboard, Flex } from '@chia/core';
import { Box, Divider } from '@mui/material';
import styled from 'styled-components';

const StyledTitle = styled(Box)`
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
`;

const StyledValue = styled(Box)`
  word-break: break-all;
`;

type NFTId = string;

export type OfferBuilderRoyaltyPayoutsProps = {
  totalAmount: string;
  originalAmount: string;
  royaltyPayments: Record<NFTId, RoyaltyCalculationFungibleAssetPayout>[];
};

export default function OfferBuilderRoyaltyPayouts(
  props: OfferBuilderRoyaltyPayoutsProps,
) {
  const { totalAmount, originalAmount, royaltyPayments } = props;

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={0}>
        <StyledTitle>
          <Trans>Total amount including royalties</Trans>
        </StyledTitle>
        <StyledValue>{totalAmount}</StyledValue>
      </Flex>
      <Flex flexDirection="column" gap={0}>
        <StyledTitle>
          <Trans>Amount before adding royalties</Trans>
        </StyledTitle>
        <StyledValue>{originalAmount}</StyledValue>
      </Flex>
      {royaltyPayments.length > 0 && <Divider />}
      {royaltyPayments.map(({ nftId, payment }, i) => (
        <Flex key={i} flexDirection="column" gap={1}>
          <Flex flexDirection="row" alignItems="center" gap={1}>
            <Flex flexDirection="column" gap={0}>
              <StyledTitle>
                <Trans>Asset</Trans>
              </StyledTitle>
              <StyledValue>{nftId}</StyledValue>
            </Flex>
            <CopyToClipboard value={nftId} fontSize="small" invertColor />
          </Flex>
          <Flex flexDirection="column" gap={0}>
            <StyledTitle>Royalty Amount</StyledTitle>
            <StyledValue>{payment.displayAmount}</StyledValue>
          </Flex>
          <Flex flexDirection="row" alignItems="center" gap={1}>
            <Flex flexDirection="column" gap={0}>
              <StyledTitle>Royalty Recipient</StyledTitle>
              <StyledValue>{payment.address}</StyledValue>
            </Flex>
            <CopyToClipboard
              value={payment.address}
              fontSize="small"
              invertColor
            />
          </Flex>
          {i < royaltyPayments.length - 1 && <Divider />}
        </Flex>
      ))}
    </Flex>
  );
}
