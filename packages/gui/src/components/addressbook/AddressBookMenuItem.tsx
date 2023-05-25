// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { CardListItem } from '@chia-network/core';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// import { launcherIdFromNFTId } from '../../util/nfts';
// import NFTPreview from '../nfts/NFTPreview';

export default function AddressBookMenuItem({ contact }) {
  const { contactid } = useParams();
  const navigate = useNavigate();

  function handleSelectContact(id: number) {
    navigate(`/dashboard/addressbook/${id}`);
  }

  // commented out - until this stops throwing an error when not a valid nft
  // const launcherId = launcherIdFromNFTId(contact.nftid ?? '');
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
      onSelect={() => handleSelectContact(Number(contact.contactid))}
      key={contact.contactid}
      selected={Number(contact.contactid) === Number(contactid)}
      data-testid={`WalletsSidebar-wallet-${contactid}`}
    >
      <div
        style={{
          display: 'flex',
          minHeight: '60px',
          height: '60px',
          paddingBottom: '10px',
        }}
      >
        <div style={{ flexGrow: 4, flexBasis: '100', paddingLeft: '10px', paddingTop: '16px', overflow: 'hidden' }}>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
              {contact.name !== '' ? contact.name : 'Unnamed Contact'}
            </span>
          </div>
        </div>
      </div>
    </CardListItem>
  );
}
