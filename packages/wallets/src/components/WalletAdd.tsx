import { useGenerateMnemonicMutation, useAddPrivateKeyMutation } from '@chia-network/api-react';
import { ButtonLoading, Form, TextField, Flex, Loading, Logo, useAuth, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { TextField as TextFieldMaterial, Typography, Grid, Container } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useEffectOnce } from 'react-use';

type FormData = {
  label: string;
};

export default function WalletAdd() {
  const navigate = useNavigate();
  const [generateMnemonic, { data: words, isLoading }] = useGenerateMnemonicMutation();
  const [addPrivateKey] = useAddPrivateKeyMutation();
  const { logIn } = useAuth();
  const methods = useForm<FormData>({
    defaultValues: {
      label: '',
    },
  });
  const showError = useShowError();
  const {
    formState: { isSubmitting },
  } = methods;

  useEffectOnce(() => {
    generateMnemonic();
  });

  const canSubmit = !!words && !isSubmitting;

  async function handleSubmit(values: FormData) {
    if (!canSubmit) {
      return;
    }

    const { label } = values;

    try {
      const fingerprint = await addPrivateKey({
        mnemonic: words.join(' '),
        ...(label && { label: label.trim() }), // omit `label` if label is undefined/empty. backend returns an error if label is set and undefined/empty
      }).unwrap();

      await logIn(fingerprint);

      navigate('/dashboard/wallets/1');
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Container maxWidth="lg">
      <Form methods={methods} onSubmit={handleSubmit}>
        <Flex flexDirection="column" gap={3} alignItems="center">
          <Logo />
          <Typography variant="h4" component="h1" gutterBottom>
            <Trans>New Wallet</Trans>
          </Typography>
          <Typography variant="subtitle1" align="center">
            <Trans>
              Welcome! The following words are used for your wallet backup. Without them, you will lose access to your
              wallet, keep them safe! Write down each word along with the order number next to them. (Order is
              important)
            </Trans>
          </Typography>
          {!isLoading && words ? (
            <Flex flexDirection="column" gap={3}>
              <Grid container spacing={2} rowSpacing={3}>
                {words.map((word: string, index: number) => (
                  // eslint-disable-next-line react/no-array-index-key -- We never change the length. There is no better way
                  <Grid key={index} xs={6} sm={4} md={2} item>
                    <TextFieldMaterial
                      variant="filled"
                      color="primary"
                      id={`id_${index}`}
                      label={index + 1}
                      name="email"
                      autoComplete="email"
                      value={word}
                      inputProps={{
                        readOnly: true,
                      }}
                      fullWidth
                      autoFocus
                    />
                  </Grid>
                ))}
              </Grid>
              <Grid container>
                <Grid xs={0} md={4} item />
                <Grid xs={12} md={4} item>
                  <TextField
                    name="label"
                    label={<Trans>Wallet Name</Trans>}
                    inputProps={{
                      readOnly: isSubmitting,
                    }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Flex>
          ) : (
            <Loading />
          )}
          <Grid container>
            <Grid xs={0} md={4} item />
            <Grid xs={12} md={4} item>
              <ButtonLoading
                type="submit"
                variant="contained"
                color="primary"
                disabled={!canSubmit}
                loading={isSubmitting}
                fullWidth
              >
                <Trans>Next</Trans>
              </ButtonLoading>
            </Grid>
          </Grid>
        </Flex>
      </Form>
    </Container>
  );
}
