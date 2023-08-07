import { Color } from '@chia-network/core';
import { Box } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  border: 1px solid ${Color.Neutral[400]};
  border-radius: 3px;
  margin-top: 30px !important;
  margin-left: 0 !important;
  > div {
    background: ${Color.Green[200]};
    height: 10px;
    border-radius: 2px;
  }
`;
const { ipcRenderer } = window as any;

type ProgressBarType = {
  nftIdUrl: string;
  setValidateNFT: any;
  fetchBinaryContentDone: (valid: boolean) => void;
};

export default function NFTProgressBar({ nftIdUrl, setValidateNFT, fetchBinaryContentDone }: ProgressBarType) {
  const [progressBarWidth, setProgressBarWidth] = React.useState(-1);

  React.useEffect(() => {
    let oldProgress = 0;
    ipcRenderer.on('fetchBinaryContentProgress', (_: any, obj: any) => {
      if (obj.nftIdUrl === nftIdUrl) {
        const newProgress = Math.round(obj.progress * 100);
        if (newProgress !== oldProgress) {
          setProgressBarWidth(newProgress);
          oldProgress = newProgress;
        }
      }
    });
    ipcRenderer.on('fetchBinaryContentDone', (_: any, obj: any) => {
      if (obj.nftIdUrl === nftIdUrl) {
        fetchBinaryContentDone(obj.valid);

        setProgressBarWidth(-1);
        setValidateNFT(false);
      }
    });
  }, [fetchBinaryContentDone, nftIdUrl, setValidateNFT]);

  if (progressBarWidth === -1) {
    return null;
  }

  return (
    <ProgressBar>
      <Box sx={{ width: `${progressBarWidth}%` }} />
    </ProgressBar>
  );
}
