import { Tooltip, isValidURL } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Chip, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useMemo } from 'react';

import useNFT from '../../hooks/useNFT';
import useNFTVerifyHash from '../../hooks/useNFTVerifyHash';

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

  const isLoading = isLoadingNFTVerifyHash || isLoadingNFT;
  const isVerified = preview ? nftPreview?.isVerified : data?.isVerified;
  const error = errorNFT ?? preview ? nftPreview?.error : data?.error;

  const isValidURI = useMemo(() => {
    if (!nftPreview || !('originalUri' in nftPreview)) {
      return true;
    }

    if (nftPreview.uri) {
      return isValidURL(nftPreview.uri);
    }

    return false;
  }, [nftPreview]);

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

    return <Trans>Invalid hash</Trans>;
  }, [isLoading, isVerified, nft, isValidURI]);

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

  const chip = <Chip icon={icon} label={message} color={color} size="small" />;

  if (tooltipContent) {
    return <Tooltip title={<Typography variant="caption">{tooltipContent}</Typography>}>{chip}</Tooltip>;
  }

  return chip;
}
