import {
  useAddPlotDirectoryMutation,
  useRemovePlotDirectoryMutation,
  useGetPlotDirectoriesQuery,
} from '@chia-network/api-react';
import { useShowError, Button, Loading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Folder as FolderIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

import useSelectDirectory from '../../hooks/useSelectDirectory';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PlotAddDirectoryDialog(props: Props) {
  const { onClose, open } = props;
  const [addPlotDirectory] = useAddPlotDirectoryMutation();
  const [removePlotDirectory] = useRemovePlotDirectoryMutation();
  const { data: directories, isLoading } = useGetPlotDirectoriesQuery();
  const showError = useShowError();
  const selectDirectory = useSelectDirectory();

  function handleClose() {
    onClose();
  }

  function handleDialogClose(event: any, reason: any) {
    if (reason !== 'backdropClick' || reason !== 'EscapeKeyDown') {
      onClose();
    }
  }

  async function removePlotDir(dirname: string) {
    try {
      await removePlotDirectory({
        dirname,
      }).unwrap();
    } catch (error: any) {
      showError(error);
    }
  }

  async function handleSelectDirectory() {
    const dirname = await selectDirectory();
    if (dirname) {
      try {
        await addPlotDirectory({
          dirname,
        }).unwrap();
      } catch (error: any) {
        showError(error);
      }
    }
  }

  return (
    <Dialog onClose={handleDialogClose} maxWidth="md" aria-labelledby="confirmation-dialog-title" open={open}>
      <DialogTitle id="confirmation-dialog-title">
        <Trans>Add a plot</Trans>
      </DialogTitle>
      <DialogContent dividers>
        <Typography>
          <Trans>
            This allows you to add a directory that has plots in it. If you have not created any plots, go to the
            plotting screen.
          </Trans>
        </Typography>
        {directories && directories.length > 0 && (
          <Alert severity="info">
            <Trans>
              Clicking a delete icon only removes a directory from this list and never deletes the directory itself
            </Trans>
          </Alert>
        )}
        <Box display="flex">
          {isLoading ? (
            <Loading center />
          ) : (
            <List dense>
              {directories?.map((dir: string) => (
                <ListItem key={dir}>
                  <ListItemAvatar>
                    <Avatar>
                      <FolderIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={dir} />
                  <ListItemSecondaryAction>
                    <Tooltip title={<Trans>Remove from the list</Trans>}>
                      <IconButton edge="end" aria-label="delete" onClick={() => removePlotDir(dir)}>
                        <DeleteIcon color="info" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        <Box display="flex">
          <Box>
            <Button onClick={handleSelectDirectory} variant="contained" color="primary">
              <Trans>Add plot directory</Trans>
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose} color="secondary">
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
