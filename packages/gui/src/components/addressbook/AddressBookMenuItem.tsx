// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { CardListItem, Flex } from '@chia-network/core';
import { t } from '@lingui/macro';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// import { launcherIdFromNFTId } from '../../util/nfts';
// import NFTPreview from '../nfts/NFTPreview';

export default function AddressBookMenuItem({ contact }) {
  const { contactId } = useParams();
  const navigate = useNavigate();

  function handleSelectContact(id: number) {
    navigate(`/dashboard/addressbook/${id}`);
  }

  // commented out - until this stops throwing an error when not a valid nft
  // const launcherId = launcherIdFromNFTId(contact.nftId ?? '');
  // const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });

  /*
  function getImage() {
    // if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;

    return <img height={50} width={50} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }
  */

  // <div style={{ paddingLeft: '10px', paddingRight: '10px', flex: 'flex-start' }}>{getImage()}</div>
  // ^ goes before <div style={{ flexGrow: 4, flexBasis: '100', paddingRight: '20px', overflow: 'hidden' }}>

  return (
    <CardListItem
      onSelect={() => handleSelectContact(Number(contact.contactId))}
      key={contact.contactId}
      selected={Number(contact.contactId) === Number(contactId)}
      data-testid={`WalletsSidebar-wallet-${contactId}`}
      borderTransparency
    >
      <Flex
        style={{
          paddingBottom: '0px',
        }}
      >
        <Flex flexGrow={4} flexBasis={100} style={{ overflow: 'hidden' }}>
          <span style={{ fontSize: '1.2rem' }}>
            <Flex direction="row">
              <Flex>
                {contact.emoji ? contact.emoji : null} {contact.name !== '' ? contact.name : t`Unnamed Contact`}
              </Flex>
            </Flex>
          </span>
        </Flex>
      </Flex>
    </CardListItem>
  );
}
