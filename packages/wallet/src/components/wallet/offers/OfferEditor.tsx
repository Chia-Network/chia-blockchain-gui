import React from 'react';
import { useForm } from 'react-hook-form';
import { Trans } from '@lingui/macro';
import {
  Back,
  CardStep,
  Flex,
  Form
} from '@chia/core';
import {
  Box,
  Button,
  Divider,
  Grid,
  Tab,
  Tabs
} from '@material-ui/core';
import type OfferRowData from './OfferRowData';
import OfferEditorConditionsPanel from './OfferEditorConditionsPanel';
import styled from 'styled-components';
import fs from 'fs';

const StyledTabPanel = styled.div`
  padding: ${({ theme }) => `${theme.spacing(3)}px`};
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
    makerRows: [{ amount: 0, assetWalletId: undefined }],
    takerRows: [{ amount: 0, assetWalletId: undefined }],
  };
  const methods = useForm<FormData>({
    shouldUnregister: false,
    defaultValues,
  });
  const { watch, setValue } = methods;
  const selectedTab = watch('selectedTab');

  function handleTabChange(event: React.ChangeEvent<{}>, newValue: number) {
    setValue('selectedTab', newValue);
  };

  async function onSubmit(formData: FormData) {
    console.log('submit');
    console.log(formData);
    // const dialogOptions = {};
    // const result = await window.remote.dialog.showSaveDialog(dialogOptions);
    // const { filePath } = result;
    // console.log('filePath: ', filePath);
    // try {
    //   fs.writeFileSync(filePath, 'Hello World!');
    // }
    // catch (err) {
    //   console.error(err);
    // }
    // const offer = {};
    // for (const trade of trades) {
    //   if (trade.side === 'buy') {
    //     offer[trade.wallet_id] = trade.amount;
    //   } else {
    //     offer[trade.wallet_id] = -trade.amount;
    //   }
    // }
  }

  function handleReset() {
    methods.reset();
  }

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <CardStep step={1} title={<Trans>Choose the Type of Offer to Create</Trans>}>
        <Flex flexDirection="column" flexGrow={1}>
          <Box>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
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
        <Flex justifyContent='flex-end' gap={3}>
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
      </CardStep>
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
