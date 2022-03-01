import React from 'react';
import { Trans } from '@lingui/macro';
import styled from 'styled-components';
import { Button, Flex, Logo, Card, useMode, Mode, Tooltip } from '@chia/core';
import { 
  AccountBalanceWallet as AccountBalanceWalletIcon, 
  Eco as EcoIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
} from '@material-ui/icons';
import { Box, Typography, Container, Grid } from '@material-ui/core';

const StyledCheckIcon = styled(CheckIcon)`
  border-radius: 9999px;
  padding: ${({ theme }) => theme.spacing(0.5)}px;
  background-color: rgba(97,188,122,0.2);
`;

const StyledSettingsIcon = styled(SettingsIcon)`
  vertical-align: sub;
`;

const StyledCardContent = styled(Box)`
  display: flex;
  padding: 0.5rem 0rem;
  flex-direction: column;
  height: 100%;
  flex-grow: 1;
`;

const StyledContainer = styled(Container)`
  padding-bottom: 1rem;
`;

const StyledGridItem = styled(Grid)`
  display: flex;
  flex-direction: column;
`;

const StyledEcoIcon = styled(EcoIcon)`
  font-size: 3.4rem;
  color: ${({ theme }) => theme.palette.type === 'dark'
    ? 'white'
    : 'rgba(0, 0, 0, 0.54)'};
`;

const StyledAccountBalanceWalletIconBase = styled(AccountBalanceWalletIcon)`
  color: ${({ theme }) => theme.palette.type === 'dark'
    ? 'white'
    : 'rgba(0, 0, 0, 0.54)'};
`;

const StyledAccountBalanceWalletIcon = styled(StyledAccountBalanceWalletIconBase)`
  font-size: 3.4rem;
`;

export default function AppSelectMode() {
  const [_mode, setMode] = useMode();

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  return (
    <StyledContainer maxWidth="sm">
      <Flex flexDirection="column" alignItems="center" gap={3}>
        <Logo width={130} />
        
        <Typography variant="h5" component="h1">
          <Trans>Select Your Client Mode</Trans>
        </Typography>

        <Grid container spacing={5} alignItems="stretch">
          <Grid xs={12} sm={6} item>
            <Card
              onSelect={() => handleModeChange(Mode.WALLET)}
              highlight={false}
              fullHeight
            >
              <StyledCardContent>
                <Flex flexDirection="column" gap={4} flexGrow={1} alignItems="center">
                  <Flex flexDirection="column" gap={1} alignItems="center">
                    <StyledAccountBalanceWalletIcon />

                    <Typography variant="h5" align="center">
                      <Trans>Wallet Mode</Trans>
                    </Typography>
                  </Flex>

                  <Flex flexDirection="column" gap={1.5} flexGrow={1}>
                    <Flex gap={1} alignItems="center">
                      <StyledCheckIcon color="primary" />
                      <Typography variant="body2">
                        <Trans>Store and Send XCH</Trans>
                      </Typography>
                    </Flex>
                    <Flex gap={1} alignItems="center">
                      <StyledCheckIcon color="primary" />
                      <Typography variant="body2">
                        <Trans>Manage CAT tokens</Trans>
                      </Typography>
                    </Flex>
                    <Flex gap={1} alignItems="center">
                      <StyledCheckIcon color="primary" />
                      <Typography variant="body2">
                        <Trans>Trade tokens</Trans>
                      </Typography>
                    </Flex>
                  </Flex>

                  <Button variant="outlined" fullWidth>
                    <Trans>Choose Wallet Mode</Trans>
                  </Button>
                </Flex>
              </StyledCardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} item>
            <Card 
              onSelect={() => handleModeChange(Mode.FARMING)}
              highlight={<Trans>Recommended</Trans>}
              fullHeight
            >
              <StyledCardContent>
                <Flex flexDirection="column" gap={4} alignItems="center">
                  <Flex flexDirection="column" gap={1} alignItems="center">
                    <StyledEcoIcon />

                    <Typography variant="h5" align="center">
                      <Trans>Farming Mode</Trans>
                    </Typography>
                  </Flex>

                  <Flex flexDirection="column" gap={1.5} flexGrow={1}>
                    <Flex gap={1} alignItems="center">
                      <StyledCheckIcon color="primary" />
                      <Typography variant="body2">
                        <Trans>Wallet Mode</Trans>
                      </Typography>
                      <StyledAccountBalanceWalletIconBase fontSize="small" />
                    </Flex>
                    <Flex gap={1} alignItems="center">
                      <StyledCheckIcon color="primary" />
                      <Typography variant="body2">
                        <Trans>Create &amp; Manage plots</Trans>
                      </Typography>
                    </Flex>
                    <Flex gap={1} alignItems="center">
                      <StyledCheckIcon color="primary" />
                      <Typography variant="body2">
                        <Trans>Join farming pools</Trans>
                      </Typography>
                    </Flex>
                    <Flex gap={1} alignItems="center">
                      <StyledCheckIcon color="primary" />
                      <Typography variant="body2">
                        <Trans>Runs the full node</Trans>
                      </Typography>
                    </Flex>
                  </Flex>

                  <Button variant="outlined" fullWidth>
                    <Trans>Choose Farming Mode</Trans>
                  </Button>
                </Flex>
              </StyledCardContent>
            </Card>
          </Grid>
        </Grid>

        <Tooltip title={<Trans>Settings are located at the upper right corner</Trans>}>
        <Typography>
          <Trans>You can always change your mode later in the settings</Trans>
          &nbsp;
          <StyledSettingsIcon fontSize="small" />
        </Typography>
        </Tooltip>
      </Flex>
    </StyledContainer>
  );
}
