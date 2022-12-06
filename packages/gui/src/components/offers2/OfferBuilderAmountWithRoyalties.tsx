import { Flex, TooltipIcon } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

import OfferBuilderRoyaltyPayouts from './OfferBuilderRoyaltyPayouts';

export type OfferBuilderAmountWithRoyaltiesProps = {
  originalAmount: string;
  totalAmount: string;
  royaltyPayments: Record<string, any>[];
};

export default function OfferBuilderAmountWithRoyalties(props: OfferBuilderAmountWithRoyaltiesProps) {
  const { originalAmount, totalAmount, royaltyPayments } = props;

  return (
    <Flex>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        border="1px solid"
        borderRadius="4px"
        borderColor="grey.300"
        padding="0.25em 0.5em"
      >
        <Flex flexDirection="row" gap={1}>
          <Typography variant="body2" color="textSecondary">
            <Trans>Total Amount with Royalties</Trans>
          </Typography>
          <Typography variant="body2" noWrap>
            {totalAmount}
          </Typography>
        </Flex>
        <TooltipIcon>
          <OfferBuilderRoyaltyPayouts
            totalAmount={totalAmount}
            originalAmount={originalAmount}
            royaltyPayments={royaltyPayments}
          />
        </TooltipIcon>
      </Flex>
    </Flex>
  );
}
