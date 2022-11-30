import { type NFTInfo } from '@chia/api';
import { Flex } from '@chia/core';
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
