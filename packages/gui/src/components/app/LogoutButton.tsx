import { Tooltip, useAuth } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { Button } from '@mui/material';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logOut } = useAuth();
  const ButtonStyle = {
    minWidth: 0,
    width: '40px',
    minHeight: '40px',
    borderRadius: '8px',
  };

  const handleLogout = useCallback(async () => {
    await logOut();

    navigate('/');
  }, [logOut, navigate]);

  return (
    <Tooltip title={<Trans>Log Out</Trans>}>
      <Button
        variant="text"
        onClick={handleLogout}
        color="secondary"
        size="small"
        data-testid="AppStatusHeader-log-out"
        sx={ButtonStyle}
      >
        <LogoutIcon color="info" />
      </Button>
    </Tooltip>
  );
}
