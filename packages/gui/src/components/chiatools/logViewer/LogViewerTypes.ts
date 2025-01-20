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

export interface LogFileInfo {
  path: string;
  exists: boolean;
  size?: number;
  readable?: boolean;
  fileError?: string;
  debugInfo?: {
    chiaRoot: string;
    logDir: string;
    rootExists: boolean;
    logDirExists: boolean;
    fileReadable: boolean;
  };
}

export interface CachedContent {
  content: string;
  timestamp: number;
  fileSize: number;
  isPartial?: boolean;
}

export type LogColors = Record<LogLevel, string>;
