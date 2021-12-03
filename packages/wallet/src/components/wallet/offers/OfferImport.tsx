import React from 'react';
import { useHistory } from 'react-router-dom';
import { Trans } from '@lingui/macro';
import { useGetAllOffersQuery } from '@chia/api-react';
import { AlertDialog, Back, Card, Dropzone, Flex, useShowError } from '@chia/core';
import { Button, Grid, Typography } from '@material-ui/core';
import { useGetOfferSummaryMutation } from '@chia/api-react';
import { OfferTradeRecord } from '@chia/api';
import fs from 'fs';

function SelectOfferFile() {
  const history = useHistory();
  const [getOfferSummary] = useGetOfferSummaryMutation();
  const errorDialog = useShowError();
  const [isParsing, setIsParsing] = React.useState<boolean>(false);

  async function handleOpen(offerFilePath: string) {
    async function continueOpen(stats) {
      try {
        console.log(stats);
        if (stats.size > 1024 * 1024) {
          errorDialog(new Error("Offer file is too large (> 1MB)"));
        }
        else {
          const offerData = fs.readFileSync(offerFilePath, 'utf8');
          console.log("offerData:", offerData);
          const { data: response } = await getOfferSummary(offerData);
          console.log("response: ");
          console.log(response);
          const { summary: offerSummary, success } = response;
          if (!success) {
            errorDialog(new Error("Could not parse offer file"));
          }
          else {
            history.push('/dashboard/wallets/offers/view', { offerSummary, offerFilePath });
          }
        }
      }
      catch (e) {
        errorDialog(e);
      }
      finally {
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
      errorDialog(new Error("Please drop one offer file at a time"));
    }
    else {
      handleOpen(acceptedFiles[0].path);
    }
  }

  async function handleSelectOfferFile() {
    const dialogOptions = { filters: [{ name: 'Offer Files', extensions: ['offer'] }] } as Electron.OpenDialogOptions;
    const { canceled, filePaths } = await window.remote.dialog.showOpenDialog(dialogOptions);
    if (!canceled && filePaths?.length) {
      handleOpen(filePaths[0]);
    }
  }

  return (
    <Card>
      <Flex justifyContent="space-between">
        <Typography variant="subtitle1"><Trans>Drag & drop an offer file below to view its details</Trans></Typography>
        <Button
              variant="outlined"
              color="primary"
              onClick={handleSelectOfferFile}
            >
              <Trans>Select Offer File</Trans>
            </Button>
      </Flex>
      <Dropzone maxFiles={1} onDrop={handleDrop} processing={isParsing}>
        <Trans>Drag and drop offer file</Trans>
      </Dropzone>
    </Card>
  );
};

export function OfferImport() {
  const { data, isLoading } = useGetAllOffersQuery();

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5" to="/dashboard/wallets/offers/manage">
            <Trans>View an Offer</Trans>
          </Back>
        </Flex>
        <SelectOfferFile />
      </Flex>
    </Grid>
  );
}