import { useGetVCListQuery, useLocalStorage, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { Flex, More, MenuItem, AlertDialog, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/styles';
import React, { useCallback, useRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

// import useVCCoinEvents from '../../hooks/useVCCoinEvents';
import { sha256, arrToHex } from '../../util/utils';
import VCCard from './VCCard';
import VCGetTimestamp from './VCGetTimestamp';

function ItemContainer(props: { children?: React.ReactNode }) {
  const { children } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 2,
        alignContent: 'stretch',
        width: {
          xs: '100%',
          sm: '50%',
          lg: '33.333333%',
          xl: '25%',
        },
      }}
    >
      {children}
    </Box>
  );
}

const ListContainer = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  paddingLeft: 0,
  paddingRight: 0,
});

export default function VCList() {
  const { isLoading, data: blockchainVCs } = useGetVCListQuery({});

  const scrollerRef = useRef<HTMLElement>(null);

  const handleScrollRef = useCallback(
    (ref: HTMLElement | null) => {
      scrollerRef.current = ref;
    },
    [scrollerRef]
  );

  // const [forceUpdate, setForceUpdate] = React.useState(false);

  const { data: fingerprint } = useGetLoggedInFingerprintQuery();

  // const subscribeToVCCoinChanges = useVCCoinEvents();

  const openDialog = useOpenDialog();

  const [VCsLocalStorage, setVCsLocalStorage] = useLocalStorage<any>('verifiable-credentials-local', {});

  const trackVCTimestamps = React.useRef<any>({});

  const [sortByTimestamp, setSortByTimestamp] = React.useState(false);

  // React.useEffect(() => {
  //   const unsubscribe = subscribeToVCCoinChanges((changed) => {
  //     if (changed) {
  //       console.log('Query List.........', blockchainVCs?.vcRecords);
  //       console.log('Changed data.........', changed);
  //     }
  //     setForceUpdate(!forceUpdate);
  //   });
  //   return () => unsubscribe();
  // }, [subscribeToVCCoinChanges, forceUpdate]);

  const COMPONENTS = {
    Item: ItemContainer,
    List: ListContainer,
  };

  function onVCTimestamp(id: string, timestamp: number) {
    trackVCTimestamps.current[id] = timestamp;
    if (
      Array.isArray(blockchainVCs?.vcRecords) &&
      blockchainVCs?.vcRecords.length &&
      Object.keys(trackVCTimestamps.current).length === blockchainVCs?.vcRecords.length
    ) {
      setSortByTimestamp(true);
    }
  }

  function renderVCCard(index: number, vcRecord: any) {
    return <VCCard vcRecord={vcRecord} />;
  }

  const allVCs = React.useMemo(() => {
    if (fingerprint) {
      return (blockchainVCs?.vcRecords || []).concat(VCsLocalStorage[fingerprint]);
    }
    return [];
  }, [VCsLocalStorage, blockchainVCs?.vcRecords, fingerprint]);

  if (isLoading) return null;

  const allVCsSortLatest = sortByTimestamp
    ? allVCs.sort((a: any, b: any) => {
        const aDate = a.vc?.launcherId
          ? trackVCTimestamps.current[a.vc.launcherId] * 1000
          : new Date(a.issuanceDate).getTime();
        const bDate = b.vc?.launcherId
          ? trackVCTimestamps.current[b.vc.launcherId] * 1000
          : new Date(b.issuanceDate).getTime();
        return bDate > aDate ? 1 : -1;
      })
    : allVCs;

  async function getVCFromLocalFile() {
    const fileContent = await (window as any).ipcRenderer.invoke('getVCfromFile');
    let json;
    try {
      json = JSON.parse(fileContent);
    } catch (e) {
      /* error parsing json */
    }
    if (!json) {
      await openDialog(
        <AlertDialog title="Error">
          <Trans>Error parsing file</Trans>
        </AlertDialog>
      );
    } else {
      const sha256VC = await sha256(JSON.stringify(json));
      const sha256VCString = arrToHex(sha256VC);
      const localVCs = { ...VCsLocalStorage };
      if (fingerprint) {
        if (!localVCs[fingerprint]) {
          localVCs[fingerprint] = [];
        }
        if (localVCs[fingerprint].find((vc: any) => vc.sha256 === sha256VCString)) {
          await openDialog(
            <AlertDialog title="Error">
              <Trans>Verifiable Credential already exists.</Trans>
            </AlertDialog>
          );
        } else {
          localVCs[fingerprint].push({ ...json, sha256: sha256VCString });
          setVCsLocalStorage(localVCs);
          await openDialog(
            <AlertDialog title="Success">
              <Trans>Verifiable Credential successfully added.</Trans>
            </AlertDialog>
          );
        }
      }
    }
  }

  function renderActionsDropdown() {
    return (
      <Flex justifyContent="right" sx={{ marginBottom: '0' }}>
        <More>
          <MenuItem onClick={() => getVCFromLocalFile()} close>
            <Typography variant="inherit" noWrap>
              <Trans>Add Verifiable Credential from file</Trans>
            </Typography>
          </MenuItem>
        </More>
      </Flex>
    );
  }

  return (
    <Box sx={{ height: '100%', padding: '25px' }}>
      {Array.isArray(blockchainVCs?.vcRecords) &&
        blockchainVCs?.vcRecords.map((vcRecord: any) => (
          <VCGetTimestamp vcRecord={vcRecord} onVCTimestamp={onVCTimestamp} />
        ))}
      <Flex sx={{ justifyContent: 'space-between', marginBottom: '10px', padding: '15px' }}>
        <Flex>
          <Typography variant="h6">
            <Trans>Verifiable Credentials</Trans>: {allVCs.length}
          </Typography>
        </Flex>
        {renderActionsDropdown()}
      </Flex>
      <VirtuosoGrid
        style={{ height: '100%' }}
        data={allVCsSortLatest}
        components={COMPONENTS}
        itemContent={renderVCCard}
        scrollerRef={handleScrollRef}
      />
    </Box>
  );
}
