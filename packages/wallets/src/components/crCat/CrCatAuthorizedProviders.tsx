import {
  Flex,
  CrCatsWellKnownProviders,
  Color,
  CopyToClipboard,
  useOpenExternal,
  truncateValue,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Chip, Box, alpha, IconButton } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';

type Props = {
  authorizedProviders?: string[];
};

export default function CrCatAuthorizedProviders(props: Props) {
  const { authorizedProviders = [] } = props;
  const openExternal = useOpenExternal();

  return (
    <Flex gap={2}>
      {authorizedProviders.map((providerHash) => {
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
