import React from 'react';
import { useForm } from 'react-hook-form';
import { Trans } from '@lingui/macro';
import {
  Back,
  Flex,
  Form
} from '@chia/core';
import { useCreateOfferForIdsMutation } from '@chia/api-react';
import {
  Box,
  Button,
  CardHeader,
  Divider,
  Grid,
  Typography
} from '@material-ui/core';
import type OfferRowData from './OfferRowData';
import { suggestedFilenameForOffer } from './utils';
import WalletType from '../../../constants/WalletType';
import OfferEditorConditionsPanel from './OfferEditorConditionsPanel';
import styled from 'styled-components';
import { chia_to_mojo, colouredcoin_to_mojo } from '../../../util/chia';
import fs from 'fs';

const StyledEditorBox = styled.div`
  padding: ${({ theme }) => `${theme.spacing(4)}px`};
`;

type FormData = {
  selectedTab: number;
  makerRows: OfferRowData[];
  takerRows: OfferRowData[];
};

function OfferEditor(): JSX.Element {
  const defaultValues: FormData = {
    selectedTab: 0,
    makerRows: [{ amount: '', assetWalletId: undefined, walletType: WalletType.STANDARD_WALLET }],
    takerRows: [{ amount: '', assetWalletId: undefined, walletType: WalletType.STANDARD_WALLET }],
  };
  const methods = useForm<FormData>({
    shouldUnregister: false,
    defaultValues,
  });
  const { watch, setValue } = methods;
  const selectedTab = watch('selectedTab');
  const [createOfferForIds] = useCreateOfferForIdsMutation();

  function handleTabChange(event: React.ChangeEvent<{}>, newValue: number) {
    setValue('selectedTab', newValue);
  };

  function updateOffer(offer: { [key: string]: number | string }, row: OfferRowData, debit: boolean) {
    const { amount, assetWalletId, walletType } = row;
    if (assetWalletId) {
      let mojoAmount = 0;
      if (walletType === WalletType.STANDARD_WALLET) {
        mojoAmount = Number.parseFloat(chia_to_mojo(amount));
      }
      else if (walletType === WalletType.CAT) {
        mojoAmount = Number.parseFloat(colouredcoin_to_mojo(amount));
      }
      offer[assetWalletId] = debit ? -mojoAmount : mojoAmount;
    }
    else {
      console.log('missing asset wallet id');
    }
  }

  async function onSubmit(formData: FormData) {
    console.log('submit');
    console.log(formData);
    const offer: { [key: string]: number | string } = {};
    formData.makerRows.forEach((row: OfferRowData) => {
      updateOffer(offer, row, true);
    });
    formData.takerRows.forEach((row: OfferRowData) => {
      updateOffer(offer, row, false);
    });
    console.log("offer:");
    console.log({ walletIdsAndAmounts: offer });
    const response = await createOfferForIds({ walletIdsAndAmounts: offer }).unwrap();
    console.log("response:");
    console.log(response);
    if (response.success === true) {
      const { offer: offerData, tradeRecord } = response;
      const dialogOptions = { defaultPath: suggestedFilenameForOffer(tradeRecord.summary) };
      const result = await window.remote.dialog.showSaveDialog(dialogOptions);
      const { filePath, canceled } = result;

      if (!canceled && filePath) {
        try {
          fs.writeFileSync(filePath, offerData);
        }
        catch (err) {
          console.error(err);
        }
      }
    }
  }

  function handleReset() {
    methods.reset();
  }

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Divider />
      <StyledEditorBox>
        <Flex flexDirection="column" rowGap={3} flexGrow={1}>
          <OfferEditorConditionsPanel makerSide="buy" />
          <Flex gap={3}>
            <Button
              variant="contained"
              color="secondary"
              type="reset"
              onClick={handleReset}
            >
              <Trans>Reset</Trans>
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
            >
              <Trans>Save Offer</Trans>
            </Button>
          </Flex>
        </Flex>
      </StyledEditorBox>
    </Form>
  );
}

export function CreateOfferEditor() {
  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5" to="/dashboard/wallets/offers/manage">
            <Trans>Create an Offer</Trans>
          </Back>
        </Flex>
        <OfferEditor />
      </Flex>
    </Grid>
  );
}
