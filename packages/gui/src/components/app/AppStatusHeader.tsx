import React from 'react';
import { Trans } from '@lingui/macro';
import { Flex, StateColor, StateIndicatorDot, useMode, Mode } from '@chia/core';
import { useGetFullNodeConnectionsQuery } from '@chia/api-react';
import { ButtonGroup, Button, Popover, Typography } from '@mui/material';
import { useTheme } from '@mui/styles';
import { WalletConnections, WalletStatus } from '@chia/wallets';
import Connections from '../fullNode/FullNodeConnections';

export default function AppStatusHeader() {
  const theme = useTheme();
  const [mode] = useMode();
  const { data: connectionsFN } = useGetFullNodeConnectionsQuery(
    {},
    { pollingInterval: 10000 },
  );

  const [anchorElFN, setAnchorElFN] = React.useState<HTMLButtonElement | null>(
    null,
  );
  const [anchorElW, setAnchorElW] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const handleClickFN = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElFN(event.currentTarget);
  };

  const handleCloseFN = () => {
    setAnchorElFN(null);
  };

  const openFN = Boolean(anchorElFN);

  const handleClickW = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElW(event.currentTarget);
  };

  const handleCloseW = () => {
    setAnchorElW(null);
  };

  const openW = Boolean(anchorElW);

  const colorFN =
    connectionsFN?.length >= 1
      ? StateColor.SUCCESS
      : theme.palette.text.secondary;

  return (
    <ButtonGroup variant="outlined" color="secondary" size="small">
      <Button onClick={handleClickFN}>
        <Flex gap={1} alignItems="center">
          <Flex>
            <StateIndicatorDot color={colorFN} />
          </Flex>
          <Flex>
            <Trans>Full Node</Trans>
          </Flex>
        </Flex>
      </Button>
      <Popover
        id={openFN ? 'simple-popover' : undefined}
        open={openFN}
        anchorEl={anchorElFN}
        onClose={handleCloseFN}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          horizontal: 'right',
        }}
      >
        {mode === Mode.FARMING ? (
          <Connections />
        ) : (
          <Typography>
            <Trans>
              Full node connections are not available because you are using
              wallet mode. You can turn on the farming mode in settings.
            </Trans>
          </Typography>
        )}
      </Popover>
      <Button onClick={handleClickW}>
        <Flex gap={1} alignItems="center">
          <WalletStatus indicator hideTitle />
          <Trans>Wallet</Trans>
        </Flex>
      </Button>
      <Popover
        id={openW ? 'simple-popover' : undefined}
        open={openW}
        anchorEl={anchorElW}
        onClose={handleCloseW}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          horizontal: 'right',
        }}
      >
        <div style={{ minWidth: '800px' }}>
          <WalletConnections walletId={1} />
        </div>
      </Popover>
    </ButtonGroup>
  );
}
