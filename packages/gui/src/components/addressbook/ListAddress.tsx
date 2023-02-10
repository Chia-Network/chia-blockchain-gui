import { Button, ButtonLoading, Card, Flex, useAddressBook } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ListAddress() {
  const [addresses] = useAddressBook();
  useEffect(() => {}, [addresses]);
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
        <Link to="/dashboard/addressbook/add">
          <ButtonLoading type="submit" variant="contained" color="primary" loading={false}>
            <Trans>Create</Trans>
          </ButtonLoading>
        </Link>
      </Flex>
      <Card>
        <TableBody>
          {addresses.map((row, index) => (
            // eslint-disable-next-line react/no-array-index-key -- Number of rows never change
            <TableRow key={index}>
              <TableCell component="th" fullwidth scope="row">
                {row.friendlyname}
              </TableCell>
              <TableCell onClick={row.onClick} align="right">
                {row.address}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Card>
    </Flex>
  );
}
