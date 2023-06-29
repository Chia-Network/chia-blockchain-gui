// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { useGetKeysQuery, usePrefs } from '@chia-network/api-react';
import { CopyToClipboard, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { InputAdornment, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

import useWalletKeyAddresses from '../../hooks/useWalletKeyAddresses';

export default function MyContact() {
  const theme: any = useTheme();
  const { data: publicKeyFingerprints, isLoading: isLoadingPublicKeys } = useGetKeysQuery();
  const [keyList, setKeyList] = useState([]);
  const { addresses: walletKeyAddresses, isLoading: isLoadingWKAddresses } = useWalletKeyAddresses();
  const [themeList] = usePrefs<LocalStorageType>('fingerprintSettings', {});

  useEffect(() => {
    if (!isLoadingPublicKeys) {
      if (publicKeyFingerprints) {
        const newList = [];
        publicKeyFingerprints.forEach((key) => {
          const keyIndex = publicKeyFingerprints.indexOf(key) + 1;
          const newLabel = !key.label ? `Wallet ${keyIndex}` : key.label;
          newList.push({ fingerprint: key.fingerprint, label: newLabel });
        });
        if (themeList) {
          newList.forEach((key) => {
            const element = key;
            element.emoji = themeList[key.fingerprint].walletKeyTheme.emoji;
            element.color = themeList[key.fingerprint].walletKeyTheme.color;
          });
        }
        if (walletKeyAddresses.length > 0 && newList.length > 0) {
          newList.forEach((key) => {
            const element = key;
            const match = walletKeyAddresses.find(({ fingerprint }) => fingerprint === key.fingerprint);
            element.address = match.address;
          });
        }
        setKeyList(newList);
      }
    }
  }, [publicKeyFingerprints, themeList, walletKeyAddresses, isLoadingPublicKeys]);

  function showIcons() {
    return (
      <Flex flexDirection="column" gap={2} flexGrow={1}>
        <Typography variant="h6">Addresses</Typography>
      </Flex>
    );
  }

  function showAddresses() {
    if (!isLoadingWKAddresses && keyList.length > 0) {
      return (
        <Flex flexDirection="column" gap={3} flexGrow={1}>
          <Flex flexDirection="column" gap={5} flexGrow={1}>
            {keyList.map((key) => (
              <div>
                <Flex flexDirection="row" gap={1} alignItems="center" marginBottom="15px">
                  <Flex
                    justifyContent="left"
                    style={{
                      height: '40px',
                      width: '40px',
                      background: theme.palette.colors[key.color].main,
                      borderRadius: '5px',
                      fontSize: '26px',
                      paddingLeft: '7px',
                      paddingTop: '2px',
                    }}
                  >
                    {key.emoji}
                  </Flex>
                  <Flex>{key.label}</Flex>
                </Flex>
                <TextField
                  label="address"
                  value={key.address}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <CopyToClipboard value={key.address} />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            ))}
          </Flex>
        </Flex>
      );
    }

    return null;
  }

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
            <Trans>My Contact Info</Trans>
          </Typography>
        </Flex>
      </Flex>
      <Flex flexDirection="column" gap={2} alignItems="center" style={{ marginTop: '40px', paddingBottom: '40px' }}>
        <Flex flexDirection="column" gap={6} maxWidth="600px" style={{ width: '100%' }}>
          {showIcons()}
        </Flex>
        <Flex flexDirection="column" gap={6} maxWidth="600px" style={{ width: '100%' }}>
          {showAddresses()}
        </Flex>
      </Flex>
    </div>
  );
}
