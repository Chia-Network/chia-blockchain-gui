import { toBech32m } from '@chia-network/api';
import { useGetKeysForPlottingQuery } from '@chia-network/api-react';
import { CardStep, TextField, Button, Checkbox } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Grid, FormControl, Typography, FormControlLabel, ButtonGroup } from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { getUniqueName } from '../../../hooks/usePlotNFTName';

type Props = {
  step: number;
  currencyCode: string;
  fingerprint: number;
};

export default function PlotAddChooseKeys(props: Props) {
  const { step, currencyCode, fingerprint } = props;
  const { watch, setValue } = useFormContext();
  const { isLoading, data } = useGetKeysForPlottingQuery({ fingerprints: [fingerprint] });
  const [manualSetup, setManualSetup] = React.useState(false);
  const [poolKeyType, setPoolKeyType] = React.useState<'p2SingletonPuzzleHash' | 'poolPublicKey'>(
    'p2SingletonPuzzleHash'
  );
  const p2SingletonPuzzleHash = watch('p2SingletonPuzzleHash');
  const farmerPKInput = watch('farmerPublicKey');
  const poolPKInput = watch('poolPublicKey');
  const prevP2SingletonPuzzleHash = React.useRef(p2SingletonPuzzleHash);

  let p2SingletonPuzzleHashChanged = false;
  if (prevP2SingletonPuzzleHash.current !== p2SingletonPuzzleHash) {
    p2SingletonPuzzleHashChanged = true;
    prevP2SingletonPuzzleHash.current = p2SingletonPuzzleHash;
  }

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

  const farmerPublicKeyForFingerprint = React.useMemo(
    () => (isLoading || !data || !data.keys[fingerprint] ? undefined : data.keys[fingerprint].farmerPublicKey),
    [isLoading, data, fingerprint]
  );

  const poolPublicKeyForFingerprint = React.useMemo(
    () => (isLoading || !data || !data.keys[fingerprint] ? undefined : data.keys[fingerprint].poolPublicKey),
    [isLoading, data, fingerprint]
  );

  const poolPKOrP2SingletonPuzzleHashHelperText = React.useMemo(() => {
    if (poolKeyType === 'p2SingletonPuzzleHash') {
      return plotNFTContractAddressHelperText;
    }
    return poolPublicKeyForFingerprint && poolPublicKeyForFingerprint === poolPKInput ? (
      <Trans>(Not recommended) Used to create an old style plot for solo farming.</Trans>
    ) : (
      <Trans>
        Note: the pool public key corresponding to the current logged-in wallet is {poolPublicKeyForFingerprint}
      </Trans>
    );
  }, [poolKeyType, plotNFTContractAddressHelperText, poolPKInput, poolPublicKeyForFingerprint]);

  const onChangeSetupKeys = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isManual = e.target.checked;
      if (!isManual) {
        setValue('farmerPublicKey', farmerPublicKeyForFingerprint);
        setValue('poolPublicKey', poolPublicKeyForFingerprint);
      }
      setManualSetup(isManual);
    },
    [setManualSetup, farmerPublicKeyForFingerprint, poolPublicKeyForFingerprint, setValue]
  );

  const handleSetPoolPublicKey = React.useCallback(() => {
    setValue('p2SingletonPuzzleHash', '');
    setPoolKeyType('poolPublicKey');
  }, [setPoolKeyType, setValue]);

  const handleSetP2SingletonPuzzleHash = React.useCallback(() => {
    setValue('poolPublicKey', '');
    setPoolKeyType('p2SingletonPuzzleHash');
  }, [setPoolKeyType, setValue]);

  const farmerPKhelperText = React.useMemo(
    () =>
      farmerPublicKeyForFingerprint && farmerPKInput === farmerPublicKeyForFingerprint ? (
        <Trans>This is the farmer public key corresponding to the current logged-in wallet</Trans>
      ) : (
        <Trans>
          Note: the farmer public key corresponding to the current logged-in wallet is {farmerPublicKeyForFingerprint}
        </Trans>
      ),
    [farmerPKInput, farmerPublicKeyForFingerprint]
  );

  React.useEffect(() => {
    if (!p2SingletonPuzzleHashChanged) {
      return;
    }
    if (poolKeyType === 'p2SingletonPuzzleHash') {
      if (!p2SingletonPuzzleHash) {
        setValue('plotNFTContractAddr', '');
      } else {
        setValue('plotNFTContractAddr', toBech32m(p2SingletonPuzzleHash, currencyCode.toLowerCase()));
      }
    } else {
      setValue('poolPublicKey', '');
      setPoolKeyType('p2SingletonPuzzleHash');
    }
  }, [p2SingletonPuzzleHash, setValue, currencyCode, poolKeyType, p2SingletonPuzzleHashChanged]);

  React.useEffect(() => {
    if (isLoading || !data || !data.keys[fingerprint]) {
      return;
    }
    setValue('farmerPublicKey', data.keys[fingerprint].farmerPublicKey);
  }, [isLoading, data, fingerprint, setValue]);

  React.useEffect(() => {
    if (isLoading || !data || !data.keys[fingerprint]) {
      return;
    }
    if (poolKeyType === 'poolPublicKey') {
      setValue('poolPublicKey', data.keys[fingerprint].poolPublicKey);
    } else if (p2SingletonPuzzleHash) {
      setValue('plotNFTContractAddr', toBech32m(p2SingletonPuzzleHash, currencyCode.toLowerCase()));
    }
  }, [isLoading, data, fingerprint, setValue, poolKeyType, p2SingletonPuzzleHash, currencyCode]);

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
      <FormControl variant="filled" fullWidth>
        <FormControlLabel
          control={<Checkbox name="useManualKeySetup" checked={manualSetup} onChange={onChangeSetupKeys} />}
          label={<Trans>Set up keys manually</Trans>}
        />
      </FormControl>
      <Grid container spacing={2}>
        <Grid xs={12} item>
          <FormControl variant="filled" fullWidth>
            <TextField
              name="farmerPublicKey"
              type="text"
              variant="filled"
              placeholder="Hex farmer public key"
              label={<Trans>Farmer Public Key</Trans>}
              helperText={farmerPKhelperText}
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
              helperText={poolPKOrP2SingletonPuzzleHashHelperText}
              disabled={(poolKeyType === 'p2SingletonPuzzleHash' && Boolean(p2SingletonPuzzleHash)) || !manualSetup}
            />
          </FormControl>
        </Grid>
      </Grid>
    </CardStep>
  );
}
