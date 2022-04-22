import React, { useMemo, useState } from 'react';
import { Trans, t } from '@lingui/macro';
import type { NFT } from '@chia/api';
import {
  Amount,
  Back,
  Button,
  ButtonLoading,
  Fee,
  Flex,
  Form,
  TextField,
  fromBech32m,
} from '@chia/core';
import {
  Box,
  Divider,
  Grid,
  Skeleton,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { useForm, useFormContext } from 'react-hook-form';

/* ========================================================================== */
/*              Temporary home for the NFT-specific Offer Editor              */
/*        An NFT offer consists of a single NFT being offered for XCH         */
/* ========================================================================== */

/* ========================================================================== */

enum NFTOfferEditorTab {
  NFTForXCH = 1,
  XCHForNFT = 2,
}

/* ========================================================================== */

type NFTOfferConditionalsPanelProps = {
  defaultValues: NFTOfferEditorFormData;
};

function NFTOfferConditionalsPanel(props: NFTOfferConditionalsPanelProps) {
  const { defaultValues } = props;
  const methods = useFormContext();
  const [tab, setTab] = useState<'nft_for_xch' | 'xch_for_nft'>('nft_for_xch');
  const [amountFocused, setAmountFocused] = useState<boolean>(false);
  const [processing, setIsProcessing] = useState<boolean>(false);

  const amount = methods.watch('xchAmount');
  // HACK: manually determine the value for the amount field's shrink input prop.
  // Without this, toggling between the two tabs with an amount specified will cause
  // the textfield's label and value to overlap.
  const shrink = useMemo(() => {
    if (!amountFocused && (amount === undefined || amount.length === 0)) {
      return false;
    }
    return true;
  }, [amount, amountFocused]);

  const nftElem = (
    <Grid item>
      <TextField
        id={`${tab}-nftId}`}
        key={`${tab}-nftId}`}
        variant="filled"
        name="nftId"
        color="secondary"
        // disabled={disabled}
        label={<Trans>NFT</Trans>}
        defaultValue={defaultValues.nftId}
        placeholder={t`NFT Identifier`}
        fullWidth
        required
      />
    </Grid>
  );
  const amountElem = (
    <Grid item>
      <Amount
        id={`${tab}-amount}`}
        key={`${tab}-amount}`}
        variant="filled"
        name="xchAmount"
        color="secondary"
        // disabled={disabled}
        label={<Trans>Amount</Trans>}
        defaultValue={amount}
        onChange={handleAmountChange}
        onFocus={() => setAmountFocused(true)}
        onBlur={() => setAmountFocused(false)}
        showAmountInMojos={true}
        InputLabelProps={{ shrink }}
        required
      />
    </Grid>
  );
  const offerElem = tab === 'nft_for_xch' ? nftElem : amountElem;
  const takerElem = tab === 'nft_for_xch' ? amountElem : nftElem;

  function handleAmountChange(amount: string) {
    methods.setValue('xchAmount', amount);
  }

  function handleFeeChange(fee: string) {
    methods.setValue('fee', fee);
  }

  function handleReset() {
    methods.reset(defaultValues);
  }

  return (
    <Flex
      flexDirection="column"
      flexGrow={1}
      gap={3}
      style={{ padding: '1.5rem' }}
    >
      <Tabs
        value={tab}
        onChange={(_event, newValue) => setTab(newValue)}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab value="nft_for_xch" label={<Trans>NFT for XCH</Trans>} />
        <Tab value="xch_for_nft" label={<Trans>XCH for NFT</Trans>} />
      </Tabs>
      <Grid container>
        <Flex
          flexDirection="column"
          flexGrow={1}
          gap={3}
          // style={{ backgroundColor: 'purple' }}
        >
          <Flex flexDirection="column" gap={1}>
            <Typography variant="subtitle1">You will offer</Typography>
            {offerElem}
          </Flex>
          <Flex flexDirection="column" gap={1}>
            <Typography variant="subtitle1">In exchange for</Typography>
            {takerElem}
          </Flex>
          <Divider />
          <Grid item>
            <Fee
              id="fee"
              variant="filled"
              name="fee"
              color="secondary"
              // disabled={disabled}
              onChange={handleFeeChange}
              defaultValue={defaultValues.fee}
              label={<Trans>Fee</Trans>}
            />
          </Grid>
        </Flex>
      </Grid>
      <Flex
        flexDirection="column"
        flexGrow={1}
        alignItems="flex-end"
        justifyContent="flex-end"
      >
        <Flex justifyContent="flex-end" gap={2}>
          <Button
            variant="outlined"
            type="reset"
            onClick={handleReset}
            disabled={processing}
          >
            <Trans>Reset</Trans>
          </Button>
          <ButtonLoading
            variant="contained"
            color="primary"
            type="submit"
            loading={processing}
          >
            <Trans>Save Offer</Trans>
          </ButtonLoading>
        </Flex>
      </Flex>
    </Flex>
  );
}

/* ========================================================================== */

type NFTOfferPreviewProps = {};

function NFTOfferPreview(props: NFTOfferPreviewProps) {
  const {} = props;
  const methods = useFormContext();
  const nftId = methods.watch('nftId');

  const isValidNFT = useMemo(() => {
    if (nftId === undefined || nftId.length === 0) {
      return false;
    }
    try {
      fromBech32m(nftId);
      return true;
    } catch (e) {
      return false;
    }
  }, [nftId]);

  console.log('isValidNFT: ', nftId);
  console.log(isValidNFT);

  const borderStyle = isValidNFT ? '2px solid #E0E0E0' : '2px dashed #E0E0E0';

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      style={{
        width: '328px',
        height: '576px',
        borderLeft: '1px solid #E0E0E0',
      }}
      gap={1}
    >
      <Flex
        flexDirection="column"
        flexGrow={1}
        gap={1}
        style={{
          padding: '1.5rem',
        }}
      >
        <Typography variant="subtitle1">Preview</Typography>
        <Box
          sx={{
            width: '264px',
            height: '456px',
            boxSizing: 'border-box',
            border: `${borderStyle}`,
            borderRadius: '24px',
            display: 'flex',
            // overflow: 'hidden',
            // alignItems: 'center',
            // justifyContent: 'center',
          }}
        >
          {/* <Flex
            flexDirection="column"
            alignItems="center"
            flexGrow={1}
            gap={1}
            style={{
              wordBreak: 'break-all',
              // padding: '0.5rem',
            }}
          > */}
          {isValidNFT ? (
            <Flex flexDirection="column" flexGrow={1} gap={0}>
              <Flex
                flexDirection="column"
                alignItems="center"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem 3px 0.5rem',
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="61px"
                  style={{ borderRadius: '18px 18px 0px 0px' }}
                />
              </Flex>
              <Flex
                flexDirection="column"
                alignItems="center"
                style={{ width: '100%', padding: '0 0.5rem 0 0.5rem' }}
              >
                <Skeleton variant="rectangular" width="100%" height="264px" />
              </Flex>
              <Flex
                flexDirection="column"
                alignItems="center"
                style={{ width: '100%', padding: '3px 0.5rem 0px 0.5rem' }}
              >
                <Skeleton variant="rectangular" width="100%" height="69px" />
              </Flex>
              <Flex
                flexDirection="column"
                style={{ width: '100%', padding: '3px 0.5rem 0.5rem 0.5rem' }}
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="33px"
                  style={{ borderRadius: '0px 0px 18px 18px' }}
                />
              </Flex>
            </Flex>
          ) : (
            <Flex
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              flexGrow={1}
              gap={1}
              style={{
                wordBreak: 'break-all',
                // padding: '0.5rem',
              }}
            >
              <Typography variant="h6">
                <Trans>NFT not specified</Trans>
              </Typography>
            </Flex>
          )}
          {/* </Flex> */}
        </Box>
      </Flex>
    </Flex>
  );
}

