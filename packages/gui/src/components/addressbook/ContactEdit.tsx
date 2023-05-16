// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { SaveOutlined, DeleteOutlined } from '@mui/icons-material';
import { TextField, IconButton, Typography } from '@mui/material';
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

  /*
  function getImage() {
    // if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;
    return <img height={80} width={80} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }
  */

  function handleRemove(contactId: number) {
    removeAddress(contactId);
    navigate(`/dashboard/addressbook/`);
  }

  return (
    <div>
      <Flex flexDirection="row" justifyContent="right" style={{ height: '80px', background: '#CCDDE1' }}>
        <Flex style={{ paddingRight: '30px' }}>
          <Typography
            variant="h5"
            sx={{
              position: 'absolute',
              left: 44,
              top: 48,
            }}
          >
            <Trans>{contact.name}</Trans>
          </Typography>
          <IconButton
            sx={{
              position: 'absolute',
              right: 44,
              top: 44,
            }}
          >
            <SaveOutlined />
          </IconButton>
          <IconButton
            onClick={() => handleRemove(Number(contact.contactid))}
            sx={{
              position: 'absolute',
              right: 88,
              top: 44,
            }}
          >
            <DeleteOutlined />
          </IconButton>
        </Flex>
      </Flex>

      <Flex flexDirection="column" gap={2} alignItems="center" style={{ marginTop: '40px', paddingBottom: '40px' }}>
        <Flex flexDirection="column" gap={6}>
          {contact.addresses.map((addressInfo) => (
            <Flex flexDirection="column" gap={3} style={{ width: '600px' }}>
              <Typography variant="h6">{addressInfo.name}</Typography>
              <TextField label={<Trans>Address</Trans>} value={addressInfo.address} fullWidth />
            </Flex>
          ))}
          {contact.dids.map((didInfo) => (
            <Flex flexDirection="column" gap={3} style={{ width: '600px' }}>
              <Typography variant="h6">{didInfo.name}</Typography>
              <TextField label={<Trans>DID</Trans>} value={didInfo.did} fullWidth />
            </Flex>
          ))}
          {contact.domainnames.map((domainInfo) => (
            <Flex flexDirection="column" gap={3} style={{ width: '600px' }}>
              <Typography variant="h6">{domainInfo.name}</Typography>
              <TextField label={<Trans>Domain</Trans>} value={domainInfo.domainname} fullWidth />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </div>
  );
}
