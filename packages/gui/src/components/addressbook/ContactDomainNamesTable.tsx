import { Flex, ButtonLoading, Form, TextField, Table } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Remove } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

function DomainsTable(props) {
  const cols = useMemo(() => {
    function removeDomain(data: any) {
      props.domainnames.splice(data.$uniqueId, 1);
      props.setDomainNames([...props.domainnames]);
    }

    return [
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: any) => <div>{row.domainname}</div>,
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Domain</Trans>,
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: any) => (
          <Box>
            <IconButton onClick={() => removeDomain(row)}>
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
      rows={props.domainnames}
      cols={cols}
      rowsPerPageOptions={[5, 25, 100]}
      rowsPerPage={25}
      pages={5}
      isLoading={false}
    />
  );
}

export default function ContactDomainNamesTable(props: any) {
  const methods = useForm<DomainData>({
    Domain: '',
  });

  function handleSubmit(data: DomainData) {
    props.domainnames.push({ domainname: data.Domain });
    props.setDomainNames([...props.domainnames]);
  }

  return (
    <Form name="domainnames" methods={methods} key={2} onSubmit={handleSubmit}>
      <Flex justifyContent="flex-stretch" fullWidth gap={1}>
        <TextField
          name="Domain"
          variant="filled"
          color="secondary"
          fullWidth
          disabled={false}
          label={<Trans>Domain</Trans>}
          data-testid="WalletCATSend-Domain"
        />
        <ButtonLoading variant="contained" color="primary" type="submit" loading={false} data-testid="WalletSend-send">
          <Trans>Add</Trans>
        </ButtonLoading>
      </Flex>
      <DomainsTable domainnames={props.domainnames} setDomainNames={props.setDomainNames} />
    </Form>
  );
}

type DomainData = {
  Domain: string;
};
