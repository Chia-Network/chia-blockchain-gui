// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { CopyToClipboard, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { EditOutlined } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// import { launcherIdFromNFTId } from '../../util/nfts';
// import NFTPreview from '../nfts/NFTPreview';
import { AddressBookContext } from './AddressBookProvider';

export default function ContactSummary() {
  const { contactid } = useParams();
  const navigate = useNavigate();
  const [, , , getContactContactId] = useContext(AddressBookContext);
  const contact = getContactContactId(Number(contactid));

  // commented out - until this stops throwing an error when not a valid nft
  // const launcherId = launcherIdFromNFTId(contact.nftid ?? '');

  // const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });

  if (contactid === undefined || contact === undefined) return <div />;

  function handleEditContact(id: number) {
    navigate(`/dashboard/addressbook/edit/${id}`);
  }

  function getImage() {
    // if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;
    return <img height={80} width={80} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }

  return (
    <div>
      <Flex flexDirection="row" justifyContent="right" style={{ height: '80px', background: '#BBBBBB' }}>
        <Flex style={{ paddingRight: '30px' }}>
          <IconButton
            onClick={() => handleEditContact(contactid)}
            sx={{
              position: 'absolute',
              right: 44,
              top: 44,
            }}
          >
            <EditOutlined />
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
        {contact.addresses.map((addressInfo) => (
          <Flex flexDirection="column" gap={2} style={{ width: '600px' }}>
            {addressInfo.name}
            <TextField
              label={<Trans>Address</Trans>}
              value={addressInfo.address}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value={addressInfo.address} />
                  </InputAdornment>
                ),
              }}
            />
          </Flex>
        ))}
        {contact.dids.map((addressInfo) => (
          <Flex flexDirection="column" gap={2} style={{ width: '600px' }}>
            Placeholder
            <TextField
              label={<Trans>DID</Trans>}
              value={addressInfo.did}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value={addressInfo.did} />
                  </InputAdornment>
                ),
              }}
            />
          </Flex>
        ))}
        {contact.domainnames.map((addressInfo) => (
          <Flex flexDirection="column" gap={2} style={{ width: '600px' }}>
            Placeholder
            <TextField
              label={<Trans>Domain</Trans>}
              value={addressInfo.domainname}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value={addressInfo.domainname} />
                  </InputAdornment>
                ),
              }}
            />
          </Flex>
        ))}
      </Flex>
    </div>
  );
}
