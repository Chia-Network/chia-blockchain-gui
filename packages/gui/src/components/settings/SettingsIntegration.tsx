import { Flex, MenuItem, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import Pair from '../../@types/Pair';
import type WalletConnectCommand from '../../@types/WalletConnectCommand';
import walletConnectCommands from '../../constants/WalletConnectCommands';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import useWalletConnectPairs from '../../hooks/useWalletConnectPairs';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';

export default function SettingsIntegration() {
  const theme = useTheme();
  const borderColor =
    theme.palette.mode === 'dark' ? (theme.palette as any).border.dark : (theme.palette as any).border.main;
  const borderStyle = {
    border: 1,
    borderColor,
    borderRadius: 2,
    padding: 2,
  };
  const { disconnect } = useWalletConnectContext();
  const { enabled, setEnabled, allowConfirmationFingerprintChange, setAllowConfirmationFingerprintChange } =
    useWalletConnectPreferences();

  const [topic, setTopic] = React.useState<string | null>(null);
  const [bypassCommands, setBypassCommands] = React.useState<Record<string, boolean> | undefined>();
  const selectedPair = useRef<Pair | undefined>(undefined);
  const [autocompleteKey, setAutocompleteKey] = React.useState(0);

  const { bypassCommand, removeBypassCommand, resetBypassForAllPairs, resetBypassForPair, get } =
    useWalletConnectPairs();

  const pairs = get();

  const refreshBypassCommands = React.useCallback(() => {
    if (selectedPair.current) {
      setBypassCommands(selectedPair.current.bypassCommands);
    }
  }, [selectedPair, setBypassCommands]);

  const updateSelectedPair = React.useCallback(
    (pair: Pair) => {
      setTopic(pair.topic);
    },
    [setTopic]
  );

  const handleDisconnectApp = useCallback(() => {
    const pair = selectedPair.current;

    if (!pair) {
      return;
    }
    disconnect(pair.topic);
    setTopic(null);
    setBypassCommands(undefined);
    selectedPair.current = undefined;
    setAutocompleteKey((localKey) => localKey + 1); // hack to force autocomplete to re-render. without this, the selected value doesn't change
  }, [disconnect, selectedPair, setTopic, setBypassCommands]);

  const handleBypassCommandChange = useCallback(
    (command: string, newState: boolean) => {
      const pair = selectedPair.current;
      if (!pair) {
        return;
      }
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

  const handleResetForPair = useCallback(() => {
    const pair = selectedPair.current;
    if (!pair) {
      return;
    }
    resetBypassForPair(pair.topic);
  }, [resetBypassForPair, selectedPair]);

  const handleRemoveBypassCommand = useCallback(
    (command: string) => {
      const pair = selectedPair.current;
      if (!pair) {
        return;
      }
      removeBypassCommand(pair.sessions[0].topic, command);
    },
    [removeBypassCommand, selectedPair]
  );

  const commands = useMemo(() => {
    const commandKeys = Object.keys(bypassCommands ?? {});
    return walletConnectCommands.filter((c) => commandKeys.includes(c.command));
  }, [bypassCommands]);

  useEffect(() => {
    if (topic && pairs.length > 0) {
      const pair = pairs.find((localPair) => localPair.topic === topic);
      if (!pair) {
        return;
      }
      selectedPair.current = pair;
      refreshBypassCommands();
    } else {
      selectedPair.current = undefined;
      setBypassCommands(undefined);
    }
  }, [topic, pairs, refreshBypassCommands]);

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

          <Grid item width="624px" marginTop="15px" marginLeft="11px">
            <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
              <FormControlLabel
                label={null}
                control={
                  <Autocomplete
                    key={autocompleteKey}
                    id="app-permissions-select"
                    sx={{ width: 400 }}
                    options={pairs}
                    onChange={(event, option) => updateSelectedPair(option)}
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
                        label={
                          pairs.length > 0 ? (
                            <Trans>Select an application</Trans>
                          ) : (
                            <Trans>No connected applications</Trans>
                          )
                        }
                        inputProps={{
                          ...params.inputProps,
                        }}
                      />
                    )}
                  />
                }
              />
              <Flex flexDirection="row" flexGrow={1} justifyContent="flex-end" marginRight="11px">
                <Button variant="outlined" color="secondary" onClick={handleDisconnectApp} disabled={!topic}>
                  <Trans>Disconnect</Trans>
                </Button>
              </Flex>
            </Flex>
          </Grid>
        </Flex>
      </Grid>

      {topic && (
        <Grid container marginTop="8px">
          <Flex flexDirection="column" gap={2}>
            <Flex flexDirection="column" gap={1}>
              {commands.length > 0 ? (
                <Box {...borderStyle}>
                  <Typography variant="h6">
                    <Trans>Skip Confirmation for Commands</Trans>
                  </Typography>
                  <Grid spacing={2} container marginTop="4px" marginRight="-32px">
                    {commands.map((commandInfo: WalletConnectCommand, idx: number) => (
                      <Grid item key={`grid-command-${commandInfo.command}`} width="624px" marginLeft="8px">
                        <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
                          <Grid item style={{ width: '400px' }}>
                            <SettingsTitle>{commandInfo.label ?? commandInfo.command}</SettingsTitle>
                          </Grid>
                          <Grid item container xs justifyContent="flex-end" marginTop="-6px" marginRight="8px">
                            <FormControl size="small">
                              <Select
                                value={(bypassCommands ?? {})[commandInfo.command] ? 1 : 0}
                                id={`${idx}`}
                                onChange={() =>
                                  handleBypassCommandChange(
                                    commandInfo.command,
                                    !(bypassCommands ?? {})[commandInfo.command]
                                  )
                                }
                              >
                                <MenuItem value={1}>
                                  <Trans>Always Allow</Trans>
                                </MenuItem>
                                <MenuItem value={0} divider>
                                  <Trans>Always Reject</Trans>
                                </MenuItem>
                                <MenuItem onClick={() => handleRemoveBypassCommand(commandInfo.command)}>
                                  <Trans>Require Confirmation</Trans>
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Flex>
                        <Grid item style={{ width: '400px' }}>
                          <SettingsText>{commandInfo.description ?? ''}</SettingsText>
                        </Grid>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box {...borderStyle}>
                  <Grid item width="590px">
                    <Typography variant="subtitle1">
                      <Trans>No Custom Permissions</Trans>
                    </Typography>
                  </Grid>
                </Box>
              )}
            </Flex>

            {topic && commands.length > 0 && (
              <>
                <Grid item style={{ width: '624px' }}>
                  <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
                    <SettingsTitle>
                      <Trans>Restore Default Dapp Permissions</Trans>
                    </SettingsTitle>
                    <Flex flexDirection="row" flexGrow={1} justifyContent="flex-end" gap={2}>
                      <Button
                        onClick={handleResetForPair}
                        color="secondary"
                        variant="outlined"
                        data-testid="SettingsPanel-resync-wallet-db"
                      >
                        <Trans>Restore</Trans>
                      </Button>
                    </Flex>
                  </Flex>
                </Grid>
                <Grid item container style={{ width: '400px' }} gap={2}>
                  <SettingsText>
                    <Trans>
                      This will restore the selected Dapp's permissions back to their default values. By default, every
                      command issued by the Dapp will require confirmation in the Chia wallet.
                    </Trans>
                  </SettingsText>
                </Grid>
              </>
            )}
          </Flex>
        </Grid>
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
