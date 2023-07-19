import { Button, Flex, Loading, CardStep, RadioGroup, EstimatedFee, FeeTxType, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Alert, Grid, FormControl, FormControlLabel, Typography, Radio, Collapse } from '@mui/material';
import React, { ReactNode } from 'react';
// import { uniq } from 'lodash';
import { useWatch, useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import usePoolInfo from '../../../hooks/usePoolInfo';
import PoolInfo from '../../pool/PoolInfo';
// import usePlotNFTs from '../../../hooks/usePlotNFTs';

const StyledCollapse = styled(Collapse)`
  display: ${({ in: visible }) => (visible ? 'block' : 'none')};
`;

type Props = {
  step?: number;
  onCancel?: () => void;
  title: ReactNode;
  description?: ReactNode;
  hideFee?: boolean;
  feeDescription?: ReactNode;
};

export default function PlotNFTSelectBase(props: Props) {
  const { step, onCancel, title, description, hideFee = false, feeDescription } = props;
  // const { nfts } = usePlotNFTs();
  const { setValue } = useFormContext();
  const self = useWatch<boolean>({
    name: 'self',
  });

  const poolUrl = useWatch<string>({
    name: 'poolUrl',
  });

  const poolInfo = usePoolInfo(poolUrl);

  /*
  const groupsOptions = useMemo(() => {
    if (!nfts) {
      return [];
    }

    const urls = nfts
      .filter((nft) => !!nft.poolState.poolConfig.poolUrl)
      .map((nft) => nft.poolState.poolConfig.poolUrl);

    return uniq(urls);
  }, [nfts]);
  */

  function handleDisableSelfPooling() {
    if (self) {
      setValue('self', false);
    }
  }

  const showPoolInfo = !self && !!poolUrl;

  return (
    <>
      <CardStep
        step={step}
        title={
          <Flex gap={1} alignItems="center">
            <Flex flexGrow={1}>{title}</Flex>
            {onCancel && (
              <Button onClick={onCancel}>
                <Trans>Cancel</Trans>
              </Button>
            )}
          </Flex>
        }
      >
        {description && <Typography variant="subtitle1">{description}</Typography>}

        <Grid container spacing={4}>
          <Grid xs={12} item>
            <FormControl variant="filled" fullWidth>
              <RadioGroup name="self" boolean>
                <Flex gap={1} flexDirection="column">
                  <FormControlLabel
                    control={<Radio />}
                    label={<Trans>Self pool. When you win a block you will earn XCH rewards.</Trans>}
                    value
                  />
                  <Flex gap={2}>
                    <FormControlLabel value={false} control={<Radio />} label={<Trans>Connect to pool</Trans>} />
                    <Flex flexBasis={0} flexGrow={1} flexDirection="column" gap={1}>
                      <FormControl variant="filled" fullWidth>
                        <TextField
                          name="poolUrl"
                          label="Pool URL"
                          variant="filled"
                          autoComplete="on"
                          onClick={handleDisableSelfPooling}
                          onChange={handleDisableSelfPooling}
                          fullWidth
                        />
                      </FormControl>
                    </Flex>
                  </Flex>
                </Flex>
              </RadioGroup>
            </FormControl>
          </Grid>
          {!hideFee && (
            <Grid xs={12} lg={6} item>
              <EstimatedFee
                name="fee"
                type="text"
                variant="filled"
                label={<Trans>Fee</Trans>}
                fullWidth
                txType={FeeTxType.createPlotNFT}
              />
              {feeDescription}
            </Grid>
          )}
        </Grid>
      </CardStep>

      <StyledCollapse in={showPoolInfo}>
        <CardStep step={typeof step === 'number' ? step + 1 : undefined} title={<Trans>Verify Pool Details</Trans>}>
          {poolInfo.error && <Alert severity="warning">{poolInfo.error.message}</Alert>}

          {poolInfo.loading && <Loading center />}

          {poolInfo.poolInfo && <PoolInfo poolInfo={poolInfo.poolInfo} />}
        </CardStep>
      </StyledCollapse>
    </>
  );
}
