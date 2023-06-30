import { english } from '@chia-network/api';
import { useAddPrivateKeyMutation } from '@chia-network/api-react';
import {
  AlertDialog,
  Autocomplete,
  Button,
  ButtonLoading,
  Form,
  Flex,
  Logo,
  useOpenDialog,
  useTrans,
  TextField,
  useAuth,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Container, Grid } from '@mui/material';
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router';

import MnemonicPaste from './PasteMnemonic';

const emptyMnemonic = Array.from(Array(24).keys()).map(() => ({
  word: '',
}));

const options = english.map((item: { word: string; value: number }) => item.word);

type MnemonicWordCountOption = 12 | 24;

type FormData = {
  mnemonicWordCount: MnemonicWordCountOption;
  mnemonic: {
    word: string;
  }[];
  label: string;
};

export default function WalletImport() {
  const navigate = useNavigate();
  const [addPrivateKey] = useAddPrivateKeyMutation();
  const { logIn } = useAuth();
  const trans = useTrans();
  const openDialog = useOpenDialog();
  const [mnemonicPasteOpen, setMnemonicPasteOpen] = React.useState(false);

  const methods = useForm<FormData>({
    defaultValues: {
      mnemonicWordCount: 24,
      mnemonic: emptyMnemonic,
      label: '',
    },
  });
  const mnemonicWordCount = methods.watch('mnemonicWordCount');

  const {
    formState: { isSubmitting },
  } = methods;

  const { fields, replace } = useFieldArray({
    control: methods.control,
    name: 'mnemonic',
  });

  const submitMnemonicPaste = (mnemonicList: string) => {
    const mList = mnemonicList.match(/\b(\w+)\b/g);
    const intersection = mList?.filter((element) => options.includes(element));

    if (!intersection || mnemonicWordCount !== intersection.length) {
      openDialog(
        <AlertDialog>
          <Trans>Your pasted list does not include {mnemonicWordCount} valid mnemonic words.</Trans>
        </AlertDialog>
      );
      return;
    }

    const mnemonic = intersection.map((word) => ({ word }));

    replace(mnemonic);
    methods.setValue('mnemonic', mnemonic);

    closeMnemonicPaste();
  };

  function closeMnemonicPaste() {
    setMnemonicPasteOpen(false);
  }

  function setMnemonicWordCount(newWordCount: MnemonicWordCountOption) {
    const currentMnemonic = methods.getValues('mnemonic');
    let updatedMnemonic = [];

    if (newWordCount < currentMnemonic.length) {
      updatedMnemonic = currentMnemonic.splice(0, newWordCount);
    } else {
      const elementsToAdd = newWordCount - currentMnemonic.length;
      updatedMnemonic = [...currentMnemonic];
      for (let i = 0; i < elementsToAdd; i++) {
        updatedMnemonic.push({ word: '' });
      }
    }
    methods.setValue('mnemonic', updatedMnemonic);
    methods.setValue('mnemonicWordCount', newWordCount);
  }

  async function handleSubmit(values: FormData) {
    if (isSubmitting || mnemonicPasteOpen) {
      return;
    }

    const { mnemonic, label } = values;
    const mnemonicWords = mnemonic.map((item) => item.word);

    if (mnemonicWordCount === 12) {
      mnemonicWords.splice(12, 12);
    }
    const hasEmptyWord = !!mnemonicWords.filter((word) => !word).length;
    if (hasEmptyWord) {
      throw new Error(trans('Please fill all words'));
    }

    const fingerprint = await addPrivateKey({
      mnemonic: mnemonicWords.join(' '),
      ...(label && { label: label.trim() }), // omit `label` if label is undefined/empty. backend returns an error if label is set and undefined/empty
    }).unwrap();

    await logIn(fingerprint);

    navigate('/dashboard/wallets/1');
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Container maxWidth="lg">
        <Flex flexDirection="column" gap={3} alignItems="center">
          <Logo />
          <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
            <Trans>Import Wallet from Mnemonics</Trans>
          </Typography>
          <Grid container>
            <Grid xs={0} md={4} item />
            <Grid xs={12} md={4} item>
              <TextField
                name="label"
                label={<Trans>Wallet Name</Trans>}
                inputProps={{
                  readOnly: isSubmitting,
                }}
                disabled={isSubmitting}
                fullWidth
              />
            </Grid>
          </Grid>
          <Typography variant="subtitle1" align="center">
            <Trans>
              Enter the {mnemonicWordCount} word mnemonic that you have saved in order to restore your Chia wallet.
            </Trans>
          </Typography>
          <Grid spacing={2} rowSpacing={3} container>
            {fields.map((field, index) => (
              <Grid key={field.id} xs={6} sm={4} md={2} item>
                <Autocomplete
                  options={options}
                  name={`mnemonic.${index}.word`}
                  label={index + 1}
                  autoFocus={index === 0}
                  variant="filled"
                  disabled={isSubmitting}
                  disableClearable
                  data-testid={`mnemonic-${index}`}
                />
              </Grid>
            ))}
          </Grid>
          <Grid container>
            <Grid xs={0} md={4} item />
            <Grid xs={12} md={4} item>
              <Flex flexDirection="column" gap={3}>
                <MnemonicWordCount
                  mnemonicWordCount={mnemonicWordCount}
                  setMnemonicWordCount={setMnemonicWordCount}
                  disabled={isSubmitting}
                />
                <ActionButton onClick={() => setMnemonicPasteOpen(true)} disabled={isSubmitting} />
                {mnemonicPasteOpen && (
                  <MnemonicPaste
                    onSuccess={submitMnemonicPaste}
                    onCancel={closeMnemonicPaste}
                    twelveWord={mnemonicWordCount === 12}
                  />
                )}
                <ButtonLoading type="submit" variant="contained" color="primary" loading={isSubmitting} fullWidth>
                  <Trans>Next</Trans>
                </ButtonLoading>
              </Flex>
            </Grid>
          </Grid>
        </Flex>
      </Container>
    </Form>
  );
}

function MnemonicWordCount({
  mnemonicWordCount,
  setMnemonicWordCount,
  disabled,
}: {
  mnemonicWordCount: MnemonicWordCountOption;
  setMnemonicWordCount: (value: MnemonicWordCountOption) => void;
  disabled: boolean;
}) {
  const alternativeWordCount = mnemonicWordCount === 12 ? 24 : 12;

  return (
    <Button
      onClick={() => setMnemonicWordCount(alternativeWordCount)}
      variant="outlined"
      color="secondary"
      disabled={disabled}
      fullWidth
    >
      <Trans>Import from {alternativeWordCount} word mnemonic</Trans>
    </Button>
  );
}

function ActionButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <Button onClick={onClick} variant="contained" disabled={disabled} disableElevation>
      <Trans>Paste Mnemonic</Trans>
    </Button>
  );
}
