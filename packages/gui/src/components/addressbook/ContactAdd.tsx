import { ButtonLoading, Form, TextField, Card, TooltipIcon, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Box } from '@mui/material';
import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { AddressBookContext } from './AddressBookProvider';
import ContactAddressTable from './ContactAddressTable';
import ContactDIDSTable from './ContactDIDSTable';
import ContactDomainNamesTable from './ContactDomainNamesTable';

export default function ContactAdd() {
  const [, addContact] = useContext(AddressBookContext);
  const [addresses, setAddresses] = useState([]);
  const [dids, setDIDS] = useState([]);
  const [domainNames, setDomainNames] = useState([]);
  const [name, setName] = useState([]);
  const navigate = useNavigate();

  const methods = useForm<ContactAddData>({
    name: '',
    notes: '',
    nftid: '',
  });

  async function handleSubmit(data: ContactAddData) {
    if (addresses.length === 0) throw new Error('At least one Address must be provided to create contact');
    if (addresses.name === 0) throw new Error('Name must be provided to create a contact');
    addContact(data.name, addresses, dids, data.notes, data.nftid, domainNames);
    navigate(`/dashboard/addressbook/`);
  }

  return (
    <Flex flexDirection="column" gap={2.5}>
      <Typography variant="h6">
        <Trans>Create Contact</Trans>
        &nbsp;
        <TooltipIcon>
          <Trans>
            Creating a contact enables you to keep track of people who you know and store information such as their
            DIDs, Profile NFT or Websites.
          </Trans>
        </TooltipIcon>
      </Typography>
      <Card>
        <Form methods={methods} key={0} onSubmit={handleSubmit}>
          <Flex gap={2} flexDirection="column">
            <Card title={<Trans>Name</Trans>} titleVariant="h6" transparent>
              <TextField
                name="name"
                variant="filled"
                color="secondary"
                fullWidth
                disabled={false}
                label={<Trans>Name</Trans>}
                data-testid="WalletCATSend-address"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Card>

            <Card title={<Trans>NFT ID</Trans>} titleVariant="h6" transparent>
              <TextField
                name="nftid"
                variant="filled"
                color="secondary"
                fullWidth
                disabled={false}
                label={<Trans>NFTID</Trans>}
                data-testid="WalletCATSend-address"
              />
            </Card>
            <Flex justifyContent="flex-end" gap={1}>
              <ButtonLoading
                variant="contained"
                color="primary"
                type="submit"
                loading={false}
                data-testid="WalletSend-send"
              >
                <Trans>Create</Trans>
              </ButtonLoading>
            </Flex>
          </Flex>
        </Form>
      </Card>

      <Box display="block">
        <Flex flexDirection="column" gap={4}>
          <Card title={<Trans>Addresses</Trans>} titleVariant="h6">
            <ContactAddressTable addresses={addresses} setAddresses={setAddresses} />
          </Card>
        </Flex>
      </Box>

      <Box display="block">
        <Flex flexDirection="column" gap={4}>
          <Card title={<Trans>DIDS</Trans>} titleVariant="h6">
            <ContactDIDSTable dids={dids} setDIDS={setDIDS} />
          </Card>
        </Flex>
      </Box>

      <Box display="block">
        <Flex flexDirection="column" gap={4}>
          <Card title={<Trans>Domain Names</Trans>} titleVariant="h6">
            <ContactDomainNamesTable domainnames={domainNames} setDomainNames={setDomainNames} />
          </Card>
        </Flex>
      </Box>
    </Flex>
  );
}

type ContactAddData = {
  name: string;
  notes: string;
  nftid: string;
};
