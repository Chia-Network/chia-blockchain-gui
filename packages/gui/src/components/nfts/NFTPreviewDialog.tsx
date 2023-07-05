import { Flex } from '@chia-network/core';
import { Dialog, Paper } from '@mui/material';
import { styled } from '@mui/styles';
import React from 'react';

import NFTPreview from './NFTPreview';

const StyledNFTPreviewBackground = styled(Paper)({
  padding: '2rem',
});

export type NFTPreviewDialogProps = {
  id: string;
  open?: boolean;
  onClose?: () => void;
};

export default function NFTPreviewDialog(props: NFTPreviewDialogProps) {
  const { id, onClose = () => ({}), open = false, ...rest } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // eslint-disable-next-line react/no-unstable-nested-components -- Not a performance issue
      PaperComponent={({ children }) => (
        <Flex
          width="95vw"
          height="95vh"
          onClick={onClose}
          justifyContent="center"
          alignItems="center"
          position="relative"
        >
          {children}
        </Flex>
      )}
      {...rest}
    >
      <NFTPreview id={id} width="100%" background={StyledNFTPreviewBackground} />
    </Dialog>
  );
}
