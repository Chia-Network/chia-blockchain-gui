import { toBech32m } from '@chia-network/api';
import { CardStep, TextField, Button } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Grid, FormControl, Typography, Switch, FormGroup, FormControlLabel, ButtonGroup } from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { getUniqueName } from '../../../hooks/usePlotNFTName';

type Props = {
  step: number;
  currencyCode: string;
};

export default function PlotAddChooseKeys(props: Props) {
  const { step, currencyCode } = props;
  const { watch, setValue } = useFormContext();
  const [manualSetup, setManualSetup] = React.useState(false);
  const [poolKeyType, setPoolKeyType] = React.useState<'p2SingletonPuzzleHash' | 'poolPublicKey'>(
    'p2SingletonPuzzleHash'
  );
  const p2SingletonPuzzleHash = watch('p2SingletonPuzzleHash');

  const plotNFTContractAddressHelperText = React.useMemo(() => {
    if (!p2SingletonPuzzleHash) {
      return <Trans>Used to create a pool plot.</Trans>;
    }
    const plotNFTName = getUniqueName(p2SingletonPuzzleHash);
    return (
      <Trans>
        This is the plot nft contract address of "{plotNFTName}". If you want to change this, select "None" at Plot to a
        Plot NFT form.
      </Trans>
    );
  }, [p2SingletonPuzzleHash]);

  const poolPublicKeyHelperText = React.useMemo(
    () => <Trans>(Not recommended) Used to create an old style plot for solo farming.</Trans>,
    []
  );

  const onChangeSetupKeys = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setManualSetup(e.target.checked);
    },
    [setManualSetup]
  );

  const handleSetPoolPublicKey = React.useCallback(() => {
    setValue('p2SingletonPuzzleHash', '');
    setPoolKeyType('poolPublicKey');
  }, [setPoolKeyType, setValue]);

  const handleSetP2SingletonPuzzleHash = React.useCallback(() => {
    setValue('poolPublicKey', '');
    setPoolKeyType('p2SingletonPuzzleHash');
  }, [setPoolKeyType, setValue]);

  React.useEffect(() => {
    if (!p2SingletonPuzzleHash) {
      setValue('plotNFTContractAddr', '');
    } else {
      setValue('plotNFTContractAddr', toBech32m(p2SingletonPuzzleHash, currencyCode.toLowerCase()));
    }
  }, [p2SingletonPuzzleHash, setValue, currencyCode]);

  return (
    <CardStep step={step} title={<Trans>Keys</Trans>}>
      <Typography variant="subtitle1">
        <Trans>
          You can customize farmer public key, pool public key / pool contract address here manually.
          <br />
          Usually you don't need manual set up so please consider carefully whether you really need to edit these keys
          for a plot. One possible situation is to create a plot for someone who asks you to plot with your great
          hardware.
        </Trans>
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={<Switch checked={manualSetup} onChange={onChangeSetupKeys} />}
          label={<Trans>Set up keys manually</Trans>}
        />
      </FormGroup>
      <Grid container spacing={2}>
        <Grid xs={12} item>
          <FormControl variant="filled" fullWidth>
            <TextField
              name="farmerPublicKey"
              type="text"
              variant="filled"
              placeholder="Hex farmer public key"
              label={<Trans>Farmer Public Key</Trans>}
              helperText={
                <Trans>
                  If you leave this input blank, farmer key will be automatically chosen from the master sk of the
                  wallet currently you logged in.
                </Trans>
              }
              disabled={!manualSetup}
            />
          </FormControl>
        </Grid>
        {!p2SingletonPuzzleHash && (
          <Grid xs={12} item>
            <ButtonGroup>
              <Button
                selected={poolKeyType === 'poolPublicKey'}
                onClick={handleSetPoolPublicKey}
                data-testid="PlotAddChooseKeys-poolKeyType-poolPublicKey"
              >
                <Trans>Solo Farming</Trans>
              </Button>
              <Button
                selected={poolKeyType === 'p2SingletonPuzzleHash'}
                onClick={handleSetP2SingletonPuzzleHash}
                data-testid="PlotAddChooseKeys-poolKeyType-p2SingletonPuzzleHash"
              >
                <Trans>Pool Farming</Trans>
              </Button>
            </ButtonGroup>
          </Grid>
        )}
        <Grid xs={12} item>
          <FormControl variant="filled" fullWidth>
            <TextField
              name={poolKeyType === 'p2SingletonPuzzleHash' ? 'plotNFTContractAddr' : 'poolPublicKey'}
              type="text"
              variant="filled"
              placeholder={
                poolKeyType === 'p2SingletonPuzzleHash' ? t`Plot NFT Plot Target Address` : t`Hex public key of pool`
              }
              label={
                poolKeyType === 'p2SingletonPuzzleHash' ? (
                  <Trans>Plot NFT Pool Contract Address</Trans>
                ) : (
                  <Trans>Pool Public Key</Trans>
                )
              }
              helperText={
                poolKeyType === 'p2SingletonPuzzleHash' ? plotNFTContractAddressHelperText : poolPublicKeyHelperText
              }
              disabled={(poolKeyType === 'p2SingletonPuzzleHash' && Boolean(p2SingletonPuzzleHash)) || !manualSetup}
            />
          </FormControl>
        </Grid>
      </Grid>
    </CardStep>
  );
}
