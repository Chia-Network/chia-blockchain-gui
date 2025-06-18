import { type OfferSummaryRecord } from '@chia-network/api';
import { useGetOfferSummaryMutation } from '@chia-network/api-react';
import {
  Back,
  Card,
  Dropzone,
  Flex,
  useOpenDialog,
  useSerializedNavigationState,
  useShowError,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Grid, Typography } from '@mui/material';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import OfferDataEntryDialog from './OfferDataEntryDialog';
import { offerContainsAssetOfType } from './utils';

function SelectOfferFile() {
  const { navigate } = useSerializedNavigationState();
  const [getOfferSummary] = useGetOfferSummaryMutation();
  const openDialog = useOpenDialog();
  const errorDialog = useShowError();
  const [isParsing, setIsParsing] = React.useState<boolean>(false);

  function parseOfferData(
    data: string,
  ): [offerData: string | undefined, leadingText: string | undefined, trailingText: string | undefined] {
    // Parse raw offer data looking for the bech32-encoded offer data and any surrounding text.
    const matches = data.match(/(?<leading>.*)(?<offer>offer1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)(?<trailing>.*)/s);
    return [matches?.groups?.offer, matches?.groups?.leading, matches?.groups?.trailing];
  }

  async function parseOfferSummary(rawOfferData: string, offerFilePath: string | undefined) {
    const [offerData /* , leadingText, trailingText */] = parseOfferData(rawOfferData);
    let offerSummary: OfferSummaryRecord | undefined;

    if (offerData) {
      const { data: response } = await getOfferSummary({ offerData });
      const { summary, success } = response;

      if (success) {
        offerSummary = summary;
      }
    } else {
      console.warn('Unable to parse offer data');
    }

    if (offerSummary) {
      const navigationPath = offerContainsAssetOfType(offerSummary, 'singleton')
        ? '/dashboard/offers/view-nft'
        : '/dashboard/offers/view';

      navigate(navigationPath, {
        state: { offerData, offerSummary, offerFilePath, imported: true },
      });
    } else {
      errorDialog(new Error('Could not parse offer data'));
    }
  }

  async function handleOpen(file: File) {
    try {
      if (file.size > 1024 * 1024) {
        errorDialog(new Error('Offer file is too large (> 1MB)'));
        return;
      }

      setIsParsing(true);
      const offerData = await file.text();
      await parseOfferSummary(offerData, file.name);
    } catch (e) {
      errorDialog(e);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length !== 1) {
      errorDialog(new Error('Please drop one offer file at a time'));
    } else {
      handleOpen(acceptedFiles[0]);
    }
  }

  async function handlePasteOfferData() {
    const offerData = await openDialog(<OfferDataEntryDialog />);

    if (offerData) {
      setIsParsing(true);

      try {
        await parseOfferSummary(offerData, undefined);
      } catch (e) {
        errorDialog(e);
      } finally {
        setIsParsing(false);
      }
    }
  }

  async function handleSelectOfferFile() {
    const result = await window.appAPI.showOpenFileDialogAndRead({
      extensions: ['offer'],
    });

    if (!result) {
      return;
    }

    const { content, filename } = result;

    // convert string content to file
    const file = new File([content], filename, { type: 'application/offer' });
    handleOpen(file);
  }

  async function pasteParse(text: string) {
    try {
      await parseOfferSummary(text, undefined);
    } catch (e) {
      errorDialog(e);
    } finally {
      setIsParsing(false);
    }
  }

  const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
  const hotKey = isMac ? 'meta+v' : 'ctrl+v';

  useHotkeys(hotKey, () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        pasteParse(text);
      })
      .catch((err) => {
        console.error('Error during paste from clipboard', err);
      });
  });

  return (
    <Card>
      <Flex justifyContent="flex-end">
        <Flex flexDirection="row" gap={3}>
          <Button variant="outlined" color="secondary" onClick={handlePasteOfferData}>
            <Trans>Paste Offer Data</Trans>
          </Button>
          <Button variant="outlined" color="primary" onClick={handleSelectOfferFile}>
            <Trans>Select Offer File</Trans>
          </Button>
        </Flex>
      </Flex>
      <Dropzone maxFiles={1} onDrop={handleDrop} processing={isParsing}>
        <Flex flexDirection="column" alignItems="center">
          <Typography color="textSecondary" variant="h5">
            <Trans>Drag & Drop an Offer File</Trans>
          </Typography>
          <Typography color="textSecondary" variant="h6">
            {isMac ? <Trans>or Paste (⌘V) an Offer blob</Trans> : <Trans>or Paste (Ctrl-V) an Offer blob</Trans>}
          </Typography>
        </Flex>
      </Dropzone>
    </Card>
  );
}

export function OfferImport() {
  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5" to="/dashboard/offers/manage">
            <Trans>View an Offer</Trans>
          </Back>
        </Flex>
        <SelectOfferFile />
      </Flex>
    </Grid>
  );
}
