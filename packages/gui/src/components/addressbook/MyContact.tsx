// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

// import { launcherIdFromNFTId } from '../../util/nfts';
// import NFTPreview from '../nfts/NFTPreview';

export default function MyContact() {
  // commented out - until this stops throwing an error when not a valid nft
  // const launcherId = launcherIdFromNFTId(contact.nftid ?? '');

  // const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });

  /*
  function getImage() {
    // if (nft !== undefined) return <NFTPreview nft={nft} height={50} width={50} disableThumbnail />;
    return <img height={80} width={80} style={{ backgroundColor: 'grey', color: 'grey' }} />;
  }
  */

  return (
    <div>
      <Flex
        flexDirection="row"
        justifyContent="right"
        style={{ height: '80px', background: '#CCDDE1', borderRadius: '10px' }}
      >
        <Flex style={{ paddingRight: '30px' }}>
          <Typography
            variant="h5"
            sx={{
              position: 'absolute',
              left: 44,
              top: 48,
            }}
          >
            <Trans>My Addresses</Trans>
          </Typography>
        </Flex>
      </Flex>
    </div>
  );
}
