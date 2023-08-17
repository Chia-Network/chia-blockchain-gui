import { useGetWalletsQuery, useGetVCListQuery } from '@chia-network/api-react';
import {
  CardSimple,
  Flex,
  CrCatsWellKnownProviders,
  Color,
  CopyToClipboard,
  useOpenExternal,
  truncateValue,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import DoneIcon from '@mui/icons-material/Done';
import ErrorIcon from '@mui/icons-material/Error';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Chip, Box, Typography, alpha, IconButton } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { camelCase } from 'lodash';
import React, { useMemo } from 'react';

type Props = {
  walletId: number;
};

export default function WalletCardCRCatRestrictions(props: Props) {
  const { walletId } = props;
  const openExternal = useOpenExternal();

  const { data: wallets, isLoading: isGetWalletsLoading } = useGetWalletsQuery(
    { includeData: true },
    {
      pollingInterval: 10_000,
    }
  );

  const { data: vcs, isLoading: isGetVCListLoading } = useGetVCListQuery({});

  const restrictions = useMemo(() => {
    if (isGetWalletsLoading || !wallets) {
      return null;
    }

    const wallet = wallets.find((item) => item.id === walletId);
    if (!wallet) {
      return null;
    }
    return {
      authorizedProviders: wallet.authorizedProviders || [],
      flagsNeeded: wallet.flagsNeeded || [],
    };
  }, [isGetWalletsLoading, walletId, wallets]);

  const haveValidCredentialsForFlags = useMemo(() => {
    if (
      isGetVCListLoading ||
      !restrictions?.flagsNeeded ||
      restrictions.flagsNeeded.length === 0 ||
      !vcs ||
      !vcs.proofs
    ) {
      return null;
    }

    // since the flags are the keys, the API abstraction camelCases them
    const flagsNeeded = restrictions.flagsNeeded.map((flag) => ({ flag, flagCamelCase: camelCase(flag) }));

    const toReturn: string[] = [];
    Object.entries(vcs.proofs).forEach(([proofHash, proofObject]) => {
      Object.keys(proofObject).forEach((proofFlag) => {
        // check if we have the proof flag
        const foundFlag = flagsNeeded.find((flag) => flag.flagCamelCase === proofFlag);
        if (foundFlag) {
          // check if we have a VC with the proofHash
          vcs.vcRecords.forEach((vcRecord) => {
            if (vcRecord.vc.proofHash === `0x${proofHash}`) {
              // check if the VC is from the authorized provider
              if (restrictions.authorizedProviders.includes(vcRecord.vc.proofProvider.slice(2))) {
                toReturn.push(foundFlag.flag);
              }
            }
          });
        }
      });
    });

    return toReturn;
  }, [isGetVCListLoading, restrictions, vcs]);

  return (
    <CardSimple
      loading={isGetWalletsLoading || isGetVCListLoading}
      valueColor="secondary"
      title={<Trans>CAT credential restrictions</Trans>}
    >
      <Box>
        <Flex gap={2}>
          {restrictions?.flagsNeeded.map((flagName) => {
            const haveValidCredential = haveValidCredentialsForFlags?.includes(flagName);

            return (
              <Tooltip
                title={
                  haveValidCredential ? (
                    <Trans>You have this verifiable credential from the correct authorized provider</Trans>
                  ) : (
                    <Trans>
                      You do not have this verifiable credential or it is not from the correct authorized provided
                    </Trans>
                  )
                }
              >
                <Chip
                  icon={haveValidCredential ? <DoneIcon /> : <ErrorIcon />}
                  label={flagName}
                  color={haveValidCredential ? 'primary' : 'default'}
                />
              </Tooltip>
            );
          })}
        </Flex>
        <Typography variant="body1" sx={{ mt: 2 }}>
          <Trans>Authorized providers</Trans>
        </Typography>
        <Flex gap={2}>
          {restrictions?.authorizedProviders.map((providerHash) => {
            const wellKnownProvider = CrCatsWellKnownProviders[providerHash];

            return (
              <Tooltip
                title={
                  <Flex flexDirection="column" gap={1}>
                    <Flex flexDirection="column" gap={0}>
                      <Flex>
                        <Box flexGrow={1}>
                          <StyledTitle>
                            <Trans>Provider's ID</Trans>
                          </StyledTitle>
                        </Box>
                      </Flex>
                      <Flex alignItems="center" gap={1} justifyContent="space-between">
                        <StyledValue>{providerHash}</StyledValue>
                        <CopyToClipboard value={providerHash} fontSize="small" />
                      </Flex>
                    </Flex>
                    {wellKnownProvider?.url && (
                      <Flex flexDirection="column" gap={0}>
                        <Flex>
                          <Box flexGrow={1}>
                            <StyledTitle>
                              <Trans>Provider's website</Trans>
                            </StyledTitle>
                          </Box>
                        </Flex>
                        <Flex alignItems="center" gap={1} justifyContent="space-between">
                          <StyledValue>{wellKnownProvider.url}</StyledValue>
                          <IconButton
                            onClick={() => {
                              openExternal(`https://${wellKnownProvider.url}`);
                            }}
                            /* to match the color of the copy icon which is hardcoded or something */
                            sx={{ color: '#9E9E9E', position: 'relative', left: '3px' }}
                          >
                            <OpenInNewIcon />
                          </IconButton>
                        </Flex>
                      </Flex>
                    )}
                  </Flex>
                }
              >
                <Chip label={wellKnownProvider?.name || truncateValue(providerHash, {})} size="small" />
              </Tooltip>
            );
          })}
        </Flex>
      </Box>
    </CardSimple>
  );
}

type ChildrenProps = {
  children: React.ReactNode;
};

function StyledTitle({ children }: ChildrenProps) {
  return <Box sx={{ fontSize: '0.625rem', color: alpha(Color.Neutral[50], 0.7) }}>{children}</Box>;
}

function StyledValue({ children }: ChildrenProps) {
  return <Box sx={{ wordBreak: 'break-all' }}>{children}</Box>;
}
