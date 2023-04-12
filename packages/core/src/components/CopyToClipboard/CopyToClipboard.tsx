import { Copy as AssignmentIcon } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Tooltip, IconButton } from '@mui/material';
import React, { useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import { useTimeout } from 'react-use-timeout';

export type CopyToClipboardProps = {
  value: string;
  fontSize?: 'medium' | 'small' | 'large' | 'inherit';
  size?: 'small' | 'medium';
  clearCopiedDelay?: number;
  invertColor?: boolean;
  'data-testid'?: string;
};

export default function CopyToClipboard(props: CopyToClipboardProps) {
  const {
    value,
    size = 'small',
    fontSize = 'medium',
    clearCopiedDelay = 1000,
    invertColor = false,
    'data-testid': dataTestid,
    ...rest
  } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const timeout = useTimeout(() => {
    setCopied(false);
  }, clearCopiedDelay);

  function handleCopy(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    copyToClipboard(value);
    setCopied(true);
    timeout.start();
  }

  const tooltipTitle = copied ? <Trans>Copied</Trans> : <Trans>Copy to Clipboard</Trans>;

  return (
    <Tooltip title={tooltipTitle}>
      <IconButton onClick={handleCopy} size={size} data-testid={dataTestid}>
        <AssignmentIcon
          fontSize={fontSize}
          sx={{ color: (theme) => (invertColor ? theme.palette.common.white : theme.palette.text.secondary) }}
          {...rest}
        />
      </IconButton>
    </Tooltip>
  );
}
