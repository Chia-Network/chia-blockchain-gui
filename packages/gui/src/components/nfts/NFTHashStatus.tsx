import { Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Chip, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useMemo } from 'react';

import useNFTVerifyHash from '../../hooks/useNFTVerifyHash';
import ErrorMessage from '../helpers/ErrorMessage';

export type NFTHashStatusProps = {
  nftId: string;
  preview?: boolean;
  hideValid?: boolean;
  hideIcon?: boolean;
};

export default function NFTHashStatus(props: NFTHashStatusProps) {
  const { nftId, preview = false, hideValid = false, hideIcon = false } = props;
  const {
    isLoading,
    data,
    preview: nftPreview,
  } = useNFTVerifyHash(nftId, {
    preview,
  });

  const isVerified = preview ? nftPreview?.isVerified : data?.isVerified;
  const error = preview ? nftPreview?.error : data?.error;

  const icon = useMemo(() => {
    if (hideIcon) {
      return undefined;
    }

    if (isLoading) {
      return <CircularProgress size={16} />;
    }

    if (error) {
      return <ErrorIcon />;
    }

    if (isVerified) {
      return <CheckCircleIcon />;
    }

    return <ErrorIcon />;
  }, [isLoading, error, isVerified, hideIcon]);

  const message = useMemo(() => {
    if (isLoading) {
      return <Trans>Validating hash...</Trans>;
    }

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (isVerified) {
      return <Trans>Hash is valid</Trans>;
    }

    return <Trans>Hash is not valid</Trans>;
  }, [isLoading, error, isVerified]);

  const color = useMemo(() => {
    if (isLoading) {
      return undefined;
    }

    if (error) {
      return 'error';
    }

    if (isVerified) {
      return 'success';
    }

    return 'error';
  }, [isLoading, error, isVerified]);

  const tooltipContent = useMemo(() => {
    if (error) {
      return <Trans>Content has not been validated against the hash that was specified during NFT minting.</Trans>;
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

  if (hideValid && isVerified) {
    return null;
  }

  const chip = <Chip avatar={icon} label={message} color={color} size="small" />;

  if (tooltipContent) {
    return <Tooltip title={<Typography variant="caption">{tooltipContent}</Typography>}>{chip}</Tooltip>;
  }

  return chip;
}
