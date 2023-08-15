import { useGetKeysQuery, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import {
  ButtonLoading,
  DialogActions,
  Flex,
  TextField,
  Button,
  Form,
  Loading,
  useCurrencyCode,
} from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Select,
  MenuItem,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';
import HeroImage from './images/walletConnectToChia.svg';

enum Step {
  CONNECT,
  SELECT_KEYS,
}

type FormData = {
  uri: string;
  fingerprints: number[];
};

export type WalletConnectAddConnectionDialogProps = {
  onClose?: (topic?: string) => void;
  open?: boolean;
};

export default function WalletConnectAddConnectionDialog(props: WalletConnectAddConnectionDialogProps) {
  const { onClose = () => {}, open = false } = props;

  const [step, setStep] = useState<Step>(Step.CONNECT);
  const { pair, isLoading: isLoadingWallet } = useWalletConnectContext();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery({});
  const { data: fingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const mainnet = useCurrencyCode() === 'XCH';
  const methods = useForm<FormData>({
    defaultValues: {
      uri: '',
      fingerprints: [],
    },
  });

  const isLoading = isLoadingWallet || isLoadingPublicKeys || isLoadingLoggedInFingerprint;

  const selectedFingerprints = useWatch({
    control: methods.control,
    name: 'fingerprints',
    defaultValue: [],
  });

  const { allowConfirmationFingerprintChange, setAllowConfirmationFingerprintChange } = useWalletConnectPreferences();

  function handleClose() {
    onClose();
  }

  useEffect(() => {
    const { setValue, getValues } = methods;
    const { fingerprints } = getValues();
    if (fingerprint && !fingerprints.length) {
      setValue('fingerprints', [fingerprint]);
    }
  }, [fingerprint, methods]);

  async function handleSubmit(values: FormData) {
    const { uri, fingerprints } = values;
    if (!uri) {
      throw new Error(t`Please enter a URI`);
    }

    if (step === Step.CONNECT) {
      setStep(Step.SELECT_KEYS);
      return;
    }

    if (!fingerprints.length) {
      throw new Error(t`Please select at least one key`);
    }

    if (!allowConfirmationFingerprintChange && fingerprints.length > 1) {
      setAllowConfirmationFingerprintChange(true);
    }

    const topic = await pair(uri, selectedFingerprints, mainnet);
    onClose(topic);
  }

  function handleToggleSelectFingerprint(fingerprintLocal: number) {
    const { setValue } = methods;
    const { fingerprints } = methods.getValues();
    if (fingerprints.length === 1 && fingerprints[0] === fingerprintLocal) return;
    const index = fingerprints.indexOf(fingerprintLocal);
    if (index === -1) {
      setValue('fingerprints', [...fingerprints, fingerprintLocal]);
    } else {
      setValue(
        'fingerprints',
        fingerprints.filter((f) => f !== fingerprintLocal)
      );
    }
  }

  const { isSubmitting } = methods.formState;
  const isStepValid = step === Step.CONNECT || selectedFingerprints.length > 0;
  const canSubmit = !isSubmitting && !isLoading && isStepValid;

  function renderKeysMultiSelect() {
    return (
      <Select sx={{ width: '100%' }} multiple value={selectedFingerprints}>
        {keys?.map((key, index) => (
          <MenuItem
            key={key.fingerprint}
            value={key.fingerprint}
            onClick={() => handleToggleSelectFingerprint(key.fingerprint)}
          >
            {key.label || <Trans>Wallet {index + 1}</Trans>} ({key.fingerprint})
          </MenuItem>
        ))}
      </Select>
    );
  }

  function renderMultipleKeySelectedWarning() {
    const { fingerprints } = methods.getValues();
    if (!allowConfirmationFingerprintChange && fingerprints.length > 1) {
      return (
        <Typography variant="body2" textAlign="center" color="red">
          <Trans>Selecting multiple keys will enable "Key Switching" inside Settings / Integration tab.</Trans>
        </Typography>
      );
    }
    return null;
  }

  return (
    <Dialog onClose={handleClose} maxWidth="xs" open={open} fullWidth>
      <DialogTitle>
        <Trans>WalletConnect</Trans>
      </DialogTitle>
      <IconButton
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
        onClick={handleClose}
      >
        <CloseIcon />
      </IconButton>

      <Form methods={methods} onSubmit={handleSubmit}>
        <DialogContent>
          <Flex flexDirection="column" gap={3}>
            <Box alignSelf="center">
              <HeroImage width={240} />
            </Box>
            <Flex flexDirection="column" gap={5} minWidth={0}>
              <Box>
                <Typography variant="h6" textAlign="center">
                  <Trans>WalletConnect Integration</Trans>
                </Typography>
                <Typography variant="body2" textAlign="center" color="textSecondary">
                  {step === Step.CONNECT ? (
                    <Trans>Paste the address from WalletConnect below. </Trans>
                  ) : (
                    <Trans>Select keys which you want to share with WalletConnect</Trans>
                  )}
                </Typography>
              </Box>
              {isLoading ? (
                <Loading center />
              ) : step === Step.CONNECT ? (
                <TextField name="uri" label={<Trans>Paste link</Trans>} multiline required autoFocus />
              ) : (
                <Flex gap={3} flexDirection="column">
                  {renderMultipleKeySelectedWarning()}
                  {renderKeysMultiSelect()}
                </Flex>
              )}
            </Flex>
          </Flex>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose} variant="outlined" color="primary">
            <Trans>Reject</Trans>
          </Button>
          <ButtonLoading
            type="submit"
            disabled={!canSubmit}
            loading={isSubmitting}
            variant="contained"
            color="primary"
            disableElevation
          >
            <Trans>Continue</Trans>
          </ButtonLoading>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
