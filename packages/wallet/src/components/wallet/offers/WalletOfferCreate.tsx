import React from 'react';
import { useForm, useFormContext, useFieldArray } from 'react-hook-form';
import { useToggle } from 'react-use';
import { Trans } from '@lingui/macro';
import { Amount, Back, Card, Flex, Form, Select } from '@chia/core';
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Tab,
  Tabs
} from '@material-ui/core';
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

type NewOfferConditionsRowProps = {
  namePrefix: string;
  item: OfferRowData;
};

function NewOfferConditionRow(props: NewOfferConditionsRowProps) {
  const { namePrefix, item, ...rest } = props;
  const { register } = useFormContext();

  return (
    <Flex flexDirection="row" gap={3} {...rest}>
      <Grid xs={6} item>
        <Amount
          variant="filled"
          color="secondary"
          label={<Trans>Amount</Trans>}
          defaultValue={item.amount}
          name={`${namePrefix}.amount`}
          required
          fullWidth
        />
      </Grid>
      <Grid xs={6} item>
        <AssetSelector name={`${namePrefix}.assetType`}
        />
      </Grid>
    </Flex>
  );
}

type NewOfferConditionsPanelProps = {
  makerSide: 'buy' | 'sell';
};

function NewOfferConditionsPanel(props: NewOfferConditionsPanelProps) {
  const { makerSide } = props;
  const { control, register } = useFormContext();
  const { fields: makerFields, append: makerAppend, remove: makerRemove } = useFieldArray({
    control,
    name: 'makerRows',
  });
  const { fields: takerFields, append: takerAppend, remove: takerRemove } = useFieldArray({
    control,
    name: 'takerRows',
  });

  console.log(makerFields);

  const sections = [
    { fields: takerFields, namePrefix: 'takerRows' },
    { fields: makerFields, namePrefix: 'makerRows' },
  ];

  if (makerSide === 'sell') {
    // reverse sections
    sections.reverse();
  }

  return (
    <Flex flexDirection="column" gap={3}>
      {sections.map((section, sectionIndex) => (
        <>
          {section.fields.map((field, fieldIndex) => (
            <NewOfferConditionRow
              key={field.id}
              namePrefix={`${section.namePrefix}[${fieldIndex}]`}
              item={{ amount: field.amount, assetType: field.assetType }}
            />
          ))}
          {sectionIndex !== (sections.length - 1) && (
            <Divider />
          )}
        </>
      ))}
    </Flex>
  );
}

type AssetSelectorProps = {
  name: string;
}

function AssetSelector(props: AssetSelectorProps): JSX.Element {
  const { name, ...rest } = props;
  const [open, toggleOpen] = useToggle(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    console.log("handleClick");
    setAnchorEl(event.currentTarget);
    toggleOpen();
  }

  function handleClose() {
    setAnchorEl(null);
    toggleOpen();
  };

  return (
    // Form control with popup selection of assets
    <FormControl variant="filled" fullWidth>
      <InputLabel required focused>
        <Trans>Asset Type</Trans>
      </InputLabel>
      <Select name={name} {...rest}>
        <MenuItem value="spacebucks" key="spacebucks">
          <Trans>Spacebucks</Trans>
        </MenuItem>
        <MenuItem value="marmot" key="marmot">
          <Trans>Marmot</Trans>
        </MenuItem>
        <MenuItem value="chia" key="chia">
          <Trans>Chia</Trans>
        </MenuItem>
      </Select>
    </FormControl>
  );
}

type NewOfferViewProps = {
  initialAssetType: string;
};

type OfferRowData = {
  amount: number
  assetType: string;
}

type FormData = {
  makerRows: OfferRowData[];
  takerRows: OfferRowData[];
};

function NewOfferView(props: NewOfferViewProps): JSX.Element {
  const { initialAssetType } = props;
  const defaultValues = {
    makerRows: [{ amount: 111, assetType: initialAssetType || 'chia' }, { amount: 345, assetType: initialAssetType || 'spacebucks' }],
    takerRows: [{ amount: 0, assetType: 'marmot' }],
  };
  const methods = useForm<FormData>({
    shouldUnregister: false,
    defaultValues,
  });
  const { control } = methods;
  const [selectedTab, setSelectedTab] = React.useState(0);

  function handleTabChange(event: React.ChangeEvent<{}>, newValue: number) {
    setSelectedTab(newValue);
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
      <Card title={<Trans>New Offer</Trans>}>
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
            <NewOfferConditionsPanel makerSide="buy" />
          </TabPanelContainer>
          <TabPanelContainer value={selectedTab} index={1}>
            <NewOfferConditionsPanel makerSide="sell" />
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
      </Card>
    </Form>
  );
}

export function CreateWalletOfferView(props: NewOfferViewProps) {
  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5" to="/dashboard/wallets">
            <Trans>Create an Offer</Trans>
          </Back>
        </Flex>
        <NewOfferView {...props}/>
      </Flex>
    </Grid>
  );
}
