import React from 'react';
import { Trans } from '@lingui/macro';
import { useGetAllTradesQuery } from '@chia/api-react';
import { Back, Card, Dropzone, Flex } from '@chia/core';
import { Grid } from '@material-ui/core';

function DropView() {
  // const dispatch = useDispatch();
  // const parsing_state = useSelector((state) => state.trade_state.parsing_state);
  // const isParsing = parsing_state === parsingStatePending;

  function handleDrop(acceptedFiles: [File]) {
    const offerFilePath: string = acceptedFiles[0].path;
    const offerName: string = offerFilePath.replace(/^.*[/\\]/, '');

    // dispatch(offerParsingName(offer_name, offer_file_path));
    // dispatch(parse_trade_action(offer_file_path));
    // dispatch(parsingStarted());
  }
  const isParsing = false;

  return (
    <Card title={<Trans>Select Offer</Trans>}>
      <Dropzone onDrop={handleDrop} processing={isParsing}>
        <Trans>Drag and drop offer file</Trans>
      </Dropzone>
    </Card>
  );
};

export function DisplayWalletOfferView() {
  const { data, isLoading } = useGetAllTradesQuery();

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5" to="/dashboard/wallets">
            <Trans>View an Offer</Trans>
          </Back>
        </Flex>
          <DropView />
      </Flex>
    </Grid>
  );
}