import { Flex, ButtonLoading, Form, TextField, Table } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Remove } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

function DIDSTable(props) {
  const cols = useMemo(() => {
    function removeDID(data: any) {
      props.dids.splice(data.$uniqueId, 1);
      props.setDIDS([...props.dids]);
    }
    return [
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: any) => <div>{row.did}</div>,
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Status</Trans>,
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: any) => (
          <Box>
            <IconButton onClick={() => removeDID(row)}>
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
      rows={props.dids}
      cols={cols}
      rowsPerPageOptions={[5, 25, 100]}
      rowsPerPage={25}
      pages={5}
      isLoading={false}
    />
  );
}

export default function ContactDIDSTable(props: any) {
  const methods = useForm<DIDData>({
    DID: '',
  });

  function handleSubmit(data: DIDData) {
    props.dids.push({ did: data.DID });
    props.setDIDS([...props.dids]);
  }

  return (
    <Form name="addresses" methods={methods} key={2} onSubmit={handleSubmit}>
      <Flex justifyContent="flex-stretch" fullWidth gap={1}>
        <TextField
          name="DID"
          variant="filled"
          color="secondary"
          fullWidth
          disabled={false}
          label={<Trans>DID</Trans>}
          data-testid="WalletCATSend-DID"
        />
        <ButtonLoading variant="contained" color="primary" type="submit" loading={false} data-testid="WalletSend-send">
          <Trans>Add</Trans>
        </ButtonLoading>
      </Flex>
      <DIDSTable dids={props.dids} setDIDS={props.setDIDS} />
    </Form>
  );
}

type DIDData = {
  DID: string;
};
