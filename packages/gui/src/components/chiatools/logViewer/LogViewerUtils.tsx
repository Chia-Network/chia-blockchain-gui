import React, { memo } from 'react';
import styled from 'styled-components';

import { LogLevel, LogViewerFilter, LogColors } from './LogViewerTypes';

// Update LogEntry interface in LogViewerTypes.ts
interface ExtendedLogEntry {
  timestamp: string;
  version?: string;
  service: string;
  servicePath: string;
  level: LogLevel;
  message: string;
  traceback?: string[];
}

// Define TimeRange as a literal type
export type TimeRange = 'hour' | 'day' | 'week' | 'all';

const LOG_REGEX_NEW =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})\s+([\d.]+\w*)\s+(\w+)\s+([\w.]+)\s*:\s+(CRITICAL|ERROR|WARNING|INFO|DEBUG|NOTSET)\s+(.+)$/;
const LOG_REGEX_OLD =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})\s+(\w+)\s+([\w.]+)\s*:\s+(CRITICAL|ERROR|WARNING|INFO|DEBUG|NOTSET)\s+(.+)$/;

function getTimeRangeDate(timeRange: TimeRange | undefined): Date | null {
  if (!timeRange || timeRange === 'all') return null;

  const now = new Date();
  switch (timeRange) {
    case 'hour':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export function processLogChunk(text: string): ExtendedLogEntry[] {
  const lines = text.split('\n');
  const entries: ExtendedLogEntry[] = [];
  let currentEntry: ExtendedLogEntry | null = null;
  let tracebackLines: string[] = [];

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      return entries;
    }

    const newFormatMatch = line.match(LOG_REGEX_NEW);
    const oldFormatMatch = line.match(LOG_REGEX_OLD);

    // Handle new format logs
    if (newFormatMatch) {
      // Save any previous traceback
      if (currentEntry && tracebackLines.length > 0) {
        const entry = currentEntry as ExtendedLogEntry; // Type assertion
        const updatedEntry: ExtendedLogEntry = {
          timestamp: entry.timestamp,
          version: entry.version,
          service: entry.service,
          servicePath: entry.servicePath,
          level: entry.level,
          message: entry.message,
          traceback: tracebackLines,
        };
        currentEntry = updatedEntry;
        tracebackLines = [];
      }

      const [, timestamp, version, service, servicePath, level, message] = newFormatMatch;
      currentEntry = {
        timestamp,
        version,
        service,
        servicePath,
        level: level as LogLevel,
        message,
      };
      entries.push(currentEntry);
      return entries;
    }

    // Handle old format logs
    if (oldFormatMatch) {
      // Save any previous traceback
      if (currentEntry && tracebackLines.length > 0) {
        const entry = currentEntry as ExtendedLogEntry; // Type assertion
        const updatedEntry: ExtendedLogEntry = {
          timestamp: entry.timestamp,
          version: entry.version,
          service: entry.service,
          servicePath: entry.servicePath,
          level: entry.level,
          message: entry.message,
          traceback: tracebackLines,
        };
        currentEntry = updatedEntry;
        tracebackLines = [];
      }

      const [, timestamp, service, servicePath, level, message] = oldFormatMatch;
      currentEntry = {
        timestamp,
        service,
        servicePath,
        level: level as LogLevel,
        message,
      };
      entries.push(currentEntry);
      return entries;
    }

    // Handle traceback lines
    if (line.startsWith(' ') && currentEntry) {
      tracebackLines.push(line);
    }
  }

  // Add any remaining traceback to the last entry
  if (currentEntry && tracebackLines.length > 0) {
    const entry = currentEntry as ExtendedLogEntry; // Type assertion
    const updatedEntry: ExtendedLogEntry = {
      timestamp: entry.timestamp,
      version: entry.version,
      service: entry.service,
      servicePath: entry.servicePath,
      level: entry.level,
      message: entry.message,
      traceback: tracebackLines,
    };
    currentEntry = updatedEntry;
  }

  return entries;
}

export function filterLogs(
  logs: ExtendedLogEntry[],
  filter: LogViewerFilter & { timeRange?: TimeRange },
): ExtendedLogEntry[] {
  return logs.filter((log) => {
    if (filter.levels.length && !filter.levels.includes(log.level)) {
      return false;
    }

    const startDate = getTimeRangeDate(filter.timeRange);
    if (startDate && new Date(log.timestamp) < startDate) {
      return false;
    }

    if (filter.version && log.version !== filter.version) {
      return false;
    }

    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchLower) ||
        log.service.toLowerCase().includes(searchLower) ||
        (log.traceback?.some((line) => line.toLowerCase().includes(searchLower)) ?? false)
      );
    }

    return true;
  });
}

export const LOG_COLORS: LogColors = {
  [LogLevel.CRITICAL]: '#FF0000',
  [LogLevel.ERROR]: '#FF4444',
  [LogLevel.WARNING]: '#FFA500',
  [LogLevel.INFO]: '#4CAF50',
  [LogLevel.DEBUG]: '#2196F3',
  [LogLevel.NOTSET]: '#757575',
};

export const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const DEFAULT_FILTER: LogViewerFilter = {
  levels: [LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARNING],
  timeRange: 'all',
  searchText: '',
  version: undefined,
};

export function filterLogContent(content: string, filter: LogViewerFilter): string[] {
  if (!content) return [];

  const groups: string[] = [];
  const lines = content.split('\n');
  let currentGroup: string[] = [];

  const processLine = (line: string) => {
    if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
      if (currentGroup.length > 0) {
        const groupText = currentGroup.join('\n');
        const hasSelectedLevel = filter.levels.some((filterLevel) => groupText.includes(`: ${filterLevel} `));
        const matchesSearch = !filter.searchText || groupText.toLowerCase().includes(filter.searchText.toLowerCase());

        if (hasSelectedLevel && matchesSearch) {
          groups.push(groupText);
        }
      }
      currentGroup = [line];
    } else if (line.trim()) {
      currentGroup.push(line);
    }
  };

  lines.forEach(processLine);

  if (currentGroup.length > 0) {
    const groupText = currentGroup.join('\n');
    const hasSelectedLevel = filter.levels.some((filterLevel) => groupText.includes(`: ${filterLevel} `));
    const matchesSearch = !filter.searchText || groupText.toLowerCase().includes(filter.searchText.toLowerCase());

    if (hasSelectedLevel && matchesSearch) {
      groups.push(groupText);
    }
  }

  return groups;
}

const HighlightedText = styled.span`
  backgroundColor: 'rgba(255, 255, 0, 0.3)',
  fontWeight: 'bold',
`;

type HighlightSearchTextProps = {
  text: string;
  searchTerm: string | undefined;
};

export const HighlightSearchText = memo((props: HighlightSearchTextProps) => {
  const { text, searchTerm } = props;

  if (!searchTerm) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <HighlightedText
        // eslint-disable-next-line react/no-array-index-key -- Using index is safe here as the array is stable and order won't change (requested by ChiaMineJP)
        key={`highlight-${part}-${index}`}
      >
        {part}
      </HighlightedText>
    ) : (
      <React.Fragment
        // eslint-disable-next-line react/no-array-index-key -- Using index is safe here as the array is stable and order won't change (requested by ChiaMineJP)
        key={`highlight-${part}-${index}`}
      >
        {part}
      </React.Fragment>
    ),
  );
});
