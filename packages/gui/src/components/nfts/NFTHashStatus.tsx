import { Tooltip, isValidURL } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Chip, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useMemo } from 'react';

import useIpfsGateway from '../../hooks/useIpfsGateway';
import useNFT from '../../hooks/useNFT';
import useNFTVerifyHash from '../../hooks/useNFTVerifyHash';
import { getIpfsPath, isIpfsUrl } from '../../util/ipfs';

export type NFTHashStatusProps = {
  nftId: string;
  preview?: boolean;
  hideValid?: boolean;
  hideIcon?: boolean;
};

export default function NFTHashStatus(props: NFTHashStatusProps) {
  const { nftId, preview = false, hideValid = false, hideIcon = false } = props;
  const {
    isLoading: isLoadingNFTVerifyHash,
    data,
    preview: nftPreview,
  } = useNFTVerifyHash(nftId, {
    preview,
  });

  const { nft, isLoading: isLoadingNFT, error: errorNFT } = useNFT(nftId);
  const [ipfsGateway] = useIpfsGateway();

  const isLoading = isLoadingNFTVerifyHash || isLoadingNFT;
  const isVerified = preview ? nftPreview?.isVerified : data?.isVerified;
  const error = (errorNFT ?? preview) ? nftPreview?.error : data?.error;
  const failedFetch = preview ? nftPreview?.failedFetch : data?.failedFetch;

  const isValidURI = useMemo(() => {
    const uri = nftPreview?.uri;
    if (!uri) {
      // nothing to validate — other branches cover the missing-preview cases
      return true;
    }

    // While the user has IPFS gateway fetching enabled, ipfs:// URIs are
    // served through a gateway by the cache layer, so an ipfs URI is valid
    // when it carries a CID path — the gateway itself was validated when the
    // user configured it, and may legitimately be a plain-http local node
    // that the https-only URL check here would reject. With the option off
    // they are not fetchable and stay flagged — unless the file already
    // verified from the cache, which the message branches above this check.
    if (isIpfsUrl(uri)) {
      return ipfsGateway && getIpfsPath(uri) !== undefined;
    }

    return isValidURL(uri);
  }, [nftPreview, ipfsGateway]);

  const icon = useMemo(() => {
    if (hideIcon) {
      return undefined;
    }

    if (isLoading) {
      return <CircularProgress size={16} />;
    }

    if (isVerified) {
      return <CheckCircleIcon />;
    }

    return <ErrorIcon />;
  }, [isLoading, isVerified, hideIcon]);

  const message = useMemo(() => {
    if (isLoading) {
      return <Trans>Verifying hash...</Trans>;
    }

    if (nft?.pendingTransaction) {
      return <Trans>Update Pending</Trans>;
    }

    if (isVerified) {
      return <Trans>Hash matches</Trans>;
    }

    if (!isValidURI) {
      return <Trans>URL is not valid</Trans>;
    }

    if (failedFetch) {
      return <Trans>File is not available</Trans>;
    }

    return <Trans>Invalid hash</Trans>;
  }, [isLoading, isVerified, nft, isValidURI, failedFetch]);

  const color = useMemo(() => {
    if (isLoading) {
      return undefined;
    }

    if (nft?.pendingTransaction) {
      return 'warning';
    }

    if (isVerified) {
      return 'success';
    }

    return 'error';
  }, [isLoading, isVerified, nft?.pendingTransaction]);

  const tooltipContent = useMemo(() => {
    if (error) {
      return (
        <Trans>
          Content has not been validated against the hash that was specified during NFT minting. Error: {error.message}
        </Trans>
      );
    }
    if (!isVerified) {
      return (
        <Trans>
          Content does not match the expected hash value that was specified during NFT minting. The content may have
          been modified.
        </Trans>
      );
    }

    return undefined;
  }, [error, isVerified]);

  const canHide = !nft?.pendingTransaction;

  if (hideValid && canHide && isVerified) {
    return null;
  }

  const chip = (
    <Chip
      icon={icon}
      label={message}
      color={color}
      size="small"
      sx={
        isVerified && !isLoading && !nft?.pendingTransaction
          ? {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '& .MuiChip-icon': {
                color: 'primary.contrastText',
              },
            }
          : undefined
      }
    />
  );

  if (tooltipContent) {
    return <Tooltip title={<Typography variant="caption">{tooltipContent}</Typography>}>{chip}</Tooltip>;
  }

  return chip;
}
