import React, { useMemo } from 'react';
import { useForm, useFormContext, useFieldArray } from 'react-hook-form';
import { useToggle } from 'react-use';
import { Trans } from '@lingui/macro';
import {
  Amount,
  Back,
  Card,
  Flex,
  Form,
  Loading,
  More,
  Select
} from '@chia/core';
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Tab,
  Tabs,
  Typography,
} from '@material-ui/core';
import { Add, Remove } from '@material-ui/icons';
import { Wallet, WalletType } from '@chia/api';
import { useGetCatListQuery, useGetWalletsQuery } from '@chia/api-react';
import type CATToken from '../../../types/CATToken';
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
  tradeSide: 'buy' | 'sell';
  addRow: (() => void) | undefined;
  removeRow: (() => void) | undefined;
};

function NewOfferConditionRow(props: NewOfferConditionsRowProps) {
  const { namePrefix, item, tradeSide, addRow, removeRow, ...rest } = props;

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
        <AssetSelector
          name={`${namePrefix}.assetWalletId`}
          id={`${namePrefix}.assetWalletId`}
          tradeSide={tradeSide}
          defaultValue={undefined}
        />
      </Grid>
      <Grid item style={{paddingTop: '1em'}}>
        <More style={{}}>
          {({ onClose }) => (
            <Box>
              {addRow && (
                <MenuItem
                  onClick={() => {
                    onClose();
                    addRow();
                  }}
                >
                  <ListItemIcon>
                    <Add fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="inherit" noWrap>
                    <Trans>Add Offer Condition</Trans>
                  </Typography>
                </MenuItem>
              )}
              {removeRow && (
                <MenuItem
                  onClick={() => {
                    onClose();
                    removeRow();
                  }}
                >
                  <ListItemIcon>
                    <Remove fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="inherit" noWrap>
                    <Trans>Remove Offer Condition</Trans>
                  </Typography>
                </MenuItem>
              )}
            </Box>
          )}
        </More>
      </Grid>
    </Flex>
  );
}

type NewOfferConditionsPanelProps = {
  makerSide: 'buy' | 'sell';
};

