import type { AddressContact } from '@chia-network/core';
import { AddressBookContext, ButtonLoading, CardListItem, Flex, LayoutDashboardSub } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Divider, TextField, Typography } from '@mui/material';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import AddressBookMenuItem from './AddressBookMenuItem';

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
    return arrayList.filter((item: AddressContact) => {
      const { dids, domainNames, addresses, name } = item;

      if (search === '') return true;

      // filter by address name or address
      if (addresses && addresses.length > 0) {
        const filteredAddressesByName = addresses.filter(
          (t: any) =>
            (t.name && t.name.toLowerCase().includes(search.toLowerCase())) ||
            (t.address && t.address.toLowerCase().includes(search.toLowerCase()))
        );
        if (filteredAddressesByName && filteredAddressesByName.length > 0) {
          return true;
        }
      }

      // filter by did
      if (dids && dids.length > 0) {
        const filteredDids = dids.filter(
          (did: any) =>
            (did.name && did.name.toLowerCase().includes(search.toLowerCase())) ||
            (did.did && did.did.toLowerCase().includes(search.toLowerCase()))
        );
        if (filteredDids && filteredDids.length > 0) {
          return true;
        }
      }

      if (domainNames && domainNames.length > 0) {
        const filteredDomains = domainNames.filter(
          (domain: any) =>
            (domain.name && domain.name.toLowerCase().includes(search.toLowerCase())) ||
            (domain.domainname && domain.domainname.toLowerCase().includes(search.toLowerCase()))
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
      const orderedContacts = addressBook.sort((a, b) => a.name.localeCompare(b.name));
      if (filter === '') {
        return orderedContacts.map((contact: AddressContact) => <AddressBookMenuItem contact={contact} />);
      }

      const filtered = filterArray(orderedContacts, filter);

      return filtered.map((contact: AddressContact) => <AddressBookMenuItem contact={contact} />);
    }
    return <div>No Contacts</div>;
  }

  function handleCreateNewContact() {
    navigate('/dashboard/addressbook/new');
  }

  function handleFilterChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setFilter(e.target.value);
  }

  function handleSelectMyContact() {
    navigate(`/dashboard/addressbook/myContact`);
  }

  return (
    <LayoutDashboardSub>
      <Flex
        flexDirection="column"
        gap={1.5}
        minWidth="300px"
        sx={{
          overflowY: 'auto',
          scrollBehavior: 'auto',
          '::-webkit-scrollbar': {
            background: 'transparent',
            width: '0px',
          },
        }}
      >
        <Typography variant="h5">
          <Trans>Contacts</Trans>
        </Typography>
        <Flex gap={2} flexDirection="column">
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
            <CardListItem onSelect={() => handleSelectMyContact()}>
              <div
                style={{
                  display: 'flex',
                  minHeight: '40px',
                  height: '40px',
                  paddingBottom: '0px',
                }}
              >
                <div
                  style={{ flexGrow: 4, flexBasis: '100', paddingLeft: '10px', paddingTop: '8px', overflow: 'hidden' }}
                >
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>My Contact Info</span>
                  </div>
                </div>
              </div>
            </CardListItem>
          </Flex>
          <Divider />
          <Flex flexDirection="column" gap={1.5}>
            <Flex flexDirection="column" gap={2.5}>
              <ButtonLoading variant="contained" color="primary" onClick={handleCreateNewContact} disableElevation>
                <Trans>New Contact</Trans>
              </ButtonLoading>
            </Flex>
            {listOfContacts()}
          </Flex>
        </Flex>
      </Flex>
    </LayoutDashboardSub>
  );
}
