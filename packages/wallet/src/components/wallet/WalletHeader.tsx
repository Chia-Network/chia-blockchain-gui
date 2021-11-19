import React, { ReactNode } from 'react';
import { Trans } from '@lingui/macro';
import {
  More,
  Flex,
  ConfirmDialog,
  useOpenDialog,
} from '@chia/core';
import { useHistory } from 'react-router';
import {
  Box,
  Typography,
  ListItemIcon,
  MenuItem,
  Button,
} from '@material-ui/core';
import {
  Delete as DeleteIcon,
} from '@material-ui/icons';
import { useDeleteUnconfirmedTransactionsMutation } from '@chia/api-react';
import WalletStatus from './WalletStatus';
import WalletsDropdodown from './WalletsDropdown';
import isDebug from '../../util/isDebug';

type StandardWalletProps = {
  walletId: number;
  actions?: ({ onClose } : { onClose: () => void } ) => ReactNode;
};

export default function WalletHeader(props: StandardWalletProps) {
  const { walletId, actions } = props;
  const openDialog = useOpenDialog();
  const [deleteUnconfirmedTransactions] = useDeleteUnconfirmedTransactionsMutation();
  const history = useHistory();

  async function handleDeleteUnconfirmedTransactions() {
    await openDialog(
      <ConfirmDialog
        title={<Trans>Confirmation</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        confirmColor="danger"
        onConfirm={() => deleteUnconfirmedTransactions({ walletId }).unwrap()}
      >
        <Trans>Are you sure you want to delete unconfirmed transactions?</Trans>
      </ConfirmDialog>,
    );
  }

  function handleAddToken() {
    history.push('/dashboard/wallets/create/simple');
  }

  function handleCreateOffer() {
    history.push('/dashboard/wallets/offers/create');
  }

  function handleViewOffer() {
    history.push('/dashboard/wallets/offers/view');
  }

  return (
    <Flex gap={1} alignItems="center">
      <Flex flexGrow={1} gap={1}>
        <WalletsDropdodown walletId={walletId} />
        <Button
          color="primary"
          onClick={handleAddToken}
        >
          <Trans>+ Add Token</Trans>
        </Button>
        <Button
          color="primary"
          onClick={handleCreateOffer}
        >
          <Trans>Create an Offer</Trans>
        </Button>
        <Button
          color="primary"
          onClick={handleViewOffer}
        >
          <Trans>View an Offer</Trans>
        </Button>
      </Flex>
      <Flex gap={1} alignItems="center">
        <Flex alignItems="center">
          <Typography variant="body1" color="textSecondary">
            <Trans>Status:</Trans>
          </Typography>
          &nbsp;
          <WalletStatus height={isDebug} />
        </Flex>
        <More>
          {({ onClose }) => (
            <Box>
              <MenuItem
                onClick={() => {
                  onClose();
                  handleDeleteUnconfirmedTransactions();
                }}
              >
                <ListItemIcon>
                  <DeleteIcon />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Delete Unconfirmed Transactions</Trans>
                </Typography>
              </MenuItem>
              {actions && actions({ onClose })}
            </Box>
          )}
        </More>
      </Flex>
    </Flex>
  );
}
