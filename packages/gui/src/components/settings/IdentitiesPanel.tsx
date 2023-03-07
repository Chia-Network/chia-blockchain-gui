import { WalletType } from '@chia-network/api';
import { useGetDIDQuery, useGetWalletsQuery } from '@chia-network/api-react';
import { CardListItem, Flex, Truncate } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Add } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { orderBy } from 'lodash';
import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { didToDIDId } from '../../util/dids';

const StyledRoot = styled(Box)`
  min-width: 280px;
  height: 100%;
  display: flex;
  padding-top: ${({ theme }) => `${theme.spacing(1)}`};
`;

const StyledBody = styled(Box)`
  flex-grow: 1;
  position: relative;
`;

const StyledItemsContainer = styled(Box)`
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: ${({ theme }) => theme.spacing(11)};
`;

const StyledContent = styled(Box)`
  padding-left: ${({ theme }) => theme.spacing(0)};
  padding-right: ${({ theme }) => theme.spacing(4)};
  min-height: ${({ theme }) => theme.spacing(5)};
`;

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

  const dids = [];
  if (wallets) {
    wallets.forEach((wallet) => {
      if (wallet.type === WalletType.DECENTRALIZED_ID) {
        dids.push(wallet.id);
      }
    });
  }

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
            <Add />
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
    <StyledRoot>
      <Flex gap={3} flexDirection="column" width="100%">
        <StyledBody>
          <StyledItemsContainer>
            <StyledContent>
              <Flex gap={1} flexDirection="column" height="100%" width="100%">
                {items}
              </Flex>
            </StyledContent>
          </StyledItemsContainer>
        </StyledBody>
      </Flex>
    </StyledRoot>
  );
}
