import {
  useGetVCListQuery,
  useLocalStorage,
  useGetLoggedInFingerprintQuery,
  useLazyGetProofsForRootQuery,
  useVCCoinAdded,
} from '@chia-network/api-react';
import {
  Flex,
  More,
  MenuItem,
  AlertDialog,
  Loading,
  useOpenDialog,
  useDarkMode,
  LayoutDashboardSub,
  ScrollbarVirtuoso,
} from '@chia-network/core';
import {
  VCZeroStateBackground as VCZeroStateBackgroundIcon,
  VCZeroStateBackgroundDark as VCZeroStateBackgroundDarkIcon,
  VCZeroStateBadge as VCZeroStateBadgeIcon,
  VCZeroStateKYCBadge as VCZeroStateKYCBadgeIcon,
  VCZeroStateMembership as VCZeroStateMembershipIcon,
} from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { styled } from '@mui/styles';
import React, { useCallback, useRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

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
  paddingLeft: 16,
  paddingRight: 16,
});

const COMPONENTS = {
  Item: ItemContainer,
  List: ListContainer,
  Scroller: ScrollbarVirtuoso,
};

export default function VCList() {
  const { isLoading, data: blockchainVCs } = useGetVCListQuery({});

  const scrollerRef = useRef<HTMLElement>(null);

  const handleScrollRef = useCallback(
    (ref: HTMLElement | null) => {
      scrollerRef.current = ref;
    },
    [scrollerRef],
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

  const theme = useTheme();
  const palette = theme.palette as typeof theme.palette & {
    border: { main: string; dark: string };
  };

  const zeroStateColors = React.useMemo(() => {
    const accent = palette.primary.main;
    const accentDark = palette.primary.dark;
    const softAccent = alpha(accent, isDarkMode ? 0.3 : 0.18);
    const surface = palette.background.paper;
    const surfaceAlt = isDarkMode ? palette.background.default : palette.background.card;
    const text = palette.text.primary;
    const mutedText = palette.text.secondary;
    const line = isDarkMode ? palette.border.dark : palette.border.main;

    return {
      accent,
      accentDark,
      badgeBackground: alpha(surface, isDarkMode ? 0.18 : 0.72),
      badgeBorder: line,
      badgeText: mutedText,
      cardBorder: alpha(accent, 0.72),
      cardText: text,
      cardMutedText: mutedText,
      cardBackground: `linear-gradient(135deg, ${alpha(surface, 0.98)} 0%, ${softAccent} 52%, ${alpha(
        surfaceAlt,
        0.98,
      )} 100%)`,
      cardShadow: `0 34px 72px ${alpha(palette.text.primary, isDarkMode ? 0.32 : 0.16)}`,
      chipBackground: `linear-gradient(145deg, ${alpha(surfaceAlt, 0.92)} 0%, ${alpha(accent, 0.28)} 100%)`,
      divider: alpha(accent, 0.24),
      iconColor: palette.info.main,
      sealBackground: `radial-gradient(circle, ${alpha(surface, 0.98)} 0%, ${accent} 52%, ${accentDark} 100%)`,
      texture: `repeating-linear-gradient(115deg, ${alpha(accent, 0.2)} 0 1px, transparent 1px 9px)`,
    };
  }, [
    isDarkMode,
    palette.background.card,
    palette.background.default,
    palette.background.paper,
    palette.border.dark,
    palette.border.main,
    palette.info.main,
    palette.primary.dark,
    palette.primary.main,
    palette.text.primary,
    palette.text.secondary,
  ]);

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

  if (isLoading) {
    return <Loading center />;
  }

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
    try {
      const result = await window.appAPI.showOpenFileDialogAndRead();
      if (!result) {
        return;
      }

      const json = JSON.parse(new TextDecoder().decode(result.content));

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
            </AlertDialog>,
          );
        } else {
          localVCs[fingerprint].push({ ...json, sha256: sha256VCString });
          setVCsLocalStorage(localVCs);
          await openDialog(
            <AlertDialog title="Success">
              <Trans>Verifiable Credential successfully added.</Trans>
            </AlertDialog>,
          );
        }
      }
    } catch (e) {
      await openDialog(
        <AlertDialog title="Error">
          <Trans>Error parsing file</Trans>
        </AlertDialog>,
      );
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
          border: `2px solid ${zeroStateColors.badgeBorder}`,
          textAlign: 'center',
          background: zeroStateColors.badgeBackground,
        }}
      >
        <Typography variant="body1" sx={{ color: zeroStateColors.badgeText }}>
          {titleNode}
        </Typography>
      </Flex>
    );
  }

  function renderZeroState() {
    return (
      <LayoutDashboardSub fullHeight>
        <Box>{renderActionsDropdown()}</Box>
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
          <Flex flexDirection="row" gap={4} sx={{ color: zeroStateColors.iconColor }}>
            <Flex flexDirection="column" sx={{ alignItems: 'center', paddingTop: '25px' }} gap={2}>
              <VCZeroStateBadgeIcon />
              {renderBadgeContainer(<Trans>Badging</Trans>)}
            </Flex>
            <Flex flexDirection="column" sx={{ position: 'relative' }}>
              <Flex
                sx={{
                  width: '0px',
                  height: '410px',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '-15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 350,
                    height: 390,
                    borderRadius: '8px',
                    border: `1px solid ${zeroStateColors.cardBorder}`,
                    overflow: 'hidden',
                    color: zeroStateColors.cardText,
                    background: zeroStateColors.cardBackground,
                    boxShadow: zeroStateColors.cardShadow,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.26,
                      background: zeroStateColors.texture,
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', p: 4 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        letterSpacing: 1,
                        color: zeroStateColors.cardMutedText,
                      }}
                    >
                      VERIFIABLE CREDENTIAL
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1, color: zeroStateColors.cardText }}>
                      Credential ID
                    </Typography>
                    <Box
                      sx={{
                        mt: 3,
                        width: 92,
                        height: 92,
                        borderRadius: 2,
                        background: zeroStateColors.chipBackground,
                        border: `1px solid ${alpha(zeroStateColors.accent, 0.45)}`,
                      }}
                    />
                    <Box sx={{ mt: 3, height: 1, background: zeroStateColors.divider }} />
                    <Typography variant="body2" sx={{ mt: 3, color: zeroStateColors.cardMutedText }}>
                      Issued
                    </Typography>
                    <Typography variant="body1">02-22-2023</Typography>
                    <Typography variant="body2" sx={{ mt: 2, color: zeroStateColors.cardMutedText }}>
                      Holder
                    </Typography>
                    <Typography variant="body1">Bram Tiberius Cohen</Typography>
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 32,
                        top: 58,
                        width: 88,
                        height: 88,
                        borderRadius: '50%',
                        border: `2px solid ${zeroStateColors.accentDark}`,
                        background: zeroStateColors.sealBackground,
                      }}
                    />
                  </Box>
                </Box>
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
      </LayoutDashboardSub>
    );
  }

  if (!allVCsSortLatest?.length) {
    return renderZeroState();
  }

  return (
    <LayoutDashboardSub fullHeight>
      {Array.isArray(blockchainVCs?.vcRecords) &&
        blockchainVCs?.vcRecords.map((vcRecord: any) => (
          <VCGetTimestamp vcRecord={vcRecord} onVCTimestamp={onVCTimestamp} />
        ))}
      <Flex flexDirection="column" flexGrow={1} gap={2}>
        <Flex sx={{ justifyContent: 'space-between' }}>
          <Flex>
            <Typography variant="h6">
              <Trans>Verifiable Credentials</Trans>: {allVCs?.length ?? 0}
            </Typography>
          </Flex>
          {renderActionsDropdown()}
        </Flex>
        <Box sx={{ flexGrow: 1, position: 'relative', marginLeft: -3, marginRight: -3 }}>
          <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, right: 0 }}>
            <VirtuosoGrid
              style={{ height: '100%' }}
              data={allVCsSortLatest}
              components={COMPONENTS}
              itemContent={renderVCCard}
              scrollerRef={handleScrollRef}
            />
          </Box>
        </Box>
      </Flex>
    </LayoutDashboardSub>
  );
}
