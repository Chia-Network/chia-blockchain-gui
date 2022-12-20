import { type NFTInfo } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Dialog, Paper } from '@mui/material';
import { styled } from '@mui/styles';
import React from 'react';

import NFTPreview from './NFTPreview';

const StyledNFTPreviewBackground = styled(Paper)({
  padding: '2rem',
});

type NFTPreviewDialogProps = {
  nft: NFTInfo;
  open?: boolean;
  onClose?: () => void;
};

export default function NFTPreviewDialog(props: NFTPreviewDialogProps) {
  const { nft, onClose = () => ({}), open = false, ...rest } = props;

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
      <NFTPreview nft={nft} width="100%" height="100%" background={StyledNFTPreviewBackground} hideStatusBar />
    </Dialog>
  );
}
