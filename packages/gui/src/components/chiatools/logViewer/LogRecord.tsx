import { Box } from '@mui/material';
import React, { memo } from 'react';
import styled from 'styled-components';

import { LogLevel, LogViewerFilter } from './LogViewerTypes';
import { HighlightSearchText, LOG_COLORS } from './LogViewerUtils';

const WrappedBox = styled(Box)`
  white-space: pre-wrap;
`;

const PrimaryText = styled.span(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const SecondaryText = styled.span(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

type LogLevelProps = {
  level: LogLevel;
};
const LogLevelLabel = styled.span<LogLevelProps>(({ level }) => ({
  color: LOG_COLORS[level],
  fontWeight: level === 'CRITICAL' || level === 'ERROR' ? 'bold' : 'normal',
}));

type IndentedLineProps = {
  line: string;
};
const IndentedLine = styled(Box)<IndentedLineProps>(({ theme, line }) => ({
  whiteSpace: 'pre-wrap',
  color: line.startsWith(' ') ? LOG_COLORS.ERROR : theme.palette.text.primary,
  paddingLeft: line.startsWith(' ') ? 2 : 0,
}));

export type LogRecordProps = {
  line: string;
  filter: LogViewerFilter;
};

export default memo((props: LogRecordProps) => {
  const { line, filter } = props;

  if (!line.trim()) {
    return null;
  }

  if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
    const matchingLevels = Object.values(LogLevel).filter((logLevel) => line.includes(`: ${logLevel} `));
    const level = matchingLevels[0];

    if (level) {
      const { 0: prefix, 1: message } = line.split(`: ${level} `);
      return (
        <WrappedBox component="div">
          <SecondaryText>
            <HighlightSearchText text={prefix} searchTerm={filter.searchText} />:
          </SecondaryText>
          <LogLevelLabel level={level}>{` ${level} `}</LogLevelLabel>
          <PrimaryText>
            <HighlightSearchText text={message} searchTerm={filter.searchText} />
          </PrimaryText>
        </WrappedBox>
      );
    }
  }
  return (
    <IndentedLine component="div" line={line}>
      <HighlightSearchText text={line} searchTerm={filter.searchText} />
    </IndentedLine>
  );
});
