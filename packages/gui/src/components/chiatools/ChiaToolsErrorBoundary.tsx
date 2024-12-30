import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ChiaToolsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error">
          <Trans>Error loading tools: {this.state.error?.message}</Trans>
        </Typography>
      );
    }

    return this.props.children;
  }
}
