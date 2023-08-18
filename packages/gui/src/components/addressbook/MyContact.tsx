// import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { useGetKeysQuery, usePrefs, type Serializable } from '@chia-network/api-react';
import { CopyToClipboard, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { InputAdornment, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

import useWalletKeyAddresses from '../../hooks/useWalletKeyAddresses';

type MyContactKeyEntry = {
  fingerprint: string;
  label: string;
  emoji?: string;
  color?: string;
  address?: string;
};

export default function MyContact() {
  const theme: any = useTheme();
  const { data: publicKeyFingerprints, isLoading: isLoadingPublicKeys } = useGetKeysQuery({});
  const [keyList, setKeyList] = useState<MyContactKeyEntry[]>([]);
  const { addresses: walletKeyAddresses, isLoading: isLoadingWKAddresses } = useWalletKeyAddresses();
  type LocalStorageType = Record<string, Record<string, Serializable>>;
  const [themeList] = usePrefs<LocalStorageType>('fingerprintSettings', {});

  useEffect(() => {
    if (isLoadingPublicKeys || isLoadingWKAddresses || !walletKeyAddresses || !publicKeyFingerprints) {
      return;
    }

    const keyEntries: MyContactKeyEntry[] = [];
    publicKeyFingerprints.forEach((key) => {
      const keyIndex = publicKeyFingerprints.indexOf(key) + 1;
      const newLabel = !key.label ? `Wallet ${keyIndex}` : key.label;
      keyEntries.push({ fingerprint: key.fingerprint.toString(), label: newLabel });
    });
    if (themeList) {
      keyEntries.forEach((key) => {
        const element = key;
        element.color = themeList[key.fingerprint].walletKeyTheme
          ? themeList[key.fingerprint].walletKeyTheme.color
          : 'green';
        element.emoji = themeList[key.fingerprint].walletKeyTheme
          ? themeList[key.fingerprint].walletKeyTheme.emoji
          : null;
      });
    }
    if (walletKeyAddresses.length > 0 && keyEntries.length > 0) {
      keyEntries.forEach((key) => {
        const element = key;
        const match = walletKeyAddresses.find(({ fingerprint }) => fingerprint === key.fingerprint);
        if (match) {
          element.address = match.address;
        }
      });
    }
    setKeyList(keyEntries);
  }, [publicKeyFingerprints, themeList, walletKeyAddresses, isLoadingPublicKeys, isLoadingWKAddresses]);

  function showAddresses() {
    if (!isLoadingWKAddresses && keyList.length > 0) {
      return (
        <Flex flexDirection="column" gap={3} flexGrow={1}>
          <Typography variant="h6">Addresses</Typography>
          <Flex flexDirection="column" gap={4} flexGrow={1}>
            {keyList.map((key) => (
              <div>
                <Flex flexDirection="row" gap={1} alignItems="center" marginBottom="15px">
                  <Flex
                    justifyContent="center"
                    style={{
                      height: '36px',
                      width: '36px',
                      background: key.emoji ? theme.palette.background.paper : theme.palette.colors[key.color].main,
                      borderRadius: '5px',
                      fontSize: '26px',
                    }}
                  >
                    {key.emoji ? key.emoji : null}
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
    <Flex flexDirection="column" gap={1} alignItems="left" style={{ paddingLeft: '44px', paddingRight: '44px' }}>
      <Flex flexDirection="row" alignItems="center" style={{ paddingTop: '4px' }}>
        <Flex flexGrow={1}>
          <Typography variant="h5">
            <Trans>My Contact Info</Trans>
          </Typography>
        </Flex>
      </Flex>
      <Flex flexDirection="column" gap={6} style={{ width: '100%', paddingTop: '40px' }}>
        <Flex flexDirection="column" gap={6} style={{ width: '100%' }}>
          {showAddresses()}
        </Flex>
      </Flex>
    </Flex>
  );
}
