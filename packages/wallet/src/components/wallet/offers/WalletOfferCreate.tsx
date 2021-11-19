import React from 'react';
import { Trans } from '@lingui/macro';
import { Back, Flex } from '@chia/core';

export function CreateWalletOfferView() {
  return (
    <Flex flexDirection="column" gap={3}>
      <Flex flexGrow={1}>
        <Back variant="h5" to="/dashboard/wallets">
          <Trans>Create an Offer</Trans>
        </Back>
      </Flex>
    </Flex>
  );
}