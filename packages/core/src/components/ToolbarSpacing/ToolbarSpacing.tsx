import { makeStyles, Theme, createStyles } from '@mui/styles';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    toolbar: theme.mixins.toolbar,
  })
);

export default function ToolbarSpacing() {
  const classes = useStyles();

  return <div className={classes.toolbar} />;
}
