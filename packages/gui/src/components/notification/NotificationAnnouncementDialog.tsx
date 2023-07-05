import { Flex, Link, DialogActions } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import React from 'react';

import useOpenUnsafeLink from '../../hooks/useOpenUnsafeLink';

export type NotificationAnnouncementDialogProps = {
  notification: Notification;
  onClose?: (value?: any) => void;
};

export default function NotificationAnnouncementDialog(props: NotificationAnnouncementDialogProps) {
  const { notification, onClose } = props;

  const openUnsafeLink = useOpenUnsafeLink();

  function handleClose() {
    onClose?.(false);
  }

  const message = 'message' in notification ? notification.message : undefined;
  const url = 'url' in notification ? notification.url : undefined;
  const from = 'from' in notification ? notification.from : undefined;

  async function handleURLClick() {
    openUnsafeLink(url);
  }

  return (
    <Dialog onClose={handleClose} maxWidth="sm" fullWidth open>
      <DialogTitle>
        <Flex flexDirection="row" gap={1}>
          <Typography variant="h6">
            <Trans>Announcement</Trans>
          </Typography>
        </Flex>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" gap={3}>
          {from ? (
            <Flex flexDirection="column" gap={1} minWidth={0}>
              <Typography noWrap>
                <Trans>From</Trans>
              </Typography>
              <Typography color="textSecondary">{from}</Typography>
            </Flex>
          ) : null}

          {message ? (
            <Flex flexDirection="column" gap={1} minWidth={0}>
              <Typography noWrap>
                <Trans>Message</Trans>
              </Typography>
              <Typography color="textSecondary">{message}</Typography>
            </Flex>
          ) : null}

          {url ? (
            <Flex flexDirection="column" gap={1} minWidth={0}>
              <Typography noWrap>
                <Trans>URL</Trans>
              </Typography>
              <Typography>
                <Link href={url} target="_blank" onClick={handleURLClick}>
                  {url}
                </Link>
              </Typography>
            </Flex>
          ) : null}
        </Flex>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined" autoFocus>
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
