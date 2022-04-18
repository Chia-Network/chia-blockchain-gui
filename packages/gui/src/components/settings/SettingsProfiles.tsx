import React, { useEffect, useState } from 'react';
import { Trans } from '@lingui/macro';
import { Typography } from "@mui/material";
import { useNavigate } from 'react-router-dom';

export default function SettingsProfiles() {
  const navigate = useNavigate();
  const [didWallets] = useState([]);

  useEffect(() => {
    if (didWallets.length) {
      navigate(`/dashboard/settings/profiles/${didWallets[0].id}`);
    }
  }, [didWallets]);

  return (
    <Typography>
      <Trans>Settings Profile</Trans>
    </Typography>
  );
}
