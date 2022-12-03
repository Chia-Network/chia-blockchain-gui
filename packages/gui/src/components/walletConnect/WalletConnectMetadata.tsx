import React from 'react';
import { Trans } from '@lingui/macro';
import { Link as LinkIcon } from '@mui/icons-material';
import { blue } from '@mui/material/colors';
import { Avatar, IconButton, Typography } from '@mui/material';
import { Flex } from '@chia-network/core';
import type WalletConnectMetadataType from '../../@types/WalletConnectMetadata';
import useOpenExternal from '../../hooks/useOpenExternal';

export type WalletConnectMetadataProps = {
  metadata?: WalletConnectMetadataType;
};

export default function WalletConnectMetadata(props: WalletConnectMetadataProps) {
  const { metadata } = props;
  const { name = <Trans>Unknown Application</Trans>, description, url, icons = [] } = metadata ?? {};

  const openExternal = useOpenExternal();

  const icon = icons[0];

  function handleOpenLink() {
    if (url) {
      openExternal(url);
    }
  }

  return (
    <Flex gap={2}>
      {icon && <Avatar src={icon} sx={{ bgcolor: blue[500] }} variant="rounded" />}
      <Flex flexDirection="column">
        <Typography>
          {name}{' '}
          {url && (
            <IconButton aria-label="openLink" size="small" onClick={handleOpenLink}>
              <LinkIcon fontSize="inherit" />
            </IconButton>
          )}
        </Typography>{' '}
        {description && (
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
        )}
      </Flex>
    </Flex>
  );
}
