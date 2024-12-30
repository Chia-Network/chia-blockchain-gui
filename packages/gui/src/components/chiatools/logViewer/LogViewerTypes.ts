export enum LogLevel {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  NOTSET = 'NOTSET',
}

export interface LogEntry {
  timestamp: string;
  version?: string;
  service: string;
  servicePath: string;
  level: LogLevel;
  message: string;
  traceback?: string[];
}

export interface LogViewerFilter {
  levels: LogLevel[];
  searchText: string;
  timeRange?: string;
  version?: string;
}

export interface LogViewerProps {
  pageSize?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}
