import { Flex, useShowError } from '@chia-network/core';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState, useCallback } from 'react';

import decodeError from '../../../electron/utils/decodeError';

import LogViewerToolbar from './LogViewerToolbar';
import { LogLevel, LogViewerFilter, LogViewerProps } from './LogViewerTypes';

interface LogFileInfo {
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

interface CachedContent {
  content: string;
  timestamp: number;
  fileSize: number;
  isPartial?: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

const DEFAULT_FILTER: LogViewerFilter = {
  levels: [LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARNING],
  timeRange: 'all',
  searchText: '',
  version: undefined,
};

type LogColors = Record<LogLevel, string>;

const LOG_COLORS: LogColors = {
  [LogLevel.CRITICAL]: '#FF0000',
  [LogLevel.ERROR]: '#FF4444',
  [LogLevel.WARNING]: '#FFA500',
  [LogLevel.INFO]: '#4CAF50',
  [LogLevel.DEBUG]: '#2196F3',
  [LogLevel.NOTSET]: '#757575',
};

const highlightSearchText = (text: string, searchTerm: string | undefined) => {
  if (!searchTerm) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <span
        key={`highlight-${part}-${Math.random().toString(36).substr(2, 9)}`}
        style={{
          backgroundColor: 'rgba(255, 255, 0, 0.3)',
          fontWeight: 'bold',
        }}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function filterLogContent(content: string, filter: LogViewerFilter): string[] {
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

declare global {
  interface Window {
    chiaLogs: {
      getContent: () => Promise<{
        content?: string;
        path?: string;
        size?: number;
        error?: string;
      }>;
      getInfo: () => Promise<{
        path: string;
        exists: boolean;
        size: number;
        readable: boolean;
        error?: string;
        debugInfo?: {
          chiaRoot: string;
          logDir: string;
          rootExists: boolean;
          logDirExists: boolean;
          fileReadable: boolean;
        };
      }>;
    };
  }
}

export default function LogViewer({ pageSize = 1000 }: LogViewerProps) {
  const theme = useTheme();
  const showError = useShowError();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<LogViewerFilter>(DEFAULT_FILTER);
  const [fileInfo, setFileInfo] = useState<LogFileInfo>({ path: '', exists: false });
  const [rawContent, setRawContent] = useState<string>('');
  const [cachedContent, setCachedContent] = useState<CachedContent | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    pageSize,
  });
  const [loadingProgress] = useState<number>(0);
  const [filterLoading, setFilterLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [filterProgress, setFilterProgress] = useState<number>(0);
  const [filteredGroups, setFilteredGroups] = useState<string[]>([]);

  const checkLogFile = useCallback(async (): Promise<LogFileInfo> => {
    try {
      const info = await window.chiaLogs.getInfo();
      if (info.error) {
        throw new Error(info.error);
      }
      return info as LogFileInfo;
    } catch (e: any) {
      return {
        path: '',
        exists: false,
        fileError: e.message,
      };
    }
  }, []);

  const getPageContent = useCallback(
    (fullContent: string, page: number) => {
      const pageFilteredGroups = filterLogContent(fullContent, filter);

      pageFilteredGroups.sort((a, b) => {
        const aMatch = a.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/);
        const bMatch = b.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/);
        const aTime = aMatch ? aMatch[0] : '';
        const bTime = bMatch ? bMatch[0] : '';
        return bTime.localeCompare(aTime);
      });

      const totalPages = Math.max(1, Math.ceil(pageFilteredGroups.length / pageSize));
      setPagination((prev) => ({
        ...prev,
        totalPages,
        currentPage: Math.min(page, totalPages),
      }));

      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, pageFilteredGroups.length);

      return pageFilteredGroups.slice(startIndex, endIndex).join('\n\n');
    },
    [pageSize, filter],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (filteredGroups.length > 0) {
        setPagination((prev) => {
          const newState = {
            ...prev,
            currentPage: newPage,
          };
          return newState;
        });
        const startIndex = (newPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredGroups.length);
        const pageContent = filteredGroups.slice(startIndex, endIndex).join('\n\n');
        setRawContent(pageContent);
      }
      return undefined;
    },
    [filteredGroups, pageSize],
  );

  const loadLogsData = useCallback(
    async (forceReload = false) => {
      const now = Date.now();
      if (!forceReload && cachedContent && now - lastLoadTime < CACHE_TIMEOUT) {
        const pageContent = getPageContent(cachedContent.content, pagination.currentPage);
        setRawContent(pageContent);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const info = await checkLogFile();
        setFileInfo(info);

        if (!info.exists || !info.readable) {
          throw new Error(`Unable to read log file: ${info.fileError || 'unknown error'}`);
        }

        const result = await window.chiaLogs.getContent();
        if (result.error) {
          throw new Error(result.error);
        }

        const content = result.content;
        if (!content) {
          throw new Error('No content returned from log file');
        }

        const logGroups = filterLogContent(content, {
          ...DEFAULT_FILTER,
          levels: Object.values(LogLevel),
        });

        logGroups.sort((a, b) => {
          const aMatch = a.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/);
          const bMatch = b.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/);
          const aTime = aMatch ? aMatch[0] : '';
          const bTime = bMatch ? bMatch[0] : '';
          return bTime.localeCompare(aTime);
        });

        const sortedContent = logGroups.join('\n\n');

        setCachedContent({
          content: sortedContent,
          timestamp: Date.now(),
          fileSize: sortedContent.length,
        });

        const pageContent = getPageContent(sortedContent, 1);
        setRawContent(pageContent);

        setLastLoadTime(now);
      } catch (loadError: any) {
        const decodedError = decodeError(loadError);
        setError(decodedError);
        showError(decodedError);
      } finally {
        setLoading(false);
      }
    },
    [getPageContent, checkLogFile, showError, cachedContent, lastLoadTime, pagination.currentPage],
  );

  useEffect(() => {
    loadLogsData(false);
  }, [loadLogsData]);

  const handleRefresh = () => {
    loadLogsData(true);
    return undefined;
  };

  useEffect(() => {
    if (cachedContent) {
      const pageContent = getPageContent(cachedContent.content, pagination.currentPage);
      setRawContent(pageContent);
    }
    return undefined;
  }, [pagination.currentPage, getPageContent, cachedContent]);

  const handleFilterChange = useCallback((newFilter: LogViewerFilter) => {
    setFilter(newFilter);
    return undefined;
  }, []);

  const handleExport = async () => {
    try {
      const blob = new Blob([rawContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chia-logs-export.log';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (exportErr) {
      showError(exportErr);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
    } catch (err) {
      showError(err);
    }
  };

  useEffect(() => {
    if (cachedContent) {
      setFilterLoading(true);
      setFilterProgress(0);

      let isCancelled = false;
      const accumulatedGroups: string[] = [];
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 100;

      let currentGroup: string[] = [];

      const processLine = (line: string) => {
        if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
          if (currentGroup.length > 0) {
            const groupText = currentGroup.join('\n');
            const hasSelectedLevel = filter.levels.some((filterLevel) => groupText.includes(`: ${filterLevel} `));
            const matchesSearch =
              !filter.searchText || groupText.toLowerCase().includes(filter.searchText.toLowerCase());

            if (hasSelectedLevel && matchesSearch) {
              accumulatedGroups.push(groupText);
            }
          }
          currentGroup = [line];
        } else if (line.trim()) {
          currentGroup.push(line);
        }
        return undefined;
      };

      const processChunk = (chunk: string[]) => {
        chunk.forEach(processLine);
        return undefined;
      };

      const updateUI = () => {
        if (!isCancelled) {
          setFilteredGroups(accumulatedGroups);

          const totalPages = Math.max(1, Math.ceil(accumulatedGroups.length / pageSize));
          setPagination((prev) => {
            const newState = {
              ...prev,
              totalPages,
              currentPage: 1,
            };
            return newState;
          });

          const pageContent = accumulatedGroups.slice(0, pageSize).join('\n\n');
          setRawContent(pageContent);
        }
        return undefined;
      };

      const processContent = () => {
        const lines = cachedContent.content.split('\n');
        const totalLines = lines.length;
        const chunkSize = 500;
        let currentIndex = 0;

        const processNextChunk = () => {
          if (isCancelled || currentIndex >= totalLines) {
            if (!isCancelled) {
              // Process final group if needed
              if (currentGroup.length > 0) {
                processLine(''); // Empty line triggers final group processing
              }
              updateUI();
              setFilterLoading(false);
              setFilterProgress(0);
            }
            return undefined;
          }

          const chunk = lines.slice(currentIndex, currentIndex + chunkSize);
          processChunk(chunk);

          // Update progress
          const progress = Math.round((currentIndex / totalLines) * 100);
          if (!isCancelled) {
            setFilterProgress(progress);
          }

          currentIndex += chunkSize;
          const now = Date.now();

          if (now - lastUpdateTime > UPDATE_INTERVAL) {
            lastUpdateTime = now;
            setTimeout(processNextChunk, 0);
            return undefined;
          }

          return processNextChunk();
        };

        processNextChunk();
        return undefined;
      };

      processContent();

      return () => {
        isCancelled = true;
      };
    }
    return undefined;
  }, [filter, cachedContent, pageSize]);

  return (
    <Flex flexDirection="column" gap={2} sx={{ height: '100%', minHeight: '500px' }}>
      <LogViewerToolbar
        filter={filter}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onCopy={handleCopy}
        loading={loading || filterLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: theme.palette.background.default,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          padding: 1,
          whiteSpace: 'pre-wrap',
          borderRadius: 1,
        }}
      >
        {loading || filterLoading ? (
          <Flex alignItems="center" justifyContent="center" minHeight={200} flexDirection="column" gap={2}>
            <CircularProgress
              variant={loadingProgress > 0 || filterProgress > 0 ? 'determinate' : 'indeterminate'}
              value={filterLoading ? filterProgress : loadingProgress}
            />
            {(loadingProgress > 0 || filterProgress > 0) && (
              <Typography variant="body2" color="textSecondary">
                {filterLoading ? `Filtering: ${filterProgress}%` : `Loading: ${loadingProgress}%`}
              </Typography>
            )}
          </Flex>
        ) : rawContent ? (
          <Box sx={{ margin: 0, fontFamily: 'monospace' }}>
            {rawContent.split('\n').map((line, index) => {
              const uniqueId = `${line.substring(0, 19)}-${index}`;

              if (line.trim()) {
                if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
                  const level = Object.values(LogLevel).find((logLevel) => {
                    const matches = line.includes(`: ${logLevel} `);
                    return matches;
                  });

                  if (level) {
                    const [prefix, message] = line.split(`: ${level} `);
                    return (
                      <Box component="div" key={uniqueId} sx={{ whiteSpace: 'pre-wrap' }}>
                        <span style={{ color: theme.palette.text.secondary }}>
                          {highlightSearchText(prefix, filter.searchText)}:
                        </span>
                        <span
                          style={{
                            color: LOG_COLORS[level],
                            fontWeight: level === 'CRITICAL' || level === 'ERROR' ? 'bold' : 'normal',
                          }}
                        >
                          {` ${level} `}
                        </span>
                        <span style={{ color: theme.palette.text.primary }}>
                          {highlightSearchText(message, filter.searchText)}
                        </span>
                      </Box>
                    );
                  }
                }
                return (
                  <Box
                    component="div"
                    key={uniqueId}
                    sx={{
                      whiteSpace: 'pre-wrap',
                      color: line.startsWith(' ') ? LOG_COLORS.ERROR : theme.palette.text.primary,
                      paddingLeft: line.startsWith(' ') ? 2 : 0,
                    }}
                  >
                    {highlightSearchText(line, filter.searchText)}
                  </Box>
                );
              }
              return null;
            })}
          </Box>
        ) : (
          <Flex alignItems="center" justifyContent="center" minHeight={200} flexDirection="column" gap={2}>
            <Typography color="textSecondary">
              No logs found. Logs should appear here.
              <br />
              Current Page: {pagination.currentPage}
              <br />
              Total Pages: {pagination.totalPages}
              <br />
              Log File Path: {fileInfo.path}
              <br />
              File Exists: {fileInfo.exists ? 'Yes' : 'No'}
              {fileInfo.exists && (
                <>
                  <br />
                  File Size: {fileInfo.size ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                  <br />
                  Readable: {fileInfo.readable ? 'Yes' : 'No'}
                </>
              )}
              {fileInfo.debugInfo && (
                <>
                  <br />
                  <br />
                  Debug Information:
                  <br />
                  Chia Root: {fileInfo.debugInfo.chiaRoot}
                  <br />
                  Log Directory: {fileInfo.debugInfo.logDir}
                  <br />
                  Root Exists: {fileInfo.debugInfo.rootExists ? 'Yes' : 'No'}
                  <br />
                  Log Dir Exists: {fileInfo.debugInfo.logDirExists ? 'Yes' : 'No'}
                  <br />
                  File Readable: {fileInfo.debugInfo.fileReadable ? 'Yes' : 'No'}
                </>
              )}
              {fileInfo.fileError && (
                <>
                  <br />
                  File Error: {fileInfo.fileError}
                </>
              )}
            </Typography>
            {error && (
              <Typography color="error" align="center">
                Error reading logs: {error.message}
                <br />
                {error.stack && <pre style={{ fontSize: '0.8em' }}>{error.stack}</pre>}
              </Typography>
            )}
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
