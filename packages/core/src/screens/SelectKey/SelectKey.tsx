import type { KeyData } from '@chia-network/api';
import {
  usePrefs,
  useGetKeyringStatusQuery,
  useDeleteAllKeysMutation,
  useLogInAndSkipImportMutation,
  useGetKeysQuery,
  useLogout,
  type Serializable,
} from '@chia-network/api-react';
import { ChiaBlack, Coins } from '@chia-network/icons';
import data from '@emoji-mart/data';
import { Trans } from '@lingui/macro';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Alert, Typography, Container, ListItemIcon } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { init } from 'emoji-mart';
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

init({ data });
const { emojis: allEmojis } = data;

const StyledContainer = styled(Container)`
  padding-bottom: 1rem;
  max-width: 968px;
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

  type LocalStorageType = Record<string, Record<string, Serializable>>;
  const theme = useTheme();
  const [fingerprintSettings, setFingerprintSettings] = usePrefs<LocalStorageType>('fingerprintSettings', {});
  const allColors = (theme.palette as any).colors;
  /* useEffect - set random emojis and colors for each wallet
     if we got no walletKeyTheme keys in each fingerprint inside prefs.yaml */
  React.useEffect(() => {
    if (publicKeyFingerprints.length) {
      const newFingerprints: any = {};
      let notifyChange: boolean = false;
      publicKeyFingerprints.forEach((f: any) => {
        const peopleAndNatureEmojisWords = (data as any).originalCategories
          .filter((category: any) => ['people', 'nature'].indexOf(category.id) > -1)
          .map((category: any) => category.emojis)
          .flat();
        const randomEmoji = peopleAndNatureEmojisWords[Math.floor(peopleAndNatureEmojisWords.length * Math.random())];
        const themeColors = Object.keys(allColors);
        const randomTheme = {
          emoji: allEmojis[randomEmoji].skins[0].native,
          color: themeColors[Math.floor(themeColors.length * Math.random())],
        };
        if (fingerprintSettings[f.fingerprint] && !fingerprintSettings[f.fingerprint].walletKeyTheme) {
          newFingerprints[f.fingerprint] = { ...fingerprintSettings[f.fingerprint], walletKeyTheme: randomTheme };
          notifyChange = true;
        } else if (!fingerprintSettings[f.fingerprint]) {
          newFingerprints[f.fingerprint] = { walletKeyTheme: randomTheme };
          notifyChange = true;
        } else {
          newFingerprints[f.fingerprint] = fingerprintSettings[f.fingerprint];
        }
      });
      if (notifyChange) {
        setFingerprintSettings(newFingerprints);
      }
    }
  }, [publicKeyFingerprints, fingerprintSettings, setFingerprintSettings, allColors]);

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

  /* On smaller screens where we have 2 wallets per row and we have odd number of wallets,
     render another empty div to prevent last wallet stretching to 100% in the last row */
  function renderEmptyDivIfOddNumberOfWallets() {
    return publicKeyFingerprints.length % 2 === 1 && <div />;
  }

  function renderTopSection() {
    return (
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
    );
  }

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
          <>{renderTopSection()}</>
        ) : (
          <>
            {renderTopSection()}
            <Flex alignItems="center" flexDirection="column">
              <Typography component="div" variant="h4" color="textPrimary" sx={{ fontWeight: 600, fontSize: '40px' }}>
                <Trans>Open a world of possibilities.</Trans>
              </Typography>
              <Typography
                component="div"
                variant="subtitle2"
                color="textSecondary"
                sx={{ fontWeight: 400, fontSize: '18px' }}
              >
                <Trans>Create a new wallet key to get started with Chia.</Trans>
              </Typography>
              <Button
                onClick={() => handleNavigationIfKeyringIsMutable('/wallet/add')}
                variant="outlined"
                color="primary"
                sx={{ margin: '15px 0' }}
              >
                <Trans>Create a new wallet key</Trans>
              </Button>
              <Coins />
            </Flex>
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
                paddingBottom: '230px',
                '> div': {
                  '@media (min-width: 983px)': {
                    flexBasis: '292px',
                    maxWidth: '292px',
                  },
                  '@media (max-width: 982px)': {
                    flexBasis: 'none',
                    flex: 'calc(50% - 22px)',
                    minWidth: '250px',
                  },
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
              {renderEmptyDivIfOddNumberOfWallets()}
            </Flex>
          )}
        </Flex>
      </Flex>
    </StyledContainer>
  );
}
