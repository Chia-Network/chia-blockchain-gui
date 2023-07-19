import {
  useGetVCListQuery,
  useLocalStorage,
  useGetLoggedInFingerprintQuery,
  useLazyGetProofsForRootQuery,
  useVCCoinAdded,
} from '@chia-network/api-react';
import { Flex, More, MenuItem, AlertDialog, useOpenDialog, useDarkMode } from '@chia-network/core';
import {
  VCZeroStateBackground as VCZeroStateBackgroundIcon,
  VCZeroStateBackgroundDark as VCZeroStateBackgroundDarkIcon,
  VCZeroStateBadge as VCZeroStateBadgeIcon,
  VCZeroStateKYCBadge as VCZeroStateKYCBadgeIcon,
  VCZeroStateMembership as VCZeroStateMembershipIcon,
} from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/styles';
import React, { useCallback, useRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

import VCEmptyPng from '../../assets/img/vc_empty.png';
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

  const { data: fingerprint } = useGetLoggedInFingerprintQuery();

  const openDialog = useOpenDialog();

  const [VCsLocalStorage, setVCsLocalStorage] = useLocalStorage<any>('verifiable-credentials-local', {});

  const trackVCTimestamps = React.useRef<any>({});

  const [sortByTimestamp, setSortByTimestamp] = React.useState(false);

  const { isDarkMode } = useDarkMode();

  const [getProofsForRoot] = useLazyGetProofsForRootQuery();

  const [proofs, setProofs] = React.useState<any>({});

  /* We only need to subscribe to event and the list will be updated automatically on added VC */
  useVCCoinAdded(() => {});

  React.useEffect(() => {
    async function loadProofsData() {
      if (isLoading || !blockchainVCs) {
        return;
      }

      const mapping: Record<string, any> = {};

      const proofDataPromises = blockchainVCs.vcRecords.map(async (vcRecord: any) => {
        const proofHash = (vcRecord as any)?.vc?.proofHash;
        if (proofHash) {
          const { data } = await getProofsForRoot({ root: proofHash });
          const vcProofs = data?.proofs;
          mapping[proofHash] = vcProofs;
        }
      });
      await Promise.all(proofDataPromises);

      setProofs(mapping);
    }

    loadProofsData();
  }, [isLoading, blockchainVCs, getProofsForRoot]);

  const COMPONENTS = {
    Item: ItemContainer,
    List: ListContainer,
  };

  const theme = useTheme();

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
    const proofHash = vcRecord?.vc?.proofHash;
    const vcProofs = proofHash ? proofs[proofHash] : undefined;
    return <VCCard vcRecord={vcRecord} proofs={vcProofs} isLocal={!!vcRecord.isLocal} />;
  }

  const allVCs = React.useMemo(() => {
    if (fingerprint) {
      // filter out undefined values
      return blockchainVCs?.vcRecords
        .map((record) => ({
          ...record,
          isValid: !!(proofs[record.vc.proofHash] && Object.keys(proofs[record.vc.proofHash]).length > 0),
        }))
        .concat((VCsLocalStorage[fingerprint] || []).map((record: any) => ({ ...record, isLocal: true })))
        .filter(Boolean);
    }
    return [];
  }, [VCsLocalStorage, blockchainVCs?.vcRecords, fingerprint, proofs]);

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
    const fileContent = await (window as any).ipcRenderer.invoke('showOpenFileDialog');
    if (!fileContent) {
      return;
    }
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

  function renderBadgeContainer(titleNode: React.ReactNode) {
    return (
      <Flex
        sx={{
          display: 'inline-flex',
          padding: '5px 10px',
          borderRadius: '45px',
          border: `2px solid ${isDarkMode ? theme.palette.colors.default.accent : theme.palette.colors.default.border}`,
          textAlign: 'center',
          background: theme.palette.colors.default.backgroundLight,
        }}
      >
        <Typography variant="body1" sx={{ color: theme.palette.colors.default.text }}>
          {titleNode}
        </Typography>
      </Flex>
    );
  }

  function renderZeroState() {
    return (
      <>
        <Box sx={{ marginBottom: '10px', padding: '25px 25px 0 25px' }}>{renderActionsDropdown()}</Box>
        <Flex flexDirection="column" sx={{ alignItems: 'center', zIndex: 2 }}>
          <Flex
            flexDirection="column"
            sx={{ padding: '10px 100px 50px ', maxWidth: '900px', textAlign: 'center', position: 'relative' }}
          >
            <Box sx={{ position: 'absolute', zIndex: -1, top: '50px', left: '-250px' }}>
              {isDarkMode ? <VCZeroStateBackgroundDarkIcon /> : <VCZeroStateBackgroundIcon />}
            </Box>
            <Typography variant="h3" sx={{ marginBottom: '20px' }}>
              <Trans>Verifiable Credentials</Trans>
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: '500' }} color="textSecondary">
              <Trans>
                Verifiable Credentials are like digital ID cards that can prove certain information about you without
                giving away your private details.
              </Trans>
            </Typography>
          </Flex>
          <Flex flexDirection="row" gap={4}>
            <Flex flexDirection="column" sx={{ alignItems: 'center', paddingTop: '25px' }} gap={2}>
              <VCZeroStateBadgeIcon />
              {renderBadgeContainer(<Trans>Badging</Trans>)}
            </Flex>
            <Flex flexDirection="column" sx={{ position: 'relative' }}>
              <Flex
                sx={{
                  img: {
                    position: 'absolute',
                    top: '-15px',
                  },
                  width: '0px',
                  height: '410px',
                }}
              >
                <img src={VCEmptyPng} />
              </Flex>
              <Flex sx={{ width: '430px', justifyContent: 'center' }}>
                {renderBadgeContainer(<Trans>Government IDs</Trans>)}
              </Flex>
            </Flex>
            <Flex flexDirection="column" sx={{ alignItems: 'center', paddingTop: '0px' }} gap={4}>
              <Flex flexDirection="column" sx={{ alignItems: 'center' }} gap={2}>
                <VCZeroStateKYCBadgeIcon />
                {renderBadgeContainer(<Trans>KYC status</Trans>)}
              </Flex>
              <Flex flexDirection="column" sx={{ alignItems: 'center' }} gap={2}>
                <VCZeroStateMembershipIcon />
                {renderBadgeContainer(<Trans>Memberships</Trans>)}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </>
    );
  }

  if (allVCsSortLatest.length === 0) {
    return renderZeroState();
  }

  return (
    <Box sx={{ height: '100%', padding: '25px 0 0 25px', overflowY: 'hidden' }}>
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
      <Box sx={{ height: 'calc(100% - 75px)' }}>
        <VirtuosoGrid
          style={{ height: '100%' }}
          data={allVCsSortLatest}
          components={COMPONENTS}
          itemContent={renderVCCard}
          scrollerRef={handleScrollRef}
        />
      </Box>
    </Box>
  );
}
