import fs, { Stats } from 'fs';

import { Color, Dropzone, Flex, useShowError } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Box, Card, Typography } from '@mui/material';
import React, { useState } from 'react';
import { FileWithPath } from 'react-dropzone';

import usePaste from '../../hooks/usePaste';
import { isMac } from '../../util/utils';

function parseSignedMessageData(text: string): {
  message: string;
  signature: string;
  pubkey: string;
  signing_mode: string;
  address?: string;
} {
  try {
    const data = JSON.parse(text);
    if (data.message && data.signature && data.pubkey && data.signing_mode) {
      return data;
    }
  } catch (e) {
    // ignore
  }

  const message = text.match(/Message: (.*)/)?.[1];
  const pubkey = text.match(/Public Key: (.*)/)?.[1];
  const signature = text.match(/Signature: (.*)/)?.[1];
  const signingMode = text.match(/Signing Mode: (.*)/)?.[1];
  const address = text.match(/Address: (.*)/)?.[1]; // Optional

  if (!message || !pubkey || !signature || !signingMode) {
    throw new Error('Invalid signed message data');
  }

  // If message contains only hex characters, convert to utf8
  // if (/^[0-9a-fA-F]+$/.test(message)) {
  //   const hex = message;
  //   const utf8 = Buffer.from(hex, 'hex').toString('utf8');
  //   return { message: utf8, pubkey, signature, address };
  // }

  return { message, pubkey, signature, signing_mode: signingMode, address };
}

function Background(props) {
  const { children } = props;
  return (
    <Box position="relative" p={3}>
      <Box
        position="absolute"
        left={0}
        right={0}
        top={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        marginY={-2}
      />
      {children}
    </Box>
  );
}

export type VerifyMessageImportProps = {
  onImport: (imported: { message: string; signature: string; pubkey: string; address?: string }) => void;
};

export default function VerifyMessageImport(props: VerifyMessageImportProps) {
  const { onImport } = props;
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const showError = useShowError();
  const prompt = (
    <Trans>
      Drag & Drop a Signed Message File,
      <br /> Paste ({isMac() ? '⌘' : 'Ctrl-'}V)
    </Trans>
  );

  async function handleOpen(path: string) {
    async function continueOpen(stats: Stats) {
      try {
        if (stats.size > 10 * 1024 * 1024) {
          throw new Error(t`Signed message file is too large (> 10MB)`);
        }

        const data = fs.readFileSync(path, 'utf8');

        const parsed = parseSignedMessageData(data);
        onImport(parsed);
      } catch (e) {
        showError(e);
      } finally {
        setIsParsing(false);
      }
    }

    setIsParsing(true);

    fs.stat(path, (err, stats) => {
      if (err) {
        showError(err);
        setIsParsing(false);
      } else {
        continueOpen(stats);
      }
    });
  }

  async function handleDrop(acceptedFiles: [FileWithPath]) {
    if (acceptedFiles.length !== 1) {
      showError(new Error('Please drop one offer file at a time'));
    } else if (acceptedFiles[0].path === undefined) {
      showError(new Error('Unable to resolve file path'));
    } else {
      handleOpen(acceptedFiles[0].path);
    }
  }

  function pasteParse(text: string) {
    try {
      setIsParsing(true);
      const parsed = parseSignedMessageData(text);
      onImport(parsed);
    } catch (e) {
      showError(e);
    } finally {
      setIsParsing(false);
    }
  }

  usePaste({ callback: pasteParse });

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <Dropzone maxFiles={1} onDrop={handleDrop} processing={isParsing} background={Background}>
        <Flex flexDirection="column" alignItems="center">
          <Typography color="textSecondary" variant="h6" textAlign="center">
            {prompt}
          </Typography>
          <Typography color="textSecondary" textAlign="center">
            <Trans>
              or <span style={{ color: Color.Green[400] }}>browse</span> on your computer
            </Trans>
          </Typography>
        </Flex>
      </Dropzone>
    </Card>
  );
}
