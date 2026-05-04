import { Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import {
  Autocomplete,
  Box,
  Button,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  PermissionsCommandMetadata,
  PermissionsPairRecord,
} from '../../@types/PermissionsService';
import useCommandMetadata from '../../hooks/useCommandMetadata';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';

// Display label for a stored wire-form WC command (e.g. `chia_sendTransaction`).
// Reads from main's `commandRegistry` via the metadata IPC. Falls back to the
// bare name when the registry has no label for it.
function commandLabel(wcCommand: string, byWc: Map<string, PermissionsCommandMetadata>): React.ReactNode {
  const meta = byWc.get(wcCommand);
  if (meta?.label) return meta.label;
  return wcCommand.startsWith('chia_') ? wcCommand.slice('chia_'.length) : wcCommand;
}

function commandDescription(
  wcCommand: string,
  byWc: Map<string, PermissionsCommandMetadata>,
): React.ReactNode | undefined {
  return byWc.get(wcCommand)?.description;
}

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
  const { byWc: commandsByWc } = useCommandMetadata();

  // Pair list is fetched from main on mount and after every mutation. Main
  // owns the persisted state (commands + bypass + grants); the renderer is a
  // pure view here.
  const [pairs, setPairs] = useState<PermissionsPairRecord[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [autocompleteKey, setAutocompleteKey] = useState(0);

  // Bumped on every mutation to trigger a refetch via the effect below.
  const [refreshTick, setRefreshTick] = useState(0);
  // Stash the latest list in a ref so callbacks can iterate without
  // re-rendering when only the trigger changes.
  const pairsRef = useRef<PermissionsPairRecord[]>([]);
  pairsRef.current = pairs;

  useEffect(() => {
    let cancelled = false;
    // useEffect can't be async itself; IIFE keeps the await on top while
    // letting the effect return its sync cleanup.
    (async () => {
      try {
        const list = await window.permissionsAPI.listPairs();
        if (!cancelled) setPairs(list);
      } catch {
        if (!cancelled) setPairs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  const selectedPair = useMemo(() => pairs.find((p) => p.topic === topic), [pairs, topic]);
  const bypassSet = useMemo(() => new Set(selectedPair?.bypass ?? []), [selectedPair]);

  const handleDisconnectApp = useCallback(async () => {
    if (!topic) return;
    try {
      // disconnectPair (in `util/walletConnect.ts`) also calls
      // `permissionsAPI.revokePair` in its finally block, so the next
      // refresh will drop this pair from the list.
      await disconnect(topic);
    } catch (e) {
      console.warn('Failed to disconnect pair', e);
    }
    setTopic(null);
    setAutocompleteKey((k) => k + 1); // force the Autocomplete to clear its selection
    refresh();
  }, [disconnect, topic, refresh]);

  const handleToggleBypass = useCallback(
    async (wcCommand: string, enabledNext: boolean) => {
      if (!topic) return;
      await window.permissionsAPI.setBypass({ topic, wcCommand, enabled: enabledNext });
      refresh();
    },
    [topic, refresh],
  );

  const handleResetForPair = useCallback(async () => {
    if (!topic) return;
    const pair = pairsRef.current.find((p) => p.topic === topic);
    if (!pair) return;
    // Loop is fine — bypass lists are bounded by the dapp's `commands`
    // (typically <40 entries), and this UI runs at human pace. If main ever
    // grows a batch endpoint, swap this for one call.
    for (const wcCommand of pair.bypass) {
      // eslint-disable-next-line no-await-in-loop
      await window.permissionsAPI.setBypass({ topic, wcCommand, enabled: false });
    }
    refresh();
  }, [topic, refresh]);

  const handleResetForAllPairs = useCallback(async () => {
    for (const pair of pairsRef.current) {
      for (const wcCommand of pair.bypass) {
        // eslint-disable-next-line no-await-in-loop
        await window.permissionsAPI.setBypass({ topic: pair.topic, wcCommand, enabled: false });
      }
    }
    refresh();
  }, [refresh]);

  const updateSelectedPair = useCallback((pair: PermissionsPairRecord | null) => {
    setTopic(pair?.topic ?? null);
  }, []);

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
              <Trans>
                Pick which commands a connected app can run silently. Anything not toggled will still ask for
                confirmation.
              </Trans>
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
                    onChange={(_event, option) => updateSelectedPair(option)}
                    isOptionEqualToValue={(a, b) => a.topic === b.topic}
                    autoHighlight={false}
                    disableClearable
                    getOptionLabel={(option) => option.metadata?.name ?? option.topic}
                    renderOption={(props, option) => (
                      <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                        {option.metadata?.icon && (
                          <img loading="lazy" width="20" src={option.metadata.icon} alt="" />
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
                        inputProps={{ ...params.inputProps }}
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

      {selectedPair && (
        <Grid container marginTop="8px">
          <Flex flexDirection="column" gap={2}>
            <Flex flexDirection="column" gap={1}>
              {selectedPair.commands.length > 0 ? (
                <Box {...borderStyle}>
                  <Typography variant="h6">
                    <Trans>Skip Confirmation for Commands</Trans>
                  </Typography>
                  <Grid spacing={2} container marginTop="4px" marginRight="-32px">
                    {selectedPair.commands.map((wcCommand) => {
                      const isBypassed = bypassSet.has(wcCommand);
                      return (
                        <Grid item key={`grid-command-${wcCommand}`} width="624px" marginLeft="8px">
                          <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
                            <Grid item style={{ width: '400px' }}>
                              <SettingsTitle>{commandLabel(wcCommand, commandsByWc)}</SettingsTitle>
                            </Grid>
                            <Grid item container xs justifyContent="flex-end" marginTop="-6px" marginRight="8px">
                              <FormControlLabel
                                label={null}
                                control={
                                  <Switch
                                    checked={isBypassed}
                                    onChange={(_e, checked) => handleToggleBypass(wcCommand, checked)}
                                  />
                                }
                              />
                            </Grid>
                          </Flex>
                          <Grid item style={{ width: '400px' }}>
                            <SettingsText>{commandDescription(wcCommand, commandsByWc) ?? ''}</SettingsText>
                          </Grid>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ) : (
                <Box {...borderStyle}>
                  <Grid item width="590px">
                    <Typography variant="subtitle1">
                      <Trans>This app has no granted commands</Trans>
                    </Typography>
                  </Grid>
                </Box>
              )}
            </Flex>

            {selectedPair.bypass.length > 0 && (
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
                      >
                        <Trans>Restore</Trans>
                      </Button>
                    </Flex>
                  </Flex>
                </Grid>
                <Grid item container style={{ width: '400px' }} gap={2}>
                  <SettingsText>
                    <Trans>
                      Clear every "always allow" override for this app. Future commands will require confirmation again.
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
                onClick={handleResetForAllPairs}
                color="secondary"
                variant="outlined"
              >
                <Trans>Reset</Trans>
              </Button>
            </Flex>
          </Flex>
        </Grid>
        <Grid item container style={{ width: '400px' }} gap={2}>
          <SettingsText>
            <Trans>
              Clear every "always allow" override across every connected app. After resetting, every command will ask
              for confirmation.
            </Trans>
          </SettingsText>
        </Grid>
      </Grid>
    </Grid>
  );
}
