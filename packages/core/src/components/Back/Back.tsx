import { Trans } from '@lingui/macro';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Typography, IconButton } from '@mui/material';
import React, { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import useOpenDialog from '../../hooks/useOpenDialog';
import ConfirmDialog from '../ConfirmDialog';
import Flex from '../Flex';

export type BackProps = {
  children?: ReactNode;
  goBack?: boolean;
  to?: string;
  variant?: string;
  form?: boolean;
  iconStyle?: any;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
};

export default function Back(props: BackProps) {
  const { children, variant = 'body2', to, goBack = true, form = false, iconStyle, alignItems = 'center' } = props;
  const navigate = useNavigate();
  const openDialog = useOpenDialog();
  const formContext = useFormContext();

  const isDirty = formContext?.formState?.isDirty;

  async function handleGoBack() {
    if (form) {
      const canGoBack =
        !isDirty ||
        (await openDialog<boolean>(
          <ConfirmDialog
            title={<Trans>Unsaved Changes</Trans>}
            confirmTitle={<Trans>Discard</Trans>}
            confirmColor="danger"
          >
            <Trans>You have made changes. Do you want to discard them?</Trans>
          </ConfirmDialog>
        ));

      if (!canGoBack) {
        return;
      }
    }

    if (goBack) {
      navigate(-1);
      return;
    }

    if (to) {
      navigate(to);
    }
  }

  return (
    <Flex gap={1} alignItems={alignItems}>
      <IconButton onClick={handleGoBack} sx={iconStyle}>
        <ArrowBackIosNew />
      </IconButton>

      <Typography variant={variant}>{children}</Typography>
    </Flex>
  );
}
