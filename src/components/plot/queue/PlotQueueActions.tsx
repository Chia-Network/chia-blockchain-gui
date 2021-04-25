import React from 'react';
import { Trans } from '@lingui/macro';
import { useDispatch } from 'react-redux';
import { ConfirmDialog, More } from '@chia/core';
import { Box, Divider, ListItemIcon, MenuItem, Typography } from '@material-ui/core';
import {
  DeleteForever as DeleteForeverIcon,
} from '@material-ui/icons';
import useOpenDialog from '../../../hooks/useOpenDialog';
import type PlotQueueItem from '../../../types/PlotQueueItem';
import PlotStatus from '../../../constants/PlotStatus';
import { stopPlotting } from '../../../modules/plotter_messages';
import isWindows from '../../../util/isWindows';

type Props = {
  queueItem: PlotQueueItem;
};

export default function PlotQueueAction(props: Props) {
  const {
    queueItem: {
      id,
      state,
    }
  } = props;

  const dispatch = useDispatch();
  const openDialog = useOpenDialog();
  const canDelete = !isWindows;

  async function handleDeletePlot() {
    if (!canDelete) {
      return;
    }

    const deleteConfirmed = await openDialog((
      <ConfirmDialog
        title={<Trans>Delete Plot</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        confirmColor="danger"
      >
        <Trans>
          Are you sure you want to delete the plot? The plot cannot be
          recovered.
        </Trans>
      </ConfirmDialog>
    ));

    // @ts-ignore
    if (deleteConfirmed) {
      dispatch(stopPlotting(id));
    }
  }

  return (
    <More>
      {({ onClose }) => (
        <Box>
          {state === PlotStatus.RUNNING && (
            <>
              <Divider />
            </>
          )}

          <MenuItem onClick={() => { onClose(); handleDeletePlot(); }} disabled={!canDelete}>
            <ListItemIcon>
              <DeleteForeverIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              <Trans>Delete</Trans>
            </Typography>
          </MenuItem>
        </Box>
      )}
    </More>
  );
}