/* ========================================================================== */
/*                              NFT Offer Editor                              */
/*             Currently only supports a single NFT <--> XCH offer            */
/* ========================================================================== */

type NFTOfferEditorFormData = {
  nftId?: string;
  xchAmount: string;
  fee: string;
};

type NFTOfferEditorProps = {
  nft?: NFT;
  onOfferCreated?: (obj: { offerRecord: any; offerData: any }) => void;
};

export default function NFTOfferEditor(props: NFTOfferEditorProps) {
  const { nft, onOfferCreated } = props;
  const defaultValues: NFTOfferEditorFormData = {
    nftId: nft?.id ?? '',
    xchAmount: '',
    fee: '',
  };
  const methods = useForm<NFTOfferEditorFormData>({
    shouldUnregister: false,
    defaultValues,
  });

  async function handleSubmit(formData: NFTOfferEditorFormData) {
    console.log('handleSubmit', formData);
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex
        flexDirection="column"
        flexGrow={1}
        gap={1}
        style={{
          border: '1px solid #E0E0E0',
          boxSizing: 'border-box',
          borderRadius: '8px',
        }}
      >
        <Flex flexDirection="row">
          <NFTOfferConditionalsPanel defaultValues={defaultValues} />
          <NFTOfferPreview />
        </Flex>
      </Flex>
    </Form>
  );
}

/* ========================================================================== */
/*                    Create and Host the NFT Offer Editor                    */
/* ========================================================================== */

type CreateNFTOfferEditorProps = {
  nft?: NFT;
  referrerPath?: string;
  onOfferCreated?: (obj: { offerRecord: any; offerData: any }) => void;
};

export function CreateNFTOfferEditor(props: CreateNFTOfferEditorProps) {
  const { nft, referrerPath, onOfferCreated } = props;

  const title = <Trans>Create an NFT Offer</Trans>;
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
        <NFTOfferEditor nft={nft} onOfferCreated={onOfferCreated} />
      </Flex>
    </Grid>
  );
}

CreateNFTOfferEditor.defaultProps = {
  onOfferCreated: () => {},
};
