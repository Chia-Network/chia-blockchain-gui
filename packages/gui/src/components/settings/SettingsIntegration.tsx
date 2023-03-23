import { Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import Pair from '@types/Pair';
import React, { useCallback, useMemo } from 'react';

import type WalletConnectCommand from '../../@types/WalletConnectCommand';
import walletConnectCommands from '../../constants/WalletConnectCommands';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import useWalletConnectPairs from '../../hooks/useWalletConnectPairs';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';

export default function SettingsIntegration() {
  const { disconnect } = useWalletConnectContext();
  const { enabled, setEnabled, allowConfirmationFingerprintChange, setAllowConfirmationFingerprintChange } =
    useWalletConnectPreferences();

  const [selectedPair, setSelectedPair] = React.useState<Pair | null>(null);
  const [bypassCommands, setBypassCommands] = React.useState<Record<string, boolean> | undefined>();
  const [selection, setSelection] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setBypassCommands(selectedPair?.bypassCommands);
    setSelection(new Set());
  }, [selectedPair, setBypassCommands, setSelection]);

  const { bypassCommand, removeBypassCommand, resetBypassForAllPairs, resetBypassForPair, get } =
    useWalletConnectPairs();

  const pairs = get();

  const handleResetAppPermissions = useCallback(
    (pair) => {
      resetBypassForPair(pair.topic);
      setBypassCommands(undefined);
    },
    [resetBypassForPair, setBypassCommands]
  );

  const handleDisconnectApp = useCallback(
    (pair) => {
      setSelectedPair(null);
      setBypassCommands(undefined);
      disconnect(pair.topic);
    },
    [disconnect, setSelectedPair, setBypassCommands]
  );

  const handleBypassCommandChange = useCallback(
    (pair: Pair, command: string, newState: boolean) => {
      bypassCommand(pair.sessions[0].topic, command, newState);
      setBypassCommands((localBypassCommands) => {
        if (!localBypassCommands) {
          return undefined;
        }

        return {
          ...localBypassCommands,
          [command]: newState,
        };
      });
    },
    [bypassCommand, setBypassCommands]
  );

  const handleUpdateCommandSelection = useCallback(
    (command: string, newState: boolean) => {
      setSelection((localSelection) => {
        const newSelection = new Set(localSelection);
        if (newState) {
          newSelection.add(command);
        } else {
          newSelection.delete(command);
        }

        return newSelection;
      });
    },
    [setSelection]
  );

  const handleResetSelectedPermissions = useCallback(
    (pair: Pair) => {
      selection.forEach((command) => {
        removeBypassCommand(pair.sessions[0].topic, command);
      });
      setSelection(new Set());
      setBypassCommands(undefined);
    },
    [removeBypassCommand, setSelection, selection]
  );

  const commands = useMemo(() => {
    const commandKeys = Object.keys(bypassCommands ?? {});
    return walletConnectCommands.filter((c) => commandKeys.includes(c.command));
  }, [bypassCommands]);

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>WalletConnect</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>
              WalletConnect enables a decentralized app on the Chia blockchain to communicate and make requests directly
              to a Chia wallet.
            </Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{ width: '400px' }}>
          <SettingsTitle>
            <Trans>Enable WalletConnect</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <FormControlLabel
            label={null}
            control={
              <Switch
                checked={enabled}
                onChange={() => setEnabled(!enabled)}
                inputProps={{ 'data-testid': 'Enable_Wallet_Connect' }}
              />
            }
          />
        </Grid>
        <Grid item style={{ width: '400px' }}>
          <SettingsText>
            <Trans>Allow external Apps and websites to connect to your wallet through WalletConnect.</Trans>
          </SettingsText>
        </Grid>
      </Grid>

      <Grid container>
        <Grid item style={{ width: '400px' }}>
          <SettingsTitle>
            <Trans>Key Switching</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <FormControlLabel
            label={null}
            control={
              <Switch
                checked={allowConfirmationFingerprintChange}
                onChange={() => setAllowConfirmationFingerprintChange(!allowConfirmationFingerprintChange)}
                inputProps={{ 'data-testid': 'Enable_Wallet_Connect_Change_fingerprint' }}
              />
            }
          />
        </Grid>
        <Grid item style={{ width: '400px' }}>
          <SettingsText>
            <Trans>Allow requests that require switching to a different wallet key.</Trans>
          </SettingsText>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Flex flexDirection="column" gap={1}>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>App Permissions</Trans>
            </SettingsTitle>
          </Grid>

          <Grid item style={{ width: '400px' }}>
            <SettingsText>
              <Trans>Manage permissions for your WalletConnect apps.</Trans>
            </SettingsText>
          </Grid>

          <Grid item width="624px" marginTop="15px" marginLeft="8px">
            <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
              <FormControlLabel
                label={null}
                control={
                  <Autocomplete
                    id="app-permissions-select"
                    sx={{ width: 400 }}
                    options={pairs}
                    onChange={(event, option) => setSelectedPair(option)}
                    isOptionEqualToValue={(a, b) => a.topic === b.topic}
                    autoHighlight={false}
                    disableClearable
                    getOptionLabel={(option) => option.metadata?.name ?? option.topic}
                    renderOption={(props, option) => (
                      <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                        {option.metadata?.icons && (
                          <img
                            loading="lazy"
                            width="20"
                            src={option.metadata?.icons[0]}
                            srcSet={option.metadata?.icons[0]}
                            alt=""
                          />
                        )}
                        {option.metadata?.name ?? t`Unknown App - ${option.topic}`}
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={<Trans>Select an application</Trans>}
                        inputProps={{
                          ...params.inputProps,
                        }}
                      />
                    )}
                  />
                }
              />
              <Flex flexDirection="row" flexGrow={1} justifyContent="flex-end" marginRight="8px">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleDisconnectApp(selectedPair)}
                  disabled={!selectedPair}
                >
                  Disconnect
                </Button>
              </Flex>
            </Flex>
          </Grid>
        </Flex>
      </Grid>

      {selectedPair ? (
        <Grid container>
          <Flex flexDirection="column" gap={2}>
            <Flex flexDirection="column" gap={1}>
              {commands.length > 0 ? (
                <>
                  <Flex flexDirection="row" alignItems="center" gap={1}>
                    <Checkbox
                      checked={selection.size === commands.length}
                      size="small"
                      onClick={(e) => {
                        setSelection(
                          (e.target as HTMLInputElement).checked ? new Set(commands.map((c) => c.command)) : new Set()
                        );
                        e.stopPropagation();
                      }}
                    />
                    <Trans>Select All</Trans>
                  </Flex>
                  {commands.map((commandInfo: WalletConnectCommand, idx: number) => (
                    <Grid
                      item
                      key={`grid-command-${commandInfo.command}`}
                      width="624px"
                      marginTop="15px"
                      marginLeft="8px"
                    >
                      <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
                        <Grid item style={{ width: '400px' }}>
                          <Flex flexDirection="row" alignItems="center" gap={1} marginLeft="-8px">
                            <Checkbox
                              checked={selection.has(commandInfo.command)}
                              onChange={() =>
                                handleUpdateCommandSelection(commandInfo.command, !selection.has(commandInfo.command))
                              }
                              size="small"
                            />
                            <SettingsTitle>{commandInfo.label ?? commandInfo.command}</SettingsTitle>
                          </Flex>
                        </Grid>
                        <Grid item container xs justifyContent="flex-end" marginTop="-6px" marginRight="8px">
                          <FormControl size="small">
                            <Select
                              value={(bypassCommands ?? {})[commandInfo.command] ? 1 : 0}
                              id={`${idx}`}
                              onChange={() =>
                                handleBypassCommandChange(
                                  selectedPair,
                                  commandInfo.command,
                                  !(bypassCommands ?? {})[commandInfo.command]
                                )
                              }
                            >
                              <MenuItem value={1}>
                                <Trans>Always Allow</Trans>
                              </MenuItem>
                              <MenuItem value={0}>
                                <Trans>Always Reject</Trans>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Flex>
                      <Grid item style={{ width: '400px' }}>
                        <Flex flexDirection="row" alignItems="center" gap={1} marginLeft="38px">
                          <SettingsText>{commandInfo.description ?? ''}</SettingsText>
                        </Flex>
                      </Grid>
                    </Grid>
                  ))}
                </>
              ) : (
                <Grid container sx={{ p: 2 }}>
                  <Grid item style={{ width: '400px' }}>
                    <SettingsTitle>
                      <Trans>No Custom Permissions</Trans>
                    </SettingsTitle>
                  </Grid>
                </Grid>
              )}
            </Flex>
            <Flex flexDirection="row" gap={1}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleResetSelectedPermissions(selectedPair)}
                disabled={selection.size === 0}
              >
                Restore Selected Permissions
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleResetAppPermissions(selectedPair)}
                disabled={!selectedPair || Object.keys(bypassCommands ?? {}).length === 0}
              >
                Restore Default Permissions
              </Button>
            </Flex>
          </Flex>
        </Grid>
      ) : (
        <Grid container sx={{ p: 2 }} />
      )}

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container gap={2}>
        <Grid item style={{ width: '624px' }}>
          <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
            <SettingsTitle>
              <Trans>Reset WalletConnect Permissions</Trans>
            </SettingsTitle>
            <Flex flexDirection="row" flexGrow={1} justifyContent="flex-end" gap={2}>
              <Button
                onClick={() => {
                  resetBypassForAllPairs();
                  setBypassCommands(undefined);
                }}
                color="secondary"
                variant="outlined"
                data-testid="SettingsPanel-resync-wallet-db"
              >
                <Trans>Reset</Trans>
              </Button>
            </Flex>
          </Flex>
        </Grid>
        <Grid item container style={{ width: '400px' }} gap={2}>
          <SettingsText>
            <Trans>
              This will reset all previously granted permissions across all Dapps that have been connected to. After
              resetting you will be asked to grant permission again.
            </Trans>
          </SettingsText>
        </Grid>
      </Grid>
    </Grid>
  );
}
