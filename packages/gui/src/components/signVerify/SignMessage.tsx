import { useSignMessageByAddressMutation, useSignMessageByIdMutation } from '@chia-network/api-react';
import { Button, Card, Flex, Form, TextField, useOpenDialog, useShowError } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { ButtonGroup, DialogActions, Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { SignMessageEntityType, SignMessageEntity } from './SignMessageEntities';
import SignMessageResultDialog from './SignMessageResultDialog';
import SigningEntityDID from './SigningEntityDID';
import SigningEntityWalletAddress from './SigningEntityWalletAddress';

const ERROR_MISSING_ENTITY = t`Specify a wallet address, NFT, or DID to sign with`;

type SignMessageFormData = {
  message: string;
  selectedEntityType: SignMessageEntityType;
  entity?: SignMessageEntity;
};

export type SignMessageProps = {
  onComplete: () => void;
};

function getEntityValue(entity: SignMessageEntity): string {
  switch (entity.type) {
    case SignMessageEntityType.WalletAddress:
      return entity.address;
    case SignMessageEntityType.NFT:
      return entity.nftId;
    case SignMessageEntityType.DID:
      return entity.didId;
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}

export default function SignMessage(props: SignMessageProps) {
  const { onComplete } = props;
  const [signMessageByAddress] = useSignMessageByAddressMutation();
  const [signMessageById] = useSignMessageByIdMutation();
  const openDialog = useOpenDialog();
  const showError = useShowError();

  const methods = useForm<SignMessageFormData>({
    defaultValues: {
      message: '',
      selectedEntityType: SignMessageEntityType.WalletAddress,
      entity: undefined,
    },
  });

  const { message, selectedEntityType, entity } = methods.watch();

  function handleEntityChange(newEntityType: SignMessageEntityType) {
    methods.setValue('selectedEntityType', newEntityType);
    methods.setValue('entity', undefined);
  }

  function handleCancel() {
    onComplete();
  }

  async function handleSignByAddress(messageToSign: string, address: string) {
    if (!messageToSign) {
      showError(new Error(t`Enter a message to sign`));
      return;
    }

    if (!address) {
      showError(new Error(t`Enter a wallet address to sign with`));
      return;
    }

    const { data: result } = await signMessageByAddress({
      message: messageToSign,
      address,
    });

    openDialog(
      <SignMessageResultDialog
        message={messageToSign}
        pubkey={result.pubkey}
        signature={result.signature}
        address={address}
      />
    );
  }

  async function handleSignById(messageToSign: string, id: string) {
    if (!messageToSign) {
      showError(new Error(t`Enter a message to sign`));
      return;
    }

    if (!id) {
      showError(new Error(t`Enter an NFT or DID to sign with`));
      return;
    }

    const { data: result } = await signMessageById({
      message: messageToSign,
      id,
    });

    openDialog(<SignMessageResultDialog message={messageToSign} pubkey={result.pubkey} signature={result.signature} />);
  }

  async function handleSign() {
    if (!entity) {
      showError(new Error(ERROR_MISSING_ENTITY));
      return;
    }

    const entityValue = getEntityValue(entity);
    const hexMessage = Buffer.from(message).toString('hex');

    switch (selectedEntityType) {
      case SignMessageEntityType.WalletAddress:
        await handleSignByAddress(hexMessage, entityValue);
        break;
      case SignMessageEntityType.NFT: // fall through
      case SignMessageEntityType.DID:
        await handleSignById(hexMessage, entityValue);
        break;
      default:
        throw new Error(`Unknown entity type used for signing: ${selectedEntityType}`);
    }
  }

  async function handleSubmit() {
    onComplete();
    await handleSign();
  }

  const buttons: { type: SignMessageEntityType; label: ReactNode }[] = [
    { type: SignMessageEntityType.WalletAddress, label: <Trans>Wallet Address</Trans> },
    { type: SignMessageEntityType.NFT, label: <Trans>NFT</Trans> },
    { type: SignMessageEntityType.DID, label: <Trans>DID</Trans> },
  ];

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <Card>
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1">
              <Trans>Signing Entity</Trans>
            </Typography>
            <Flex flexDirection="column" gap={2}>
              <ButtonGroup fullWidth>
                {buttons.map(({ type, label }) => (
                  <Button
                    key={type}
                    selected={selectedEntityType === type}
                    onClick={() => handleEntityChange(type)}
                    disabled={type === SignMessageEntityType.NFT}
                  >
                    {label}
                  </Button>
                ))}
              </ButtonGroup>
              {selectedEntityType === SignMessageEntityType.WalletAddress && (
                <SigningEntityWalletAddress entityName="entity" entityValueName="entity.address" />
              )}
              {selectedEntityType === SignMessageEntityType.DID && (
                <SigningEntityDID entityName="entity" entityValueName="entity.didId" />
              )}
            </Flex>
          </Flex>
        </Card>
        <Card>
          <Flex flexDirection="column" gap={1}>
            <TextField
              variant="filled"
              InputProps={{
                readOnly: false,
              }}
              name="message"
              label={<Trans>Message</Trans>}
              minRows={5}
              maxRows={10}
              fullWidth
              multiline
            />
          </Flex>
        </Card>

        <DialogActions>
          <Button onClick={handleCancel} color="secondary" variant="outlined" autoFocus>
            <Trans>Cancel</Trans>
          </Button>
          <Button variant="contained" color="primary" type="submit">
            <Trans>Sign</Trans>
          </Button>
        </DialogActions>
      </Flex>
    </Form>
  );
}
