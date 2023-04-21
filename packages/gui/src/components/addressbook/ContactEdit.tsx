import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { CopyToClipboard, CardHero, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Save, Delete } from '@mui/icons-material';
import { TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { launcherIdFromNFTId } from '../../util/nfts';
import NFTPreview from '../nfts/NFTPreview';
import { AddressBookContext } from './AddressBookProvider';

export default function ContactEdit() {
  const { contactid } = useParams();
  const navigate = useNavigate();
  const [, , removeAddress, getContactContactId] = useContext(AddressBookContext);
  const contact = getContactContactId(Number(contactid));

  const launcherId = launcherIdFromNFTId(contact.nftid ?? '');

  const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId });

  function getImage() {
    if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;
    return <img height={50} width={50} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }

  function handleRemove(contactId: number) {
    removeAddress(contactId);
    navigate(`/dashboard/addressbook/`);
  }

  return (
    <div>
      <CardHero variant="outlined" style={{ backgroundColor: 'blue' }}>
        <Flex
          flexDirection="column"
          flexGrow={1}
          alignItems="flex-end"
          justifyContent="flex-end"
          style={{ paddingBottom: '1em' }}
        >
          <Typography>
            <IconButton onClick={() => handleRemove(Number(contact.contactid))}>
              <Delete />
            </IconButton>
            <IconButton>
              <Save />
            </IconButton>
          </Typography>
        </Flex>
      </CardHero>

      <div style={{ width: '70%', margin: 'auto', marginTop: -40 }}>
        {getImage()}
        <h1>
          <Trans>{contact.name}</Trans>
        </h1>
        <TextField label={<Trans>Name</Trans>} value={contact.name} variant="filled" fullWidth />
        <TextField
          label={<Trans>Address</Trans>}
          value={contact.addresses[0]}
          variant="filled"
          inputProps={{
            'data-testid': 'WalletReceiveAddress-address',
            readOnly: true,
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <CopyToClipboard value={contact.addresses[0]} data-testid="WalletReceiveAddress-address-copy" />
              </InputAdornment>
            ),
          }}
          fullWidth
        />
      </div>
    </div>
  );
}
