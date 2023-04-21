import { Form, Flex, ButtonLoading, TextField, Table } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Remove } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

function AddressesTable(props) {
  const cols = useMemo(() => {
    function removeAddress(data) {
      props.addresses.splice(data.$uniqueId, 1);
      props.setAddresses([...props.addresses]);
    }

    return [
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: any) => <div>{row.name}</div>,
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Name</Trans>,
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: any) => <div>{row.address}</div>,
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Address</Trans>,
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: any) => (
          <Box>
            <IconButton onClick={() => removeAddress(row)}>
              <Remove />
            </IconButton>
          </Box>
        ),
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Remove</Trans>,
      },
    ];
  }, [props]);

  return (
    <Table
      rows={props.addresses}
      cols={cols}
      rowsPerPageOptions={[5, 25, 100]}
      rowsPerPage={25}
      pages={5}
      isLoading={false}
    />
  );
}

export default function ContactAddressTable(props) {
  function handleSubmit(data: ContactAddressData) {
    props.addresses.push({ name: data.name, address: data.address });
    props.setAddresses([...props.addresses]);
  }

  const methods = useForm<ContactAddressData>({
    name: '',
    address: '',
  });

  return (
    <div>
      <Form name="addresses" methods={methods} key={2} onSubmit={handleSubmit}>
        <Flex justifyContent="flex-stretch" fullWidth gap={1}>
          <TextField
            name="name"
            variant="filled"
            color="secondary"
            fullWidth
            disabled={false}
            label={<Trans>Name</Trans>}
            data-testid="WalletCATSend-name"
          />
          <TextField
            name="address"
            variant="filled"
            color="secondary"
            fullWidth
            disabled={false}
            label={<Trans>Address</Trans>}
            data-testid="WalletCATSend-address"
          />
          <ButtonLoading variant="contained" color="primary" type="submit" loading={false} data-testid="WalletSend-add">
            <Trans>Add</Trans>
          </ButtonLoading>
        </Flex>
      </Form>
      <AddressesTable addresses={props.addresses} setAddresses={props.setAddresses} />
    </div>
  );
}

type ContactAddressData = {
  name: string;
  address: string;
};
