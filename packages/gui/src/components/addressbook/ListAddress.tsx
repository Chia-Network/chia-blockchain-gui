import { Button, Card, Flex, useAddressBook, TableControlled, Row } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Tooltip } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const cols = (address: IAddressContact) => [
  {
    width: '100%',
    field: (row: Row) => (
      <Flex gap={1}>
        <Tooltip title={<Trans>Address</Trans>}>
          <span>
            <Trans>{row.address}</Trans>
          </span>
        </Tooltip>
      </Flex>
    ),
    title: <Trans>Address</Trans>,
  },
  {
    field: (row: Row) => (
      <Flex gap={1}>
        <Tooltip title={<Trans>Friendly Name</Trans>}>
          <span>
            <Trans>{row.friendlyname}</Trans>
          </span>
        </Tooltip>
      </Flex>
    ),
    title: <Trans>Friendly Name</Trans>,
  },
  {
    field: (row: Row) => (
      <Flex gap={1}>
        <Tooltip title={<Trans>Remove Address</Trans>}>
          <Button
            type="button"
            onClick={() => console.log('Attempting to remove contact')}
            variant="contained"
            color="secondary"
          >
            <Trans>Remove</Trans>
          </Button>
        </Tooltip>
      </Flex>
    ),
  },
];

export default function ListAddress() {
  const navigate = useNavigate();
  const [addresses] = useAddressBook();
  useEffect(() => {}, [addresses]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [page, setPage] = useState<number>(0);
  function handlePageChange(rowsPerPageLocal: number, pageLocal: number) {
    setRowsPerPage(rowsPerPageLocal);
    setPage(pageLocal);
  }

  function createNewContact() {
    navigate('/dashboard/addressbook/add');
  }

  return (
    <Flex flexDirection="column" gap={4} alignItems="stretch">
      <Flex gap={4} flexDirection="column">
        <Flex flexDirection="column" gap={1}>
          <Typography variant="h5">
            <Trans>Address Book</Trans>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <Trans>Address book is a way of managing addresses using a friendly name.</Trans>
          </Typography>
        </Flex>
      </Flex>
      <Flex justifyContent="flex-end">
        <Button type="button" onClick={createNewContact} variant="contained" color="primary" loading={false}>
          <Trans>Create</Trans>
        </Button>
      </Flex>
      <Card>
        <TableControlled
          cols={cols()}
          rows={addresses ?? []}
          rowsPerPageOptions={[5, 10, 25, 50, 10]}
          page={page}
          rowsPerPage={rowsPerPage}
          count={addresses?.length}
          isLoading={false}
          expandedCellShift={0}
          onPageChange={handlePageChange}
          uniqueField="name"
          caption={
            !addresses?.length && (
              <Typography variant="body2" align="center">
                <Trans>No Contacts</Trans>
              </Typography>
            )
          }
          pages={!!addresses?.length}
        />
      </Card>
    </Flex>
  );
}
