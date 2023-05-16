import { Form, TextField, TooltipIcon, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Add, Remove, SaveOutlined } from '@mui/icons-material';
import { IconButton, Typography, Box } from '@mui/material';
import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { AddressBookContext } from './AddressBookProvider';

export default function ContactAdd() {
  const [, addContact] = useContext(AddressBookContext);
  const [addresses, setAddresses] = useState([]);
  const [dids, setDIDs] = useState([]);
  const [domains, setDomains] = useState([]);
  const [name, setName] = useState([]);
  const navigate = useNavigate();

  const methods = useForm<ContactAddData>({
    name: '',
    notes: '',
    nftid: '',
  });

  function handleChange(i, type, e, stateVar, setStateVar) {
    const newList = [...stateVar];
    newList[i][type] = e.target.value;
    setStateVar(newList);
  }

  function addField(type, stateVar, setStateVar) {
    setStateVar([...stateVar, { name: '', [type]: '' }]);
  }

  function removeField(i, stateVar, setStateVar) {
    const newList = [...stateVar];
    newList.splice(i, 1);
    setStateVar(newList);
  }

  function addDefaultName(entry, i, type, stateVar, setStateVar) {
    const newList = [...stateVar];
    if (newList[i].name === '') {
      newList[i].name = newList[i][type];
    }
    setStateVar(newList);
  }

  async function handleSubmit(data: ContactAddData) {
    if (addresses.length === 0) throw new Error('At least one Address must be provided to create contact');
    if (addresses.name === 0) throw new Error('Name must be provided to create a contact');
    addresses.map((entry, index) => addDefaultName(entry, index, 'address', addresses, setAddresses));
    dids.map((entry, index) => addDefaultName(entry, index, 'did', dids, setDIDs));
    domains.map((entry, index) => addDefaultName(entry, index, 'domainname', domains, setDomains));
    addContact(data.name, addresses, dids, data.notes, data.nftid, domains);
    navigate(`/dashboard/addressbook/`);
  }

  return (
    <div>
      <Form methods={methods} key={0} onSubmit={handleSubmit}>
        <Flex flexDirection="row" justifyContent="right" style={{ height: '80px', background: '#CCDDE1' }}>
          <Flex flexGrow={1}>
            <Typography
              variant="h5"
              sx={{
                position: 'absolute',
                left: 44,
                top: 48,
              }}
            >
              <Trans>Create Contact</Trans>
              &nbsp;
              <TooltipIcon>
                <Trans>
                  Creating a contact enables you to keep track of people who you know and store information such as
                  their DIDs, Profile NFT or Websites.
                </Trans>
              </TooltipIcon>
            </Typography>
          </Flex>
          <Flex style={{ paddingRight: '30px' }}>
            <IconButton
              sx={{
                position: 'absolute',
                right: 44,
                top: 44,
              }}
              type="submit"
            >
              <SaveOutlined />
            </IconButton>
          </Flex>
        </Flex>
        <Flex flexDirection="column" gap={6} alignItems="center" style={{ paddingBottom: '40px' }}>
          <Flex flexDirection="column" gap={6} style={{ width: '600px', paddingTop: '40px' }}>
            <Flex gap={2} flexDirection="column">
              <Typography variant="h6">
                <Trans>Contact Name</Trans>
              </Typography>
              <TextField
                name="name"
                variant="filled"
                color="secondary"
                fullWidth
                disabled={false}
                label={<Trans>Name</Trans>}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Flex>
            {/*
            <Flex gap={2} flexDirection="column">
              <Typography variant="h6">
                <Trans>NFT ID</Trans>
              </Typography>
              <TextField
                name="nftid"
                variant="filled"
                color="secondary"
                fullWidth
                disabled={false}
                label={<Trans>NFTID</Trans>}
                data-testid="WalletCATSend-address"
              />
            </Flex>
            */}
            <Flex gap={2} flexDirection="column">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  <Trans>Addresses</Trans>
                </Typography>
                <IconButton onClick={() => addField('address', addresses, setAddresses)}>
                  <Add />
                </IconButton>
              </Box>
              {addresses.map((element, index) => (
                <div>
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <TextField
                      name="addressName"
                      variant="filled"
                      color="secondary"
                      fullWidth
                      disabled={false}
                      label={<Trans>Name</Trans>}
                      value={element.name || ''}
                      onChange={(e) => handleChange(index, 'name', e, addresses, setAddresses)}
                    />
                    <TextField
                      name="address"
                      variant="filled"
                      color="secondary"
                      fullWidth
                      disabled={false}
                      label={<Trans>Address</Trans>}
                      value={addresses[index].address}
                      onChange={(e) => handleChange(index, 'address', e, addresses, setAddresses)}
                    />
                    <IconButton onClick={() => removeField(index, addresses, setAddresses)}>
                      <Remove />
                    </IconButton>
                  </Box>
                </div>
              ))}
            </Flex>
            <Flex gap={2} flexDirection="column">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  <Trans>DIDs</Trans>
                </Typography>
                <IconButton onClick={() => addField('did', dids, setDIDs)}>
                  <Add />
                </IconButton>
              </Box>
              {dids.map((element, index) => (
                <div>
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <TextField
                      name="didName"
                      variant="filled"
                      color="secondary"
                      fullWidth
                      disabled={false}
                      label={<Trans>Name</Trans>}
                      value={element.name || ''}
                      onChange={(e) => handleChange(index, 'name', e, dids, setDIDs)}
                    />
                    <TextField
                      name="did"
                      variant="filled"
                      color="secondary"
                      fullWidth
                      disabled={false}
                      label={<Trans>DID</Trans>}
                      value={dids[index].did}
                      onChange={(e) => handleChange(index, 'did', e, dids, setDIDs)}
                    />
                    <IconButton onClick={() => removeField(index, dids, setDIDs)}>
                      <Remove />
                    </IconButton>
                  </Box>
                </div>
              ))}
            </Flex>
            <Flex gap={2} flexDirection="column">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  <Trans>Domain Names</Trans>
                </Typography>
                <IconButton onClick={() => addField('domainname', domains, setDomains)}>
                  <Add />
                </IconButton>
              </Box>
              {domains.map((element, index) => (
                <div>
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <TextField
                      name="domainName"
                      variant="filled"
                      color="secondary"
                      fullWidth
                      disabled={false}
                      label={<Trans>Name</Trans>}
                      value={element.name || ''}
                      onChange={(e) => handleChange(index, 'name', e, domains, setDomains)}
                    />
                    <TextField
                      name="domain"
                      variant="filled"
                      color="secondary"
                      fullWidth
                      disabled={false}
                      label={<Trans>Domain</Trans>}
                      value={domains[index].domainname}
                      onChange={(e) => handleChange(index, 'domainname', e, domains, setDomains)}
                    />
                    <IconButton onClick={() => removeField(index, domains, setDomains)}>
                      <Remove />
                    </IconButton>
                  </Box>
                </div>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Form>
    </div>
  );
}

type ContactAddData = {
  name: string;
  notes: string;
  nftid: string;
};
