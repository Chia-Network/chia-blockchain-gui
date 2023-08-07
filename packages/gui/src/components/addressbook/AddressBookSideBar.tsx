import type { AddressContact } from '@chia-network/core';
import { AddressBookContext, CardListItem, Color, Flex, LayoutDashboardSub, Tooltip } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { Add, Search as SearchIcon } from '@mui/icons-material';
import { Divider, IconButton, InputBase, Typography, useTheme } from '@mui/material';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import AddressBookMenuItem from './AddressBookMenuItem';

export default function AddressBookSideBar() {
  const theme: any = useTheme();
  const [filter, setFilter] = useState<string>('');
  const navigate = useNavigate();
  const [addressBook] = useContext(AddressBookContext);

  // Function that filters a contact by a child property using either
  // - address.name or address.address
  // - did
  // - domain name
  // - contact name
  function filterArray(arrayList, search: string) {
    return arrayList.filter((item: AddressContact) => {
      const { dids, domainNames, addresses, name } = item;

      if (search === '') return true;

      const searchTerm = search.toLowerCase();

      // filter by address name or address
      if (addresses && addresses.length > 0) {
        const filteredAddressesByName = addresses.filter(
          (addr: any) =>
            (addr.name && addr.name.toLowerCase().includes(searchTerm)) ||
            (addr.address && addr.address.toLowerCase().includes(searchTerm))
        );
        if (filteredAddressesByName && filteredAddressesByName.length > 0) {
          return true;
        }
      }

      // filter by did
      if (dids && dids.length > 0) {
        const filteredDids = dids.filter(
          (did: any) =>
            (did.name && did.name.toLowerCase().includes(searchTerm)) ||
            (did.did && did.did.toLowerCase().includes(searchTerm))
        );
        if (filteredDids && filteredDids.length > 0) {
          return true;
        }
      }

      if (domainNames && domainNames.length > 0) {
        const filteredDomains = domainNames.filter(
          (domain: any) =>
            (domain.name && domain.name.toLowerCase().includes(searchTerm)) ||
            (domain.domain && domain.domain.toLowerCase().includes(searchTerm))
        );
        if (filteredDomains && filteredDomains.length > 0) {
          return true;
        }
      }

      // filter by name
      if (name.toLowerCase().includes(searchTerm)) {
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
    return (
      <div>
        <Trans>No Contacts</Trans>
      </div>
    );
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
        <Flex flexDirection="row" alignItems="center">
          <Flex flexGrow={1}>
            <Typography variant="h5">
              <Trans>Contacts</Trans>
            </Typography>
          </Flex>
          <Flex>
            <Tooltip title={<Trans>Add Contact</Trans>}>
              <IconButton onClick={handleCreateNewContact}>
                <Add color="info" />
              </IconButton>
            </Tooltip>
          </Flex>
        </Flex>
        <Flex
          gap={1}
          alignItems="center"
          sx={{
            borderColor: theme.palette.mode === 'dark' ? Color.Neutral[700] : Color.Neutral[300],
            backgroundColor: 'background.paper',
            paddingX: 1,
            paddingY: 0.5,
            borderRadius: 1,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          <SearchIcon sx={{ color: theme.palette.mode === 'dark' ? Color.Neutral[400] : Color.Neutral[500] }} />
          <InputBase onChange={handleFilterChanged} placeholder={t`Search...`} />
        </Flex>
        <Flex gap={2} flexDirection="column">
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
            {listOfContacts()}
          </Flex>
        </Flex>
      </Flex>
    </LayoutDashboardSub>
  );
}