function NewOfferConditionsPanel(props: NewOfferConditionsPanelProps) {
  const { makerSide } = props;
  const { control } = useFormContext();
  const { fields: makerFields, append: makerAppend, remove: makerRemove } = useFieldArray({
    control,
    name: 'makerRows',
  });
  const { fields: takerFields, append: takerAppend, remove: takerRemove } = useFieldArray({
    control,
    name: 'takerRows',
  });
  const { data: wallets, isLoading }: { data: Wallet[], isLoading: boolean} = useGetWalletsQuery();
  const { watch } = useFormContext();
  const makerRows: OfferRowData[] = watch('makerRows');
  const takerRows: OfferRowData[] = watch('takerRows');
  const { canAddMakerRow, canAddTakerRow } = useMemo(() => {
    console.log("running memo to calculate canAddMakerRow, canAddTakerRow");
    let canAddMakerRow = false;
    let canAddTakerRow = false;
    if (!isLoading) {
      let makerWalletIds: Set<number> = new Set();
      let takerWalletIds: Set<number> = new Set();
      makerRows.forEach((makerRow) => {
        if (makerRow.assetWalletId) {
          makerWalletIds.add(makerRow.assetWalletId);
        }
      });
      takerRows.forEach((takerRow) => {
        if (takerRow.assetWalletId) {
          takerWalletIds.add(takerRow.assetWalletId);
        }
      });
      canAddMakerRow = makerWalletIds.size < wallets.length && makerRows.length < wallets.length;
      canAddTakerRow = takerWalletIds.size < wallets.length && takerRows.length < wallets.length;
    }

    return { canAddMakerRow, canAddTakerRow };
  }, [wallets, isLoading, makerRows, takerRows]);

  console.log(makerFields);
  console.log('canAddMakerRow, canAddTakerRow:');
  console.log(canAddMakerRow, canAddTakerRow);

  type Section = {
    side: string;
    fields: any[];
    canAddRow: boolean;
    namePrefix: string;
    headerTitle?: React.ReactElement;
  };
  const sections: Section[] = [
    { side: 'buy', fields: takerFields, namePrefix: 'takerRows', canAddRow: canAddTakerRow },
    { side: 'sell', fields: makerFields, namePrefix: 'makerRows', canAddRow: canAddMakerRow },
  ];

  if (makerSide === 'sell') {
    sections.reverse();
  }

  sections[0].headerTitle = sections[0].side === 'buy' ? <Trans>You will buy</Trans> : <Trans>You will sell</Trans>;
  sections[1].headerTitle = <Trans>In exchange for</Trans>

  return (
    <Flex flexDirection="column" gap={3}>
      {sections.map((section, sectionIndex) => (
        <>
          <Typography variant="h6">{section.headerTitle}</Typography>
          {section.fields.map((field, fieldIndex) => (
            <NewOfferConditionRow
              key={field.id}
              namePrefix={`${section.namePrefix}[${fieldIndex}]`}
              item={{ amount: field.amount, assetWalletId: field.assetWalletId }}
              tradeSide={section.side}
              addRow={section.canAddRow ? (() => { section.side === 'buy' ? takerAppend({ amount: '', assetWalletId: '' }) : makerAppend({ amount: '', assetWalletId: '' }) }) : undefined }
              removeRow={
                section.fields.length > 1 ?
                  () => { section.side === 'buy' ? takerRemove(fieldIndex) : makerRemove(fieldIndex) } :
                  undefined
              }
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
  id: string;
  tradeSide: 'buy' | 'sell';
  defaultValue: any;
}

type AssetSelection = {
  walletId: number;
  name: string;
  symbol: string;
  displayName: string;
  tail?: string;
}

function buildAssetSelectorList(wallets: Wallet[], catList: CATToken[], rows: OfferRowData[], selectedWalletId: number): AssetSelection[] {
  const list: AssetSelection[] = [];
  const usedWalletIds: Set<number> = new Set();

  rows.map(row => {
    if (row.assetWalletId !== undefined && row.assetWalletId !== selectedWalletId) {
      usedWalletIds.add(row.assetWalletId);
    }
  });

  wallets.map(wallet => {
    const walletId: number = wallet.id;
    let name: string | undefined;
    let symbol: string | undefined;
    let tail: string | undefined;

    if (usedWalletIds.has(walletId)) {
      return;
    }

    if (wallet.type === WalletType.STANDARD_WALLET) {
      name = 'Chia';
      symbol = 'XCH';
    }
    else if (wallet.type === WalletType.CAT) {
      name = wallet.name;
      tail = wallet.meta.tail;
      const cat = catList.find(cat => cat.assetId === tail);

      if (cat) {
        symbol = cat.symbol;
      }
    }

    if (name && symbol) {
      const displayName = `${name} (${symbol})`;
      list.push({ walletId, name, symbol, displayName, tail });
    }
  });
  return list;
}

function AssetSelector(props: AssetSelectorProps): JSX.Element {
  const { name, id, tradeSide, defaultValue, ...rest } = props;
  const { data: wallets, isLoading } = useGetWalletsQuery();
  const { data: catList = [], isLoading: isCatListLoading } = useGetCatListQuery();
  const { getValues, watch } = useFormContext();
  const rows = watch(tradeSide === 'buy' ? 'takerRows' : 'makerRows');
  const selectedWalletId = getValues(id);
  const options: AssetSelection[] = useMemo(() => {
    if (isLoading || isCatListLoading) {
      return [];
    }
    return buildAssetSelectorList(wallets, catList, rows, selectedWalletId);
  }, [wallets, catList, rows]);

  async function handleSelection(selectedWalletId: number) {
    console.log("handleSelection: " + selectedWalletId);
  }

  return (
    // Form control with popup selection of assets
    <FormControl variant="filled" fullWidth>
      <InputLabel required focused>
        <Trans>Asset Type</Trans>
      </InputLabel>
      <Select name={name} id={id} defaultValue={defaultValue || ''}>
        {options.map((option) => (
          <MenuItem
            value={option.walletId}
            key={option.walletId}
            onClick={() => handleSelection(option.walletId)}
          >
            <Trans>{option.displayName}</Trans>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

type NewOfferViewProps = {
};

type OfferRowData = {
  amount: number
  assetWalletId: number | undefined; // undefined if no selection made
}

type FormData = {
  makerRows: OfferRowData[];
  takerRows: OfferRowData[];
};

function NewOfferView(props: NewOfferViewProps): JSX.Element {
  const defaultValues = {
    makerRows: [{ amount: 0, assetWalletId: undefined }],
    takerRows: [{ amount: 0, assetWalletId: undefined }],
  };
  const methods = useForm<FormData>({
    shouldUnregister: false,
    defaultValues,
  });
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
