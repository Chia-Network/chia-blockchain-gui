import { ButtonLoading, Flex } from '@chia-network/core';
import type { IAddressContact } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { TextField, Typography } from '@mui/material';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import AddressBookMenuItem from './AddressBookMenuItem';
import { AddressBookContext } from './AddressBookProvider';

export default function AddressBookSideBar() {
  const [filter, setFilter] = useState<string>('');
  const navigate = useNavigate();
  const [addressBook, ,] = useContext(AddressBookContext);

  // Function that filters a contact by a child property using either
  // - address.name or address.address
  // - did
  // - domain name
  // - contact name
  function filterArray(arrayList, search: string) {
    return arrayList.filter((item: IAddressContact) => {
      const { dids, domainnames, addresses, name } = item;

      if (search === '') return true;

      // filter by address name or address
      if (addresses && addresses.length > 0) {
        const filteredAddressesByName = addresses.filter(
          (t: any) =>
            (t.name && t.name.toLowerCase() === search.toLowerCase()) ||
            (t.address && t.address.toLowerCase() === search.toLowerCase())
        );
        if (filteredAddressesByName && filteredAddressesByName.length > 0) {
          return true;
        }
      }

      // filter by did
      if (dids && dids.length > 0) {
        const filteredDids = dids.filter((did: any) => did.did && did.did.toLowerCase() === search.toLowerCase());
        if (filteredDids && filteredDids.length > 0) {
          return true;
        }
      }

      if (domainnames && domainnames.length > 0) {
        const filteredDomains = domainnames.filter(
          (domain: any) => domain.domainname && domain.domainname.toLowerCase() === search.toLowerCase()
        );
        if (filteredDomains && filteredDomains.length > 0) {
          return true;
        }
      }

      // filter by name
      if (name.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }

      // filter didn't match any criteria
      return false;
    });
  }

  function listOfContacts() {
    if (addressBook !== undefined) {
      if (filter === '') {
        return addressBook.map((contact: IAddressContact) => <AddressBookMenuItem contact={contact} />);
      }

      const filtered = filterArray(addressBook, filter);

      return filtered.map((contact: IAddressContact) => <AddressBookMenuItem contact={contact} />);
    }
    return <div>No Contacts</div>;
  }

  function handleCreateNewContact() {
    navigate('/dashboard/addressbook/new');
  }

  function handleFilterChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setFilter(e.target.value);
  }

  return (
    <div style={{ padding: '10px', minWidth: '390px', maxWidth: '500px' }}>
      <Typography variant="h5">
        <Trans>Addresses</Trans>
      </Typography>
      <Flex flexDirection="column" gap={2.5}>
        <Flex flexDirection="column" gap={2.5}>
          <ButtonLoading variant="contained" color="primary" onClick={handleCreateNewContact} disableElevation>
            <Trans>New Contact</Trans>
          </ButtonLoading>
        </Flex>
        <TextField
          name="name"
          variant="filled"
          color="secondary"
          fullWidth
          disabled={false}
          label={<Trans>Filter</Trans>}
          data-testid="WalletCATSend-address"
          onChange={handleFilterChanged}
        />
        <Flex flexDirection="column" gap={1.5}>
          {listOfContacts()}
        </Flex>
      </Flex>
    </div>
  );
}
