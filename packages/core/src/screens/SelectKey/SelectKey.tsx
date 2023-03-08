import type { KeyData } from '@chia-network/api';
import {
  useGetKeyringStatusQuery,
  useDeleteAllKeysMutation,
  useLogInAndSkipImportMutation,
  useGetKeysQuery,
  useLogout,
  usePrefs,
} from '@chia-network/api-react';
import { ChiaBlack } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Alert, Typography, Container, ListItemIcon } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Sortable from 'sortablejs';
import styled from 'styled-components';

import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DropdownActions from '../../components/Dropdown/DropdownActions';
import Flex from '../../components/Flex';
import Loading from '../../components/Loading';
import MenuItem from '../../components/MenuItem/MenuItem';
import More from '../../components/More';
import TooltipIcon from '../../components/TooltipIcon';
import useKeyringMigrationPrompt from '../../hooks/useKeyringMigrationPrompt';
import useOpenDialog from '../../hooks/useOpenDialog';
import useShowError from '../../hooks/useShowError';
import useSkipMigration from '../../hooks/useSkipMigration';
// import Search from './Search';
import SelectKeyItem from './SelectKeyItem';

const StyledContainer = styled(Container)`
  padding-bottom: 1rem;
  width: 968px;
`;

export default function SelectKey() {
  const openDialog = useOpenDialog();
  const navigate = useNavigate();
  const [deleteAllKeys] = useDeleteAllKeysMutation();
  const [logIn] = useLogInAndSkipImportMutation();
  const { data: publicKeyFingerprints, isLoading: isLoadingPublicKeys, error, refetch } = useGetKeysQuery();
  const { data: keyringState, isLoading: isLoadingKeyringStatus } = useGetKeyringStatusQuery();
  const hasFingerprints = !!publicKeyFingerprints?.length;
  const [selectedFingerprint, setSelectedFingerprint] = useState<number | undefined>();
  const [skippedMigration] = useSkipMigration();
  const [promptForKeyringMigration] = useKeyringMigrationPrompt();
  const showError = useShowError();
  const cleanCache = useLogout();
  const [sortedWallets, setSortedWallets] = usePrefs('sortedWallets', []);

  const keyItemsSortable = React.useRef<any>(null);

  React.useEffect(() => {
    if (document.getElementById('key-items-container')) {
      keyItemsSortable.current = new Sortable(document.getElementById('key-items-container'), {
        onEnd: () => {
          const newArray = [...(document.getElementById('key-items-container') as HTMLElement).children].map(
            (node: any) => node.attributes['data-testid'].value.split('-')[2]
          );
          setSortedWallets(newArray);
        },
      });
    }
  }, [publicKeyFingerprints, setSortedWallets]);

  async function handleSelect(fingerprint: number) {
    if (selectedFingerprint) {
      return;
    }

    try {
      setSelectedFingerprint(fingerprint);
      await logIn({
        fingerprint,
      }).unwrap();

      await cleanCache();

      navigate('/dashboard/wallets');
    } catch (err) {
      showError(err);
    } finally {
      setSelectedFingerprint(undefined);
    }
  }

  async function handleDeleteAllKeys() {
    const canModifyKeyring = await handleKeyringMutator();

    if (!canModifyKeyring) {
      return;
    }

    await openDialog(
      <ConfirmDialog
        title={<Trans>Delete all keys</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        cancelTitle={<Trans>Back</Trans>}
        confirmColor="danger"
        onConfirm={() => deleteAllKeys().unwrap()}
      >
        <Trans>
          Deleting all keys will permanently remove the keys from your computer, make sure you have backups. Are you
          sure you want to continue?
        </Trans>
      </ConfirmDialog>
    );
  }

  async function handleKeyringMutator(): Promise<boolean> {
    // If the keyring requires migration and the user previously skipped migration, prompt again
    if (isLoadingKeyringStatus || (keyringState?.needsMigration && skippedMigration)) {
      await promptForKeyringMigration();

      return false;
    }

    return true;
  }

  async function handleNavigationIfKeyringIsMutable(url: string) {
    const canModifyKeyring = await handleKeyringMutator();

    if (canModifyKeyring) {
      navigate(url);
    }
  }

  function sortedFingerprints(fingerprints: string[]) {
    const sorted = sortedWallets
      .map((fingerprint: string) => fingerprints.find((f: any) => fingerprint === String(f.fingerprint)))
      .filter((x: any) => !!x); /* if we added a new wallet and order was not saved yet case */
    fingerprints.forEach((f: any) => {
      if (sorted.map((f2: any) => f2.fingerprint).indexOf(f.fingerprint) === -1) {
        sorted.push(f);
      }
    });
    return sorted;
  }

  const NewWalletButtonGroup = (
    <Flex alignItems="right">
      <DropdownActions label={<Trans>Add wallet</Trans>} variant="contained">
        <MenuItem close onClick={() => handleNavigationIfKeyringIsMutable('/wallet/add')}>
          <Typography variant="inherit" noWrap>
            <Trans>Create New</Trans>
          </Typography>
        </MenuItem>
        <MenuItem close onClick={() => handleNavigationIfKeyringIsMutable('/wallet/import')}>
          <Typography variant="inherit" noWrap>
            <Trans>Import Existing</Trans>
          </Typography>
        </MenuItem>
      </DropdownActions>
      {hasFingerprints && (
        <Flex
          sx={{
            '> button': {
              width: '37px',
              height: '37px',
              marginLeft: '10px',
            },
          }}
        >
          <More>
            <MenuItem onClick={handleDeleteAllKeys} close>
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <Typography variant="inherit" noWrap>
                <Trans>Delete All Keys</Trans>
              </Typography>
            </MenuItem>
          </More>
        </Flex>
      )}
    </Flex>
  );

  return (
    <StyledContainer>
      <Flex flexDirection="column" alignItems="flex-start" gap={3}>
        {isLoadingPublicKeys ? (
          <Loading center>
            <Trans>Loading list of the keys</Trans>
          </Loading>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button onClick={refetch} color="inherit" size="small">
                <Trans>Try Again</Trans>
              </Button>
            }
          >
            <Trans>Unable to load the list of the keys</Trans>
            &nbsp;
            <TooltipIcon>{error.message}</TooltipIcon>
          </Alert>
        ) : hasFingerprints ? (
          <Flex
            justifyContent="space-between"
            width="100%"
            sx={{ borderBottom: '1px solid #CCDDE1', paddingBottom: '30px' }}
          >
            <Flex alignItems="left">
              <ChiaBlack color="secondary" />
              <Typography variant="h4" component="h1" sx={{ position: 'relative', left: '15px', top: '5px' }}>
                <Trans>Wallet Keys</Trans>
              </Typography>
            </Flex>
            {NewWalletButtonGroup}
          </Flex>
        ) : (
          <>
            <Typography variant="h5" component="h1">
              <Trans>Sign In</Trans>
            </Typography>
            <Typography variant="subtitle1" align="center">
              <Trans>Welcome to Chia. Please log in with an existing key, or create a new key.</Trans>
            </Typography>
            {NewWalletButtonGroup}
          </>
        )}
        {/* <Search /> */}
        <Flex flexDirection="column" gap={3} alignItems="stretch" alignSelf="stretch">
          {hasFingerprints && (
            <Flex
              id="key-items-container"
              sx={{
                marginTop: '5px',
                flexWrap: 'wrap',
                rowGap: '22px',
                columnGap: '22px',
                '> div': {
                  flexBasis: '292px',
                },
              }}
            >
              {sortedFingerprints(publicKeyFingerprints).map((keyData: KeyData, index: number) => (
                <SelectKeyItem
                  key={keyData.fingerprint}
                  index={index}
                  keyData={keyData}
                  onSelect={handleSelect}
                  loading={keyData.fingerprint === selectedFingerprint}
                  disabled={!!selectedFingerprint && keyData.fingerprint !== selectedFingerprint}
                />
              ))}
            </Flex>
          )}
        </Flex>
      </Flex>
    </StyledContainer>
  );
}
