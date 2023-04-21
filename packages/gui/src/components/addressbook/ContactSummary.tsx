// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { CopyToClipboard, CardHero, Flex, Card, Table } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { ModeEdit } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// import { launcherIdFromNFTId } from '../../util/nfts';
// import NFTPreview from '../nfts/NFTPreview';
import { AddressBookContext } from './AddressBookProvider';

export default function ContactSummary() {
  const { contactid } = useParams();
  const navigate = useNavigate();
  const [, , , getContactContactId] = useContext(AddressBookContext);
  const contact = getContactContactId(Number(contactid));

  // commented out - until this stops throwing an error when not a valid nft
  // const launcherId = launcherIdFromNFTId(contact.nftid ?? '');

  // const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });

  if (contactid === undefined || contact === undefined) return <div />;

  function handleEditContact(id: number) {
    navigate(`/dashboard/addressbook/edit/${id}`);
  }

  function getImage() {
    // if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;
    return <img height={50} width={50} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }

  const addressCols = [
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
        <Flex alignItems="center" gap={1}>
          <CopyToClipboard value={row.address} fontSize="small" />
        </Flex>
      ),
      minWidth: '170px',
      maxWidth: '170px',
      title: <Trans>Action</Trans>,
    },
  ];

  const didCols = [
    {
      // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
      field: (row: any) => <div>{row.did}</div>,
      minWidth: '170px',
      maxWidth: '170px',
      title: <Trans>DID</Trans>,
    },
    {
      // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
      field: (row: any) => (
        <Flex alignItems="center" gap={1}>
          <CopyToClipboard value={row.did} fontSize="small" />
        </Flex>
      ),
      minWidth: '170px',
      maxWidth: '170px',
      title: <Trans>Action</Trans>,
    },
  ];

  const domainCols = [
    {
      // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
      field: (row: any) => <div>{row.domainname}</div>,
      minWidth: '170px',
      maxWidth: '170px',
      title: <Trans>DomainName</Trans>,
    },
    {
      // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
      field: (row: any) => (
        <Flex alignItems="center" gap={1}>
          <CopyToClipboard value={row.domainname} fontSize="small" />
        </Flex>
      ),
      minWidth: '170px',
      maxWidth: '170px',
      title: <Trans>Action</Trans>,
    },
  ];

  return (
    <div>
      <CardHero variant="outlined" style={{ backgroundColor: 'blue' }}>
        <Flex
          flexDirection="column"
          flexGrow={1}
          alignItems="flex-end"
          justifyContent="flex-end"
          style={{ paddingBottom: '1em' }}
        >
          <Typography>
            <IconButton onClick={() => handleEditContact(contactid)}>
              <ModeEdit />
            </IconButton>
          </Typography>
        </Flex>
      </CardHero>

      <div style={{ width: '95%', margin: 'auto', marginTop: -40 }}>
        {getImage()}
        <h1 style={{ display: 'Inline', marginLeft: '10px' }}>
          <Trans>{contact.name}</Trans>
        </h1>
      </div>

      <Flex flexDirection="column" gap={4}>
        <Flex flexDirection="column" gap={4}>
          <Card title={<Trans>Addresses</Trans>} titleVariant="h6">
            <Table
              rows={contact.addresses}
              cols={addressCols}
              rowsPerPageOptions={[5, 25, 100]}
              rowsPerPage={25}
              pages={5}
              isLoading={false}
            />
          </Card>
        </Flex>
        <Flex flexDirection="column" gap={4}>
          <Card title={<Trans>DIDS</Trans>} titleVariant="h6">
            <Table
              rows={contact.dids}
              cols={didCols}
              rowsPerPageOptions={[5, 25, 100]}
              rowsPerPage={25}
              pages={5}
              isLoading={false}
            />
          </Card>
        </Flex>
        <Flex flexDirection="column" gap={4}>
          <Card title={<Trans>Domains</Trans>} titleVariant="h6">
            <Table
              rows={contact.domainnames}
              cols={domainCols}
              rowsPerPageOptions={[5, 25, 100]}
              rowsPerPage={25}
              pages={5}
              isLoading={false}
            />
          </Card>
        </Flex>
      </Flex>
    </div>
  );
}
