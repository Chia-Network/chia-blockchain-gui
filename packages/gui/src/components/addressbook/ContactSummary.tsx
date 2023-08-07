// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import {
  AddressBookContext,
  ConfirmDialog,
  CopyToClipboard,
  Flex,
  MenuItem,
  More,
  useOpenDialog,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Delete, Edit } from '@mui/icons-material';
import { InputAdornment, ListItemIcon, TextField, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// import { launcherIdFromNFTId } from '../../util/nfts';
// import NFTPreview from '../nfts/NFTPreview';

export default function ContactSummary() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [, , removeAddress, getContactContactId] = useContext(AddressBookContext);
  const contact = getContactContactId(Number(contactId));
  const openDialog = useOpenDialog();

  // commented out - until this stops throwing an error when not a valid nft
  // const launcherId = launcherIdFromNFTId(contact.nftId ?? '');

  // const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });

  if (contactId === undefined || contact === undefined) return <div />;

  function handleEditContact(id: number) {
    navigate(`/dashboard/addressbook/edit/${id}`);
  }

  async function handleRemove(id: number) {
    const deleteContact = await openDialog(
      <ConfirmDialog
        title={<Trans>Delete contact</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        cancelTitle={<Trans>Cancel</Trans>}
        confirmColor="danger"
      >
        <Trans>
          Are you sure you want to permanently delete this contact? Once deleted, this contact cannot be recovered.
        </Trans>
      </ConfirmDialog>
    );

    if (deleteContact) {
      removeAddress(id);
      navigate(`/dashboard/addressbook/`);
    }
  }

  /*
  function getImage() {
    // if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;
    return <img height={80} width={80} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }
  */

  function showAddresses() {
    if (!contact.addresses || contact.addresses.length === 0) {
      return null;
    }
    return (
      <Flex flexDirection="column" gap={3} flexGrow={1}>
        <Typography variant="h6">Addresses</Typography>
        <Flex flexDirection="column" gap={3} flexGrow={1}>
          {contact.addresses.map((addressInfo) => (
            <TextField
              label={addressInfo.name}
              value={addressInfo.address}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value={addressInfo.address} />
                  </InputAdornment>
                ),
              }}
            />
          ))}
        </Flex>
      </Flex>
    );
  }

  function showDIDs() {
    if (!contact.dids || contact.dids.length === 0) {
      return null;
    }
    return (
      <Flex flexDirection="column" gap={3} flexGrow={1}>
        <Typography variant="h6">Profiles</Typography>
        <Flex flexDirection="column" gap={3} flexGrow={1}>
          {contact.dids.map((didInfo) => (
            <TextField
              label={didInfo.name}
              value={didInfo.did}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value={didInfo.did} />
                  </InputAdornment>
                ),
              }}
            />
          ))}
        </Flex>
      </Flex>
    );
  }

  function showDomains() {
    if (!contact.domainNames || contact.domainNames.length === 0) {
      return null;
    }
    return (
      <Flex flexDirection="column" gap={3} flexGrow={1}>
        <Typography variant="h6">Domain Names</Typography>
        <Flex flexDirection="column" gap={3} flexGrow={1}>
          {contact.domainNames.map((domainInfo) => (
            <TextField
              label={domainInfo.name}
              value={domainInfo.domain}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value={domainInfo.domain} />
                  </InputAdornment>
                ),
              }}
            />
          ))}
        </Flex>
      </Flex>
    );
  }

  return (
    <div>
      <Flex flexDirection="column" gap={1} alignItems="left" style={{ paddingLeft: '44px', paddingRight: '44px' }}>
        <Flex flexDirection="row" alignItems="center" style={{ paddingTop: '4px' }}>
          <Flex flexGrow={1}>
            <Typography variant="h5">
              <Trans>{contact.name}</Trans>
            </Typography>
          </Flex>
          <Flex>
            <More>
              <MenuItem onClick={() => handleEditContact(contactId)} close>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Edit Contact</Trans>
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => handleRemove(Number(contact.contactId))} close>
                <ListItemIcon>
                  <Delete fontSize="small" />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Delete Contact</Trans>
                </Typography>
              </MenuItem>
            </More>
          </Flex>
        </Flex>
        <Flex flexDirection="column" gap={6} style={{ width: '100%', paddingTop: '40px' }}>
          {/*
          <Flex style={{ width: '600px' }}>{getImage()}</Flex>
          <Flex style={{ width: '600px' }}>
            <Flex alignSelf="flex-start">
              <h1>
                <Trans>{contact.name}</Trans>
              </h1>
            </Flex>
          </Flex>
          */}
          <Flex flexDirection="column" gap={6} style={{ width: '100%' }}>
            {showAddresses()}
            {showDIDs()}
            {showDomains()}
          </Flex>
        </Flex>
      </Flex>
    </div>
  );
}
