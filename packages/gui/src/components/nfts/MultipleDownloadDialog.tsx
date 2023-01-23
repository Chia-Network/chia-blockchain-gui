import { FormatBytes } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Button, Dialog, DialogTitle, DialogActions, DialogContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

type MultipleDownloadDialogProps = {
  onClose?: (value?: any) => void;
};

const { ipcRenderer } = window as any;

export default function MultipleDownloadDialog(props: MultipleDownloadDialogProps) {
  const { onClose = () => {} } = props;
  const theme = useTheme();
  const [progressObject, setProgressObject] = useState<any>({
    progress: 0,
    url: '',
    i: 1,
    total: 1,
  });
  const [totalSize, setTotalSize] = useState<number>(0);

  useEffect(() => {
    const downloadProgressFn = (_: any, obj: any) => {
      setProgressObject(obj);
    };
    const downloadDoneFn = (_: any, totalDownloadedSize: number) => {
      setTotalSize(totalDownloadedSize);
    };
    ipcRenderer.on('downloadProgress', downloadProgressFn);
    ipcRenderer.on('multipleDownloadDone', downloadDoneFn);

    return () => {
      ipcRenderer.off('downloadProgress', downloadProgressFn);
      ipcRenderer.off('multipleDownloadDone', downloadDoneFn);
    };
  }, []);

  function handleClose(isCancel: boolean) {
    if (isCancel) {
      ipcRenderer.invoke('abortDownloadingFiles');
    }
    onClose?.(true);
  }

  function renderContent() {
    if (totalSize > 0) {
      return (
        <Box>
          <Box>
            <Trans>Downloaded files: </Trans> {progressObject.total}
          </Box>
          <Box>
            <Typography variant="body1">
              <Trans>Total size of downloaded files: </Trans> <FormatBytes value={totalSize} precision={3} />
            </Typography>
          </Box>
        </Box>
      );
    }
    return (
      <Trans>
        Downloading files {progressObject.i + 1}/{progressObject.total}
      </Trans>
    );
  }

  return (
    <Dialog open onClose={handleClose} maxWidth={false}>
      <DialogTitle>
        {totalSize === 0 ? <Trans>Downloading selected NFTs</Trans> : <Trans>Download successful.</Trans>}
      </DialogTitle>
      <DialogContent>{renderContent()}</DialogContent>
      {totalSize === 0 && (
        <Box sx={{ padding: '0 50px 20px 50px' }}>
          <Box>{progressObject.url}</Box>
          <Box
            sx={{
              width: `${progressObject.progress * 100}%`,
              height: '12px',
              background: `${theme.palette.primary.main}`,
              borderRadius: '3px',
            }}
          />
        </Box>
      )}
      <DialogActions sx={{ justifyContent: 'center', marginBottom: '15px' }}>
        {totalSize > 0 ? (
          <Button onClick={() => handleClose('cancel')} color="primary" variant="outlined">
            <Trans>Close</Trans>
          </Button>
        ) : (
          <Button onClick={handleClose} color="secondary" variant="outlined">
            <Trans>Cancel</Trans>
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
