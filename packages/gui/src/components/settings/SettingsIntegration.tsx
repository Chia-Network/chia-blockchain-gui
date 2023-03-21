import { Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
// import CloseIcon from '@mui/icons-material/Close';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  // IconButton,
  // InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import Pair from '@types/Pair';
import React, { useCallback } from 'react';

import useWalletConnectPairs from '../../hooks/useWalletConnectPairs';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';

export default function SettingsIntegration() {
  const {
    enabled,
    setEnabled,
    // autoConfirm,
    // setAutoConfirm,
    allowConfirmationFingerprintChange,
    setAllowConfirmationFingerprintChange,
  } = useWalletConnectPreferences();

  const [selectedPair, setSelectedPair] = React.useState<Pair | null>(null);
  const [bypassCommands, setBypassCommands] = React.useState<Record<string, boolean> | undefined>();

  React.useEffect(() => {
    setBypassCommands(selectedPair?.bypassCommands);
  }, [selectedPair]);

  const { /* bypassCommand, removeBypassCommand, */ resetBypassForAllPairs, resetBypassForPair, get } =
    useWalletConnectPairs();

  const pairs = get();

  const resetAppPermissions = useCallback(
    (pair) => {
      resetBypassForPair(pair.topic);
      setBypassCommands(undefined);
    },
    [resetBypassForPair, setBypassCommands]
  );

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
                  onClick={() => resetAppPermissions(selectedPair)}
                  disabled={!selectedPair || Object.keys(bypassCommands ?? {}).length === 0}
                >
                  Reset Permissions
                </Button>
              </Flex>
            </Flex>
          </Grid>
        </Flex>
      </Grid>

      {selectedPair ? (
        <Grid container>
          <Flex flexDirection="column" gap={1}>
            {bypassCommands && Object.keys(bypassCommands).length > 0 ? (
              Object.keys(bypassCommands).map((command: string, idx: number) => (
                <Grid item width="624px" marginTop="15px" marginLeft="8px">
                  <Flex
                    key={`row-${command}`}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="spaceBetween"
                    gap={1}
                  >
                    <Grid item style={{ width: '400px' }}>
                      <SettingsTitle>
                        <Trans>
                          {/* {bypassCommands[command] ? 'Allow ' : 'Reject '} {command} */}
                          {command}
                        </Trans>
                      </SettingsTitle>
                    </Grid>
                    <Grid item container xs justifyContent="flex-end" marginTop="-6px" marginRight="8px">
                      <FormControl size="small">
                        {/* <InputLabel required focused>
                      <Trans>Asset Type</Trans>
                    </InputLabel> */}
                        <Select value={1} id={idx}>
                          <MenuItem value={1}>
                            <Trans>Allow</Trans>
                          </MenuItem>
                          <MenuItem value={2}>
                            <Trans>Deny</Trans>
                          </MenuItem>
                        </Select>
                      </FormControl>
                      {/* <FormControlLabel
                    control={
                      <Switch
                        checked={bypassCommands[command]}
                        onChange={() => {
                          bypassCommand(selectedPair.sessions[0].topic, command, !bypassCommands[command]);
                          bypassCommands[command] = !bypassCommands[command];
                        }}
                        inputProps={{ 'data-testid': 'Enable_Wallet_Connect_Change_fingerprint' }}
                      />
                    }
                  /> */}
                      {/* <FormControlLabel
                    control={
                      <IconButton
                        onClick={() => {
                          removeBypassCommand(selectedPair.sessions[0].topic, command);
                          delete bypassCommands[command];
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  /> */}
                    </Grid>
                  </Flex>
                </Grid>
              ))
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
