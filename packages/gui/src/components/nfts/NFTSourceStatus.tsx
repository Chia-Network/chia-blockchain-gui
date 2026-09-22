import { Tooltip, getSemanticColors } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Chip, Typography, useTheme } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import type CacheInfo from '../../@types/CacheInfo';
import useCache from '../../hooks/useCache';
import getNFTSource from '../../util/getNFTSource';

export type NFTSourceStatusProps = {
  // The URI of the verified file the tile is showing — the tile's own
  // verification result, exclusions and all, so the chip describes the file
  // on screen and not another candidate of the same NFT. Undefined while
  // nothing has verified: there is no file to describe then, and the
  // hash-status chip beside this one is reporting instead.
  uri?: string;
};

// A chip saying where the file a tile shows came from (see getNFTSource).
// The gateway that produced an IPFS file is read from its cache sidecar, one
// lookup per tile, made only while the user has the label switched on
// (useShowNFTSource) — the tile mounts this component only then.
export default function NFTSourceStatus(props: NFTSourceStatusProps) {
  const { uri } = props;
  const { getCacheInfos } = useCache();
  const theme = useTheme();

  const [cacheInfo, setCacheInfo] = useState<{ uri: string; info: CacheInfo | undefined } | undefined>();

  useEffect(() => {
    if (!uri) {
      return undefined;
    }

    let isCurrent = true;
    getCacheInfos([uri]).then(
      ([info]) => {
        if (isCurrent) {
          setCacheInfo({ uri, info });
        }
      },
      () => {
        // The source is still known from the URI alone; only which gateway
        // served an IPFS file is not.
        if (isCurrent) {
          setCacheInfo({ uri, info: undefined });
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [uri, getCacheInfos]);

  // The sidecar looked up for the previous URI describes another file.
  const source = useMemo(
    () => (uri ? getNFTSource(uri, cacheInfo?.uri === uri ? cacheInfo.info : undefined) : undefined),
    [uri, cacheInfo],
  );

  if (!uri || !source || (source.kind === 'ipfs' && cacheInfo?.uri !== uri)) {
    // For IPFS content, wait for the sidecar: a gateway link would otherwise
    // flip from "direct" to "gateway" a moment after it appears.
    return null;
  }

  const label =
    source.kind === 'web' ? <Trans>Web</Trans> : source.viaGateway ? <Trans>IPFS gateway</Trans> : <Trans>IPFS</Trans>;

  let tooltip: React.ReactNode;
  if (source.kind === 'web') {
    tooltip = <Trans>Fetched from {source.host}. This file is not published on IPFS.</Trans>;
  } else if (!source.viaGateway) {
    tooltip = <Trans>IPFS content fetched directly from {source.host}, the host in the file's address.</Trans>;
  } else if (source.host) {
    tooltip = <Trans>IPFS content fetched through the IPFS gateway {source.host}.</Trans>;
  } else {
    tooltip = <Trans>IPFS content fetched through an IPFS gateway.</Trans>;
  }

  // The chip sits over the media, where a theme's primary.main can be too
  // dark to read; highlight is the accent that stays readable on overlays
  // (the loop control in NFTPreview uses it for the same reason).
  const accent = getSemanticColors(theme.palette).highlight;
  const onAccent = theme.palette.getContrastText(accent);

  return (
    <Tooltip title={<Typography variant="caption">{tooltip}</Typography>}>
      <Chip
        icon={source.kind === 'web' ? <LanguageIcon /> : <DeviceHubIcon />}
        label={label}
        size="small"
        sx={{
          backgroundColor: accent,
          color: onAccent,
          '& .MuiChip-icon': {
            color: onAccent,
          },
        }}
      />
    </Tooltip>
  );
}
