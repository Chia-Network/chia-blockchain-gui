// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { SaveOutlined, DeleteOutlined } from '@mui/icons-material';
import { TextField, IconButton } from '@mui/material';
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// import { launcherIdFromNFTId } from '../../util/nfts';
// import NFTPreview from '../nfts/NFTPreview';
import { AddressBookContext } from './AddressBookProvider';

export default function ContactEdit() {
  const { contactid } = useParams();
  const navigate = useNavigate();
  const [, , removeAddress, getContactContactId] = useContext(AddressBookContext);
  const contact = getContactContactId(Number(contactid));

  // commented out - until this stops throwing an error when not a valid nft
  // const launcherId = launcherIdFromNFTId(contact.nftid ?? '');

  // const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId });

  function getImage() {
    // if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;
    return <img height={80} width={80} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }

  function handleRemove(contactId: number) {
    removeAddress(contactId);
    navigate(`/dashboard/addressbook/`);
  }

  return (
    <div>
      <Flex flexDirection="row" justifyContent="right" style={{ height: '80px', background: '#BBBBBB' }}>
        <Flex style={{ paddingRight: '30px' }}>
          <IconButton
            onClick={() => handleRemove(Number(contact.contactid))}
            sx={{
              position: 'absolute',
              right: 44,
              top: 44,
            }}
          >
            <DeleteOutlined />
          </IconButton>
          <IconButton
            sx={{
              position: 'absolute',
              right: 88,
              top: 44,
            }}
          >
            <SaveOutlined />
          </IconButton>
        </Flex>
      </Flex>

      <Flex flexDirection="column" gap={2} alignItems="center" style={{ marginTop: '-41px' }}>
        <Flex style={{ width: '600px' }}>{getImage()}</Flex>
        <Flex style={{ width: '600px' }}>
          <Flex alignSelf="flex-start">
            <h1>
              <Trans>{contact.name}</Trans>
            </h1>
          </Flex>
        </Flex>
        <Flex flexDirection="column" gap={2} style={{ width: '600px' }}>
          <TextField label={<Trans>Name</Trans>} value={contact.name} variant="filled" fullWidth />
          <TextField
            label={<Trans>Address</Trans>}
            value={contact.addresses[0]}
            variant="filled"
            inputProps={{
              'data-testid': 'WalletReceiveAddress-address',
            }}
            fullWidth
          />
        </Flex>
      </Flex>
    </div>
  );
}
