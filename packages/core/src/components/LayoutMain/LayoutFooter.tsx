import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import walletPackageJson from '../../../package.json';
import useAppVersion from '../../hooks/useAppVersion';
import Flex from '../Flex';

const { productName } = walletPackageJson;

const FAQ = styled.a`
  color: rgb(128, 160, 194);
`;

const SendFeedback = styled.a`
  color: rgb(128, 160, 194);
`;

async function openFAQURL(): Promise<void> {
  try {
    const { shell } = window as any;
    await shell.openExternal('https://github.com/Chia-Network/chia-blockchain/wiki/FAQ');
  } catch (e) {
    console.error(e);
  }
}

async function openSendFeedbackURL(): Promise<void> {
  try {
    const { shell } = window as any;
    await shell.openExternal('https://feedback.chia.net/lightwallet');
  } catch (e) {
    console.error(e);
  }
}

export default function LayoutFooter() {
  const { version } = useAppVersion();

  return (
    <Flex flexDirection="row" flexGrow={1} justifyContent="space-between">
      <Typography color="textSecondary" variant="body2">
        {productName} {version}
      </Typography>
      <Flex gap={2}>
        <FAQ onClick={openFAQURL}>
          <Trans>FAQ</Trans>
        </FAQ>
        <SendFeedback onClick={openSendFeedbackURL}>
          <Trans>Send Feedback</Trans>
        </SendFeedback>
      </Flex>
    </Flex>
  );
}
