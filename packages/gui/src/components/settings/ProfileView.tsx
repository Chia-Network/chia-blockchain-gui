import React from 'react';
import { Trans } from '@lingui/macro';
import {
  Button,
  Flex,
  Suspender,
} from '@chia/core';
import {
  Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  useGetDIDQuery,
} from '@chia/api-react';

export default function ProfileView() {
  const { walletId } = useParams();
  const { data: did, isLoading } = useGetDIDQuery({ walletId: walletId });
  let myDidText: JSX.Element | null = null;
  let coinIdText: JSX.Element | null = null;

  if (isLoading) {
    return (
      <Suspender />
    );
  }

  if (did) {
    const myDidText = did.myDid;
    const coinIdText = did.coinId;

    return (
      <div style={{width:"100%"}}>
        <Flex flexDirection="column" gap={2.5} paddingBottom={3}>
          <Typography variant="h6">
            <Trans><strong>[*Wallet Name*]</strong></Trans>
          </Typography>
        </Flex>
        <Flex flexDirection="row" paddingBottom={1}>
          <Flex flexGrow={1}>
            <Trans>My DID</Trans>
          </Flex>
          <Flex>
            <Trans>{myDidText}</Trans>
          </Flex>
        </Flex>
        <Flex flexDirection="row" paddingBottom={1}>
          <Flex flexGrow={1}>
            <Trans>Coin ID</Trans>
          </Flex>
          <Flex>
            <Trans>{coinIdText}</Trans>
          </Flex>
        </Flex>
        <Flex flexDirection="row" paddingBottom={1}>
          <Flex flexGrow={1}>
            <Trans>Token Standard</Trans>
          </Flex>
          <Flex>
            <Trans>DID1</Trans>
          </Flex>
        </Flex>
        <hr />
        <Flex justifyContent="flex-end" paddingTop={1}>
          <Button
            type="submit"
            variant="outlined"
            color="secondary"
          >
            <Trans>Transfer Identity</Trans>
          </Button>
        </Flex>
      </div>
    );
  }
}
