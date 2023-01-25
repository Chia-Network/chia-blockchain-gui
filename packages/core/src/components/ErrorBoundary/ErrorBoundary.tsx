import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import { styled } from '@mui/styles';
import qs from 'qs';
import React, { Component, type ReactNode } from 'react';
import StackTrace from 'stacktrace-js';

import Button from '../Button';
import Flex from '../Flex';
import LayoutHero from '../LayoutHero';
import Link from '../Link';

const StyledPre = styled(Typography)(() => ({
  whiteSpace: 'pre-wrap',
}));

function formatStackTrace(stack: []) {
  const stackTrace = stack.map(
    ({ fileName, columnNumber, lineNumber, functionName }) =>
      `at ${fileName}:${lineNumber}:${columnNumber} ${functionName}`
  );
  return stackTrace.join('\n');
}

type ErrorBoundaryProps = {
  children?: ReactNode;
};

export default class ErrorBoundary extends Component {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      stacktrace: '',
    };
  }

  async componentDidCatch(error: Error) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error,
      stacktrace: formatStackTrace(await StackTrace.fromError(error)),
    });
    // You can also log error messages to an error reporting service here
  }

  handleReload = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const { stacktrace, error } = this.state;
      const issueLink = `https://github.com/Chia-Network/chia-blockchain-gui/issues/new?${qs.stringify({
        labels: 'bug',
        template: 'bug_report.yaml',
        title: `[BUG] ${error.message}`,
        ui: 'GUI',
        logs: `${error.message}\n\nURL\n${window.location.hash}\n\nStacktrace\n${stacktrace}`,
      })}`;
      // You can render any custom fallback UI
      return (
        <LayoutHero>
          <Flex flexDirection="column" gap={4}>
            <Typography variant="h5" textAlign="center" color="danger">
              <Trans>Something went wrong</Trans>
            </Typography>

            <Flex flexDirection="column">
              <Typography variant="h6">
                <Trans>Error:</Trans> {error.message}
              </Typography>
              <StyledPre variant="body2">{stacktrace}</StyledPre>
            </Flex>

            <Flex justifyContent="center">
              <Link target="_blank" href={issueLink}>
                <Button>
                  <Trans>Report an Issue</Trans>
                </Button>
              </Link>
              &nbsp;
              <Button onClick={this.handleReload} color="primary">
                <Trans>Reload Application</Trans>
              </Button>
            </Flex>
          </Flex>
        </LayoutHero>
      );
    }

    return this.props.children;
  }
}
