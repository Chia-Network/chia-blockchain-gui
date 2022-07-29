import React from 'react';
import { Trans } from '@lingui/macro';
import {
  Back,
  Card,
  Dropzone,
  Flex,
  useOpenDialog,
  useSerializedNavigationState,
  useShowError,
} from '@chia/core';
import { Button, Grid, Typography } from '@mui/material';
import { useGetOfferSummaryMutation } from '@chia/api-react';
import { type OfferSummaryRecord } from '@chia/api';
import OfferDataEntryDialog from './OfferDataEntryDialog';
import { offerContainsAssetOfType } from './utils';
import fs, { Stats } from 'fs';
import { IpcRenderer } from 'electron';
import { useHotkeys } from 'react-hotkeys-hook';

function SelectOfferFile() {
  const { navigate } = useSerializedNavigationState();
  const [getOfferSummary] = useGetOfferSummaryMutation();
  const openDialog = useOpenDialog();
  const errorDialog = useShowError();
  const [isParsing, setIsParsing] = React.useState<boolean>(false);

  function parseOfferData(
    data: string,
  ): [
    offerData: string | undefined,
    leadingText: string | undefined,
    trailingText: string | undefined,
  ] {
    // Parse raw offer data looking for the bech32-encoded offer data and any surrounding text.
    const matches = data.match(
      /(?<leading>.*)(?<offer>offer1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)(?<trailing>.*)/s,
    );
    return [
      matches?.groups?.offer,
      matches?.groups?.leading,
      matches?.groups?.trailing,
    ];
  }

  async function parseOfferSummary(
    rawOfferData: string,
    offerFilePath: string | undefined,
  ) {
    const [offerData /*, leadingText, trailingText*/] =
      parseOfferData(rawOfferData);
    let offerSummary: OfferSummaryRecord | undefined;

    if (offerData) {
      const { data: response } = await getOfferSummary(offerData);
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

  async function handleOpen(offerFilePath: string) {
    async function continueOpen(stats: Stats) {
      try {
        if (stats.size > 1024 * 1024) {
          errorDialog(new Error('Offer file is too large (> 1MB)'));
        } else {
          const offerData = fs.readFileSync(offerFilePath, 'utf8');

          await parseOfferSummary(offerData, offerFilePath);
        }
      } catch (e) {
        errorDialog(e);
      } finally {
        setIsParsing(false);
      }
    }

    setIsParsing(true);

    fs.stat(offerFilePath, (err, stats) => {
      if (err) {
        errorDialog(err);
      } else {
        continueOpen(stats);
      }
    });
  }

  async function handleDrop(acceptedFiles: [File]) {
    if (acceptedFiles.length !== 1) {
      errorDialog(new Error('Please drop one offer file at a time'));
    } else {
      handleOpen(acceptedFiles[0].path);
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
    const dialogOptions = {
      filters: [{ name: 'Offer Files', extensions: ['offer'] }],
    } as Electron.OpenDialogOptions;
    const ipcRenderer: IpcRenderer = (window as any).ipcRenderer;
    const { canceled, filePaths } = await ipcRenderer.invoke(
      'showOpenDialog',
      dialogOptions,
    );
    if (!canceled && filePaths?.length) {
      handleOpen(filePaths[0]);
    }
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
  const hotKey = isMac ? 'cmd+v' : 'ctrl+v';

  useHotkeys(hotKey, () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        pasteParse(text);
      })
      .catch((err) => {
        console.log('Error during paste from clipboard', err);
      });
  });

  return (
    <Card>
      <Flex justifyContent="flex-end">
        <Flex flexDirection="row" gap={3}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handlePasteOfferData}
          >
            <Trans>Paste Offer Data</Trans>
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSelectOfferFile}
          >
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
            {isMac ? (
              <Trans>or Paste (⌘V) an Offer blob</Trans>
            ) : (
              <Trans>or Paste (Ctrl-V) an Offer blob</Trans>
            )}
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
