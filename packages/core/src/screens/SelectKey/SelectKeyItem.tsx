import React, { useState } from 'react';
import { Trans } from '@lingui/macro';
import { Alert, Box, Typography, ListItemIcon } from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import type { KeyData } from '@chia/api';
import {
  useCheckDeleteKeyMutation,
  useDeleteKeyMutation,
  useGetKeyringStatusQuery,
} from '@chia/api-react';
import SelectKeyDetailDialog from './SelectKeyDetailDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingOverlay from '../../components/LoadingOverlay';
import CardListItem from '../../components/CardListItem';
import More from '../../components/More';
import { MenuItem } from '../../components/MenuItem';
import Flex from '../../components/Flex';
import useOpenDialog from '../../hooks/useOpenDialog';
import useSkipMigration from '../../hooks/useSkipMigration';
import useKeyringMigrationPrompt from '../../hooks/useKeyringMigrationPrompt';
import SelectKeyRenameForm from './SelectKeyRenameForm';

type SelectKeyItemProps = {
  keyData: KeyData;
  index: number;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (fingerprint: number) => void;
};

export default function SelectKeyItem(props: SelectKeyItemProps) {
  const { keyData, onSelect, disabled, loading, index } = props;
  const { data: keyringState, isLoading: isLoadingKeyringStatus } =
    useGetKeyringStatusQuery();
  const openDialog = useOpenDialog();
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [deleteKey] = useDeleteKeyMutation();
  const [checkDeleteKey] = useCheckDeleteKeyMutation();
  const [skippedMigration] = useSkipMigration();
  const [promptForKeyringMigration] = useKeyringMigrationPrompt();

  const { fingerprint, label } = keyData;

  async function handleLogin() {
    onSelect(fingerprint);
  }

  function handleShowKey() {
    openDialog(
      <SelectKeyDetailDialog fingerprint={fingerprint} index={index} />
    );
  }

  function handleRename() {
    setIsRenaming(true);
  }

  function handleCloseRename() {
    setIsRenaming(false);
  }

  async function handleDeletePrivateKey() {
    const canModifyKeyring = await handleKeyringMutator();
    if (!canModifyKeyring) {
      return;
    }

    const {
      data: { usedForFarmerRewards, usedForPoolRewards, walletBalance },
    } = await checkDeleteKey({
      fingerprint,
    });

    async function handleKeyringMutator(): Promise<boolean> {
      // If the keyring requires migration and the user previously skipped migration, prompt again
      if (
        isLoadingKeyringStatus ||
        (keyringState?.needsMigration && skippedMigration)
      ) {
        await promptForKeyringMigration();

        return false;
      }

      return true;
    }

    await openDialog(
      <ConfirmDialog
        title={<Trans>Delete key {fingerprint}</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        cancelTitle={<Trans>Back</Trans>}
        confirmColor="danger"
        onConfirm={() => deleteKey({ fingerprint }).unwrap()}
      >
        {usedForFarmerRewards && (
          <Alert severity="warning">
            <Trans>
              Warning: This key is used for your farming rewards address. By
              deleting this key you may lose access to any future farming
              rewards
            </Trans>
          </Alert>
        )}

        {usedForPoolRewards && (
          <Alert severity="warning">
            <Trans>
              Warning: This key is used for your pool rewards address. By
              deleting this key you may lose access to any future pool rewards
            </Trans>
          </Alert>
        )}

        {walletBalance && (
          <Alert severity="warning">
            <Trans>
              Warning: This key is used for a wallet that may have a non-zero
              balance. By deleting this key you may lose access to this wallet
            </Trans>
          </Alert>
        )}

        <Trans>
          Deleting the key will permanently remove the key from your computer,
          make sure you have backups. Are you sure you want to continue?
        </Trans>
      </ConfirmDialog>
    );
  }

  return (
    <LoadingOverlay loading={loading} disabled={disabled}>
      <CardListItem
        onSelect={isRenaming ? undefined : handleLogin}
        data-testid={`SelectKeyItem-fingerprint-${fingerprint}`}
        key={fingerprint}
      >
        <Flex alignItems="center">
          <Flex direction="column" gap={isRenaming ? 1 : 0} flexGrow={1}>
            {isRenaming ? (
              <SelectKeyRenameForm
                keyData={keyData}
                onClose={handleCloseRename}
              />
            ) : (
              <Typography variant="h6" noWrap>
                {label || <Trans>Wallet {index + 1}</Trans>}
              </Typography>
            )}
            <Typography variant="body2" color="textSecondary">
              {fingerprint}
            </Typography>
          </Flex>
          <Box>
            <More>
              <MenuItem onClick={handleRename} close>
                <ListItemIcon>
                  <EditIcon />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Rename</Trans>
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleShowKey} close>
                <ListItemIcon>
                  <VisibilityIcon />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Details</Trans>
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleDeletePrivateKey} close>
                <ListItemIcon>
                  <DeleteIcon />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Delete</Trans>
                </Typography>
              </MenuItem>
            </More>
          </Box>
        </Flex>
      </CardListItem>
    </LoadingOverlay>
  );
}
