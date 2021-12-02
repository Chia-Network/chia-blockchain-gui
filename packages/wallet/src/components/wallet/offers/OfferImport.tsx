import React from 'react';
import { Trans } from '@lingui/macro';
import { useGetAllOffersQuery } from '@chia/api-react';
import { AlertDialog, Back, Card, Dropzone, Flex, useShowError } from '@chia/core';
import { Button, Grid, Typography } from '@material-ui/core';
import { useGetOfferSummaryMutation } from '@chia/api-react';
import fs from 'fs';

function SelectOfferFile() {
  // const dispatch = useDispatch();
  // const parsing_state = useSelector((state) => state.trade_state.parsing_state);
  // const isParsing = parsing_state === parsingStatePending;
  const [getOfferSummary] = useGetOfferSummaryMutation();
  const errorDialog = useShowError();
  const isParsing = false;

  async function handleOpen(offerFilePath: string) {
    errorDialog(new Error('Testing one two three'));
    // console.log('handleOpen', offerFilePath);
    // const offerData = fs.readFileSync(offerFilePath, 'utf8');
    // console.log("offerData: ");
    // console.log(offerData);

    // const summary = await getOfferSummary(offerData);
    // console.log("summary: ");
    // console.log(summary);
  }

  async function handleDrop(acceptedFiles: [File]) {
    handleOpen(acceptedFiles[0].path);
  }

  async function handleSelectOfferFile() {
    const { canceled, filePaths } = await window.remote.dialog.showOpenDialog({});
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
      <Dropzone onDrop={handleDrop} processing={isParsing}>
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