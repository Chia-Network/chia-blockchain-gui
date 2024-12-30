import { LogLevel, LogViewerFilter } from './LogViewerTypes';

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
