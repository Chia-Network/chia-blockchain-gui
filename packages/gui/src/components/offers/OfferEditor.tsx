import { WalletType } from '@chia-network/api';
import { useCreateOfferForIdsMutation } from '@chia-network/api-react';
import {
  Back,
  Button,
  Card,
  ButtonLoading,
  Flex,
  Form,
  useOpenDialog,
  useShowError,
  chiaToMojo,
  catToMojo,
} from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Grid } from '@mui/material';
import BigNumber from 'bignumber.js';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import useSuppressShareOnCreate from '../../hooks/useSuppressShareOnCreate';
import OfferEditorConditionsPanel from './OfferEditorConditionsPanel';
import OfferEditorConfirmationDialog from './OfferEditorConfirmationDialog';
import type OfferEditorRowData from './OfferEditorRowData';

/* ========================================================================== */
/*                                Offer Editor                                */
/* ========================================================================== */

type FormData = {
  selectedTab: number;
  makerRows: OfferEditorRowData[];
  takerRows: OfferEditorRowData[];
  fee: string;
};

type OfferEditorProps = {
  walletId?: number;
  walletType?: WalletType;
  onOfferCreated?: (obj: { offerRecord: any; offerData: any }) => void;
};

function defaultMakerRow(walletId?: number, walletType?: WalletType): OfferEditorRowData {
  return {
    amount: '',
    assetWalletId: walletId ?? 0,
    walletType: walletType ?? WalletType.STANDARD_WALLET,
    spendableBalance: new BigNumber(0),
  };
}

function OfferEditor(props: OfferEditorProps) {
  const { walletId, walletType, onOfferCreated = () => {} } = props;
  const navigate = useNavigate();
  const defaultValues: FormData = {
    selectedTab: 0,
    makerRows: [defaultMakerRow(walletId, walletType)],
    takerRows: [
      {
        amount: '',
        assetWalletId: 0,
        walletType: WalletType.STANDARD_WALLET,
        spendableBalance: new BigNumber(0),
      },
    ],
    fee: '',
  };
  const methods = useForm<FormData>({
    defaultValues,
  });
  const openDialog = useOpenDialog();
  const errorDialog = useShowError();
  const [suppressShareOnCreate] = useSuppressShareOnCreate();
  const [createOfferForIds] = useCreateOfferForIdsMutation();
  const [processing, setIsProcessing] = useState<boolean>(false);

  async function onSubmit(formData: FormData) {
    let offer: { [key: string]: BigNumber } = {};
    let missingAssetSelection = false;
    let missingAmount = false;
    let amountExceedsSpendableBalance = false;
    const feeInMojos = chiaToMojo(formData.fee ?? 0);

    formData.makerRows.forEach((row: OfferEditorRowData) => {
      offer = getUpdatedOffer(offer, row, true);
      if (row.assetWalletId === 0) {
        missingAssetSelection = true;
      } else if (!row.amount) {
        missingAmount = true;
      } else if (new BigNumber(row.amount).isGreaterThan(row.spendableBalance)) {
        amountExceedsSpendableBalance = true;
      }
    });
    formData.takerRows.forEach((row: OfferEditorRowData) => {
      offer = getUpdatedOffer(offer, row, false);
      if (row.assetWalletId === 0) {
        missingAssetSelection = true;
      }
    });

    if (missingAssetSelection || missingAmount || amountExceedsSpendableBalance) {
      if (missingAssetSelection) {
        errorDialog(new Error(t`Please select an asset for each row`));
      } else if (missingAmount) {
        errorDialog(new Error(t`Please enter an amount for each row`));
      } else if (amountExceedsSpendableBalance) {
        errorDialog(new Error(t`Amount exceeds spendable balance`));
      }

      return;
    }

    const confirmedCreation = await openDialog(<OfferEditorConfirmationDialog />);

    if (!confirmedCreation) {
      return;
    }

    setIsProcessing(true);

    try {
      const response = await createOfferForIds({
        walletIdsAndAmounts: offer,
        feeInMojos,
        validateOnly: false,
      }).unwrap();
      if (response.success === false) {
        const error = response.error || new Error('Encountered an unknown error while creating offer');
        errorDialog(error);
      } else {
        const { offer: offerData, tradeRecord: offerRecord } = response;

        try {
          navigate(-1);

          if (!suppressShareOnCreate) {
            onOfferCreated({ offerRecord, offerData });
          }
        } catch (err) {
          console.error(err);
        }
      }
    } catch (e) {
      let error = e as Error;

      if (error.message.startsWith('insufficient funds')) {
        error = new Error(t`
          Insufficient funds available to create offer. Ensure that your
          spendable balance is sufficient to cover the offer amount.
        `);
      }
      errorDialog(error);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    methods.reset({
      ...defaultValues,
      makerRows: [defaultMakerRow()],
    });
  }

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Flex flexDirection="column" rowGap={3} flexGrow={1}>
        <Card>
          <OfferEditorConditionsPanel makerSide="sell" disabled={processing} />
        </Card>
        <Flex justifyContent="flex-end" gap={2}>
          <Button variant="outlined" type="reset" onClick={handleReset} disabled={processing}>
            <Trans>Reset</Trans>
          </Button>
          <ButtonLoading variant="contained" color="primary" type="submit" loading={processing}>
            <Trans>Create Offer</Trans>
          </ButtonLoading>
        </Flex>
      </Flex>
    </Form>
  );
}

type CreateOfferEditorProps = {
  walletId?: number;
  walletType?: WalletType;
  referrerPath?: string;
  onOfferCreated?: (obj: { offerRecord: any; offerData: any }) => void;
};

export function CreateOfferEditor(props: CreateOfferEditorProps) {
  const { walletId, walletType, referrerPath, onOfferCreated = () => {} } = props;

  const title = <Trans>Create an Offer</Trans>;
  const navElement = referrerPath ? (
    <Back variant="h5" to={referrerPath}>
      {title}
    </Back>
  ) : (
    <>{title}</>
  );

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>{navElement}</Flex>
        <OfferEditor walletId={walletId} walletType={walletType} onOfferCreated={onOfferCreated} />
      </Flex>
    </Grid>
  );
}

function getUpdatedOffer(offerParam: { [key: string]: BigNumber }, row: OfferEditorRowData, debit: boolean) {
  const offer = JSON.parse(JSON.stringify(offerParam));
  const { amount, assetWalletId, walletType: walletTypeLocal } = row;
  if (assetWalletId > 0) {
    let mojoAmount = new BigNumber(0);
    if (walletTypeLocal === WalletType.STANDARD_WALLET) {
      mojoAmount = chiaToMojo(amount);
    } else if (walletTypeLocal === WalletType.CAT) {
      mojoAmount = catToMojo(amount);
    }

    offer[assetWalletId] = debit ? mojoAmount.negated() : mojoAmount;
  } else {
    console.error('missing asset wallet id');
  }
  return offer;
}
