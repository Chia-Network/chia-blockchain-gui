import { Paper, CircularProgress } from '@mui/material';
import React, { ReactNode } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

import Color from '../../constants/Color';
import AspectRatio from '../AspectRatio';
import Flex from '../Flex';

function StyledPaper({ children }: { children: ReactNode | ChildrenRender }) {
  return (
    <Paper
      sx={{
        backgroundColor: Color.Neutral[400],
        padding: (theme) => `${theme.spacing(1)} ${theme.spacing(2)}`,
      }}
    >
      {children}
    </Paper>
  );
}

type ChildrenRender = (input: { isDragActive: boolean }) => ReactNode;

type Props = {
  children: ReactNode | ChildrenRender;
  onDrop: (acceptedFiles: File[]) => void;
  maxFiles?: number;
  accept?: string[]; // ['image/jpeg', 'image/png']
  ratio: number;
  processing?: boolean;
  background?: React.ElementType;
};

export default function Dropzone(props: Props) {
  const {
    children,
    onDrop,
    maxFiles,
    accept,
    ratio = 16 / 6,
    processing = false,
    background: Background = StyledPaper,
  } = props;

  const config: DropzoneOptions = {
    onDrop,
    maxFiles,
  };

  if (accept) {
    config.accept = accept.join(', ');
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone(config);
  const childrenContent = typeof children === 'function' ? children({ isDragActive }) : children;

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Background>
        <AspectRatio ratio={ratio}>
          <Flex alignItems="center" justifyContent="center" flexDirection="column" height="100%">
            {processing ? <CircularProgress color="secondary" /> : childrenContent}
          </Flex>
        </AspectRatio>
      </Background>
    </div>
  );
}
