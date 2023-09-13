import { WalletType } from '@chia-network/api';
import { useGetDIDQuery, useGetWalletsQuery } from '@chia-network/api-react';
import { CardListItem, Flex, Truncate } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Add } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { orderBy } from 'lodash';
import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import { didToDIDId } from '../../util/dids';

function DisplayDid(wallet) {
  const { id } = wallet.wallet;
  const { data: did } = useGetDIDQuery({ walletId: id });

  if (did) {
    const myDidText = didToDIDId(did.myDid);

    return (
      <div>
        <Truncate ValueProps={{ variant: 'body2' }} tooltip copyToClipboard>
          {myDidText}
        </Truncate>
      </div>
    );
  }
  return null;
}

export default function IdentitiesPanel() {
  const navigate = useNavigate();
  const { walletId } = useParams();
  const { data: wallets, isLoading } = useGetWalletsQuery();
  const theme = useTheme();

  const items = useMemo(() => {
    if (isLoading) {
      return [];
    }

    function handleSelectWallet(id: number) {
      navigate(`/dashboard/settings/profiles/${id}`);
    }

    function handleCreateProfile() {
      navigate(`/dashboard/settings/profiles/add`);
    }

    const createProfileItem = (
      <CardListItem
        variant="outlined"
        onSelect={handleCreateProfile}
        key="create-profile"
        sx={{ border: `1px dashed ${(theme.palette as any).border.main}` }}
      >
        <Flex flexDirection="column" height="100%" width="100%" onClick={handleCreateProfile}>
          <Flex flexDirection="row" justifyContent="space-between">
            <Typography>
              <Trans>Create Profile</Trans>
            </Typography>
            <Add color="info" />
          </Flex>
        </Flex>
      </CardListItem>
    );

    const orderedProfiles = orderBy(wallets, ['id'], ['asc']);

    const profileItems = orderedProfiles
      .filter((wallet) => [WalletType.DECENTRALIZED_ID].includes(wallet.type))
      .map((wallet) => {
        const primaryTitle = wallet.name;

        function handleSelect() {
          handleSelectWallet(wallet.id);
        }

        return (
          <CardListItem onSelect={handleSelect} key={wallet.id} selected={wallet.id === Number(walletId)}>
            <Flex gap={0.5} flexDirection="column" height="100%" width="100%">
              <Flex>
                <Typography variant="body1" sx={{ fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {primaryTitle}
                </Typography>
              </Flex>
              <Flex>
                <DisplayDid wallet={wallet} />
              </Flex>
            </Flex>
          </CardListItem>
        );
      });

    return [createProfileItem, ...profileItems];
  }, [isLoading, wallets, navigate, walletId, theme]);

  return (
    <Flex gap={1} flexDirection="column" width="280px">
      {items}
    </Flex>
  );
}
