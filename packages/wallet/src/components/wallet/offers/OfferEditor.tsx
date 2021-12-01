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
  Tab,
  Tabs,
  Typography
} from '@material-ui/core';
import type OfferRowData from './OfferRowData';
import WalletType from '../../../constants/WalletType';
import OfferEditorConditionsPanel from './OfferEditorConditionsPanel';
import styled from 'styled-components';
import { chia_to_mojo, colouredcoin_to_mojo } from '../../../util/chia';
import fs from 'fs';

const StyledTabPanel = styled.div`
  padding: ${({ theme }) => `${theme.spacing(4)}px`};
`;

type TabPanelContainerProps = {
  children: React.ReactNode;
  index: number;
  value: number;
};

function TabPanelContainer(props: TabPanelContainerProps) {
  const { children, value, index } = props;
  return (
    <StyledTabPanel
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </StyledTabPanel>
  );
}

type FormData = {
  selectedTab: number;
  makerRows: OfferRowData[];
  takerRows: OfferRowData[];
};

function OfferEditorView(): JSX.Element {
  const defaultValues: FormData = {
    selectedTab: 0,
    makerRows: [{ amount: 0, assetWalletId: undefined, walletType: WalletType.STANDARD_WALLET }],
    takerRows: [{ amount: 0, assetWalletId: undefined, walletType: WalletType.STANDARD_WALLET }],
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
      const { offer: offerData } = response;
      const dialogOptions = {};
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
      <Flex flexDirection="column">
        <CardHeader
          title={<Typography variant="h6"><Trans>Choose the Type of Offer to Create</Trans></Typography>}
        />
        <Divider />
        <Flex flexDirection="column" gap={3}>
          <Flex flexDirection="column" flexGrow={1}>
            <Box>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label={<Trans>Buy</Trans>} />
                <Tab label={<Trans>Sell</Trans>} />
              </Tabs>
              <Divider />
            </Box>
            <TabPanelContainer value={selectedTab} index={0}>
              <OfferEditorConditionsPanel makerSide="buy" />
            </TabPanelContainer>
            <TabPanelContainer value={selectedTab} index={1}>
              <OfferEditorConditionsPanel makerSide="sell" />
            </TabPanelContainer>
          </Flex>
        </Flex>
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
    </Form>
  );
}

export function CreateOfferEditorView() {
  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5" to="/dashboard/wallets/offers/manage">
            <Trans>Create an Offer</Trans>
          </Back>
        </Flex>
        <OfferEditorView />
      </Flex>
    </Grid>
  );
}
