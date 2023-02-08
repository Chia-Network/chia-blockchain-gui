import { FormatBytes } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Button, Dialog, DialogTitle, DialogActions, DialogContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

type MultipleDownloadDialogProps = {
  onClose?: (value?: any) => void;
  folder: string;
};

const { ipcRenderer } = window as any;

export default function MultipleDownloadDialog(props: MultipleDownloadDialogProps) {
  const { onClose = () => {}, folder } = props;
  const theme = useTheme();
  const [progressObject, setProgressObject] = useState<any>({
    progress: 0,
    url: '',
    i: 1,
    total: 1,
  });
  const [responseObject, setResponseObject] = useState<any>({});
  const [downloadDone, setDownloadDone] = useState<boolean>(false);

  useEffect(() => {
    const downloadProgressFn = (_: any, obj: any) => {
      setProgressObject(obj);
    };
    const downloadDoneFn = (_: any, obj: any) => {
      setResponseObject(obj);
      setDownloadDone(true);
    };
    ipcRenderer.on('downloadProgress', downloadProgressFn);
    ipcRenderer.on('multipleDownloadDone', downloadDoneFn);

    return () => {
      ipcRenderer.off('downloadProgress', downloadProgressFn);
      ipcRenderer.off('multipleDownloadDone', downloadDoneFn);
    };
  }, []);

  function handleClose({ isCanceled }: { isCanceled: boolean }) {
    if (isCanceled) {
      ipcRenderer.invoke('abortDownloadingFiles');
    }
    onClose?.(true);
  }

  function renderContent() {
    if (downloadDone) {
      return (
        <Box>
          <Box>
            <Trans>Downloaded files: </Trans> {responseObject.successFileCount}
          </Box>
          {responseObject.errorFileCount > 0 && (
            <Box>
              <Trans>Failed downloads: </Trans> {responseObject.errorFileCount}
            </Box>
          )}
          {responseObject.successFileCount > 0 && (
            <>
              <Box>Download folder: {folder}</Box>{' '}
              <Box>
                <Typography variant="body1">
                  <Trans>Total size of downloaded files: </Trans>{' '}
                  <FormatBytes value={responseObject.totalDownloadedSize} precision={3} />
                </Typography>
              </Box>
            </>
          )}
        </Box>
      );
    }
    return (
      <Trans>
        Downloading files {progressObject.i + 1}/{progressObject.total}
      </Trans>
    );
  }

  function renderTitle() {
    if (!downloadDone) {
      return <Trans>Downloading selected NFTs</Trans>;
    }
    if (responseObject.successFileCount > 0 && responseObject.errorFileCount === 0) {
      return <Trans>Download successful.</Trans>;
    }
    if (responseObject.successFileCount === 0) {
      return <Trans>Download failed.</Trans>;
    }
    return <Trans>Download finished.</Trans>;
  }

  return (
    <Dialog open onClose={() => handleClose({ isCanceled: false })} maxWidth={false}>
      <DialogTitle>{renderTitle()}</DialogTitle>
      <DialogContent>{renderContent()}</DialogContent>
      {!downloadDone && (
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
        {downloadDone ? (
          <Button onClick={() => handleClose({ isCanceled: true })} color="primary" variant="outlined">
            <Trans>Close</Trans>
          </Button>
        ) : (
          <Button onClick={() => handleClose({ isCanceled: false })} color="secondary" variant="outlined">
            <Trans>Cancel</Trans>
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
