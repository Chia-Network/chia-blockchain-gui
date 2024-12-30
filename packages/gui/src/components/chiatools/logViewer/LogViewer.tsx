import fs from 'fs';
import os from 'os';
import path from 'path';

import { Flex, useShowError } from '@chia-network/core';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState, useCallback } from 'react';

import canReadFile from '../../../electron/utils/canReadFile';
import decodeError from '../../../electron/utils/decodeError';
import directoryExists from '../../../electron/utils/directoryExists';

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

// Fix the LogColors interface and LOG_COLORS constant
type LogColors = Record<LogLevel, string>;

const LOG_COLORS: LogColors = {
  [LogLevel.CRITICAL]: '#FF0000',
  [LogLevel.ERROR]: '#FF4444',
  [LogLevel.WARNING]: '#FFA500',
  [LogLevel.INFO]: '#4CAF50',
  [LogLevel.DEBUG]: '#2196F3',
  [LogLevel.NOTSET]: '#757575',
};

// Fix the highlightSearchText function to handle undefined searchText
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

// Add cache timeout constant
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Update filterLogContent to support chunked processing
function filterLogContent(content: string, filter: LogViewerFilter): string[] {
  if (!content) return [];

  const groups: string[] = [];
  const lines = content.split('\n');
  let currentGroup: string[] = [];

  // Process lines without loop function
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

  // Process final group
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

export default function LogViewer({ pageSize = 1000 }: LogViewerProps) {
  const theme = useTheme();
  const showError = useShowError();

  // Group all state declarations together at the top
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

  // Define handlers after all state declarations
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

  // Define getPageContent first, before it's used in other hooks
  const getPageContent = useCallback(
    (fullContent: string, page: number) => {
      // Get filtered groups
      const pageFilteredGroups = filterLogContent(fullContent, filter);

      // Sort by timestamp (newest first)
      pageFilteredGroups.sort((a, b) => {
        const aTime = a.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)?.[0] || '';
        const bTime = b.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)?.[0] || '';
        return bTime.localeCompare(aTime);
      });

      // Update pagination info
      const totalPages = Math.max(1, Math.ceil(pageFilteredGroups.length / pageSize));
      setPagination((prev) => {
        const newState = {
          ...prev,
          totalPages,
          currentPage: Math.min(page, totalPages),
        };
        return newState;
      });

      // Get current page content
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, pageFilteredGroups.length);

      return pageFilteredGroups.slice(startIndex, endIndex).join('\n\n');
    },
    [pageSize, filter],
  );

  // Fix the directoryExists and canReadFile calls to properly handle promises
  const checkLogFile = useCallback(async (filePath: string): Promise<LogFileInfo> => {
    try {
      const info: LogFileInfo = { path: filePath, exists: false };

      try {
        const stats = fs.statSync(filePath);
        info.exists = true;
        info.size = stats.size;

        const readable = await canReadFile(filePath);
        info.readable = readable;
        if (!readable) {
          info.fileError = 'File exists but is not readable';
        }
      } catch (e) {
        info.fileError = 'File does not exist';
      }

      if (info.exists) {
        const chiaRoot = process.env.CHIA_ROOT || path.join(os.homedir(), '.chia', 'mainnet');
        const logDir = path.join(chiaRoot, 'log');

        info.debugInfo = {
          chiaRoot,
          logDir,
          rootExists: await directoryExists(chiaRoot),
          logDirExists: await directoryExists(logDir),
          fileReadable: await canReadFile(filePath),
        };
      }

      return info;
    } catch (e: any) {
      return {
        path: filePath,
        exists: false,
        fileError: e.message,
      };
    }
  }, []);

  const loadLogsData = useCallback(
    async (forceReload = false) => {
      // Check if we should use cached content
      const now = Date.now();
      if (!forceReload && cachedContent && now - lastLoadTime < CACHE_TIMEOUT) {
        // Use cached content
        const pageContent = getPageContent(cachedContent.content, pagination.currentPage);
        setRawContent(pageContent);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const chiaRoot = process.env.CHIA_ROOT || path.join(os.homedir(), '.chia', 'mainnet');
        const logDir = path.join(chiaRoot, 'log');
        const currentLogPath = path.join(logDir, 'debug.log');

        const info = await checkLogFile(currentLogPath);
        setFileInfo(info);

        if (!info.exists || !info.readable) {
          throw new Error(`Unable to read log file: ${info.fileError || 'unknown error'}`);
        }

        // Read and process the content
        const content = await fs.promises.readFile(currentLogPath, 'utf8');

        // Use filterLogContent to get properly grouped entries
        const logGroups = filterLogContent(content, {
          ...DEFAULT_FILTER,
          levels: Object.values(LogLevel), // Include all log levels initially
        });

        // Sort by timestamp (newest first)
        logGroups.sort((a, b) => {
          const aTime = a.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)?.[0] || '';
          const bTime = b.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)?.[0] || '';
          return bTime.localeCompare(aTime);
        });

        // Join the sorted groups
        const sortedContent = logGroups.join('\n\n');

        // Cache the sorted content
        setCachedContent({
          content: sortedContent,
          timestamp: Date.now(),
          fileSize: sortedContent.length,
        });

        // Get the first page
        const pageContent = getPageContent(sortedContent, 1);
        setRawContent(pageContent);

        // Update last load time
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

  // Only load on mount
  useEffect(() => {
    loadLogsData(false);
  }, [loadLogsData]); // Add loadLogsData to dependencies

  const handleRefresh = () => {
    loadLogsData(true);
    return undefined;
  };

  // Separate effect for handling pagination changes
  useEffect(() => {
    if (cachedContent) {
      const pageContent = getPageContent(cachedContent.content, pagination.currentPage);
      setRawContent(pageContent);
    }
    return undefined;
  }, [pagination.currentPage, getPageContent, cachedContent]);

  // Simplify handleFilterChange to just update the filter
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

  // Fix the filter effect to handle async operations properly
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
            // Use setTimeout to break up processing
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
                // Check if this is a log line with timestamp and level
                if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
                  const level = Object.values(LogLevel).find((logLevel) => {
                    const matches = line.includes(`: ${logLevel} `);
                    return matches;
                  });

                  if (level) {
                    // Split the line at the log level
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
                // Handle traceback and other lines
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
