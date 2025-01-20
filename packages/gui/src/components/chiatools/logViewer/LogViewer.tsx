import { Flex, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, CircularProgress, Typography, TextField, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState, useCallback } from 'react';

import decodeError from '../../../electron/utils/decodeError';

import LogViewerToolbar from './LogViewerToolbar';
import {
  LogLevel,
  LogViewerFilter,
  LogViewerProps,
  LogFileInfo,
  CachedContent,
  PaginationInfo,
} from './LogViewerTypes';
import { LOG_COLORS, CACHE_TIMEOUT, DEFAULT_FILTER, filterLogContent } from './LogViewerUtils';

const highlightSearchText = (text: string, searchTerm: string | undefined) => {
  if (!searchTerm) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <span
        // eslint-disable-next-line react/no-array-index-key -- Using index is safe here as the array is stable and order won't change (requested by ChiaMineJP)
        key={`highlight-${part}-${index}`}
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
      setCustomPath: (path: string) => Promise<{ success: boolean }>;
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
  const [filteredGroups, setFilteredGroups] = useState<string[]>([]);
  const [showCustomPathInput, setShowCustomPathInput] = useState<boolean>(false);
  const [customPath, setCustomPath] = useState<string>('');
  const [defaultLogPath, setDefaultLogPath] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const checkLogFile = useCallback(async (): Promise<LogFileInfo> => {
    try {
      const info = await window.chiaLogs.getInfo();
      if (info.error) {
        throw new Error(info.error);
      }
      if (info.defaultPath) {
        setDefaultLogPath(info.defaultPath);
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

      if (!pageFilteredGroups || pageFilteredGroups.length === 0) {
        setPagination((prev) => ({
          ...prev,
          totalPages: 1,
          currentPage: 1,
        }));
        return '';
      }

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
      setFilterLoading(false);
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

        const { content } = result;
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
        setFilterLoading(false);
      }
    },
    [getPageContent, checkLogFile, showError, cachedContent, lastLoadTime, pagination.currentPage],
  );

  useEffect(() => {
    const initializeViewer = async () => {
      if (isInitialized) {
        return;
      }

      try {
        const info = await checkLogFile();
        setFileInfo(info);

        if (!info.exists || !info.readable) {
          setShowCustomPathInput(true);
        } else {
          setLoading(true);
          await loadLogsData(true);
        }
      } catch (e) {
        setShowCustomPathInput(true);
        showError(e);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeViewer();
  }, [checkLogFile, loadLogsData, showError, isInitialized]);

  const handleCustomPathSubmit = async (path: string) => {
    try {
      await window.chiaLogs.setCustomPath(path);
      const info = await checkLogFile();
      setFileInfo(info);

      if (info.exists && info.readable) {
        setShowCustomPathInput(false);
        await loadLogsData(true);
      }
    } catch (e: any) {
      let errorMessage = '';

      if (e.message.includes('ENOENT')) {
        errorMessage = ['⚠️  Log file not found', 'Please verify the path and try again.', '', `Path: ${path}`].join(
          '\n',
        );
      } else if (e.message.includes('EACCES')) {
        errorMessage = [
          '⚠️  Permission denied',
          'Please check file permissions and try again.',
          '',
          `Path: ${path}`,
        ].join('\n');
      } else {
        errorMessage = ['⚠️  Error accessing log file', e.message, '', `Path: ${path}`].join('\n');
      }

      showError(new Error(errorMessage));
      setCustomPath('');
    }
  };

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
    if (!cachedContent || !isInitialized || loading) {
      return undefined;
    }

    setFilterLoading(true);

    try {
      const lines = cachedContent.content.split('\n');
      const groups: string[] = [];
      let currentGroup: string[] = [];

      lines.forEach((line) => {
        if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
          if (currentGroup.length > 0) {
            const groupText = currentGroup.join('\n');
            const hasSelectedLevel = filter.levels.some((filterLevel) => groupText.includes(`: ${filterLevel} `));
            const matchesSearch =
              !filter.searchText || groupText.toLowerCase().includes(filter.searchText.toLowerCase());

            if (hasSelectedLevel && matchesSearch) {
              groups.push(groupText);
            }
          }
          currentGroup = [line];
        } else if (line.trim()) {
          currentGroup.push(line);
        }
      });

      // Process final group
      if (currentGroup.length > 0) {
        const groupText = currentGroup.join('\n');
        const hasSelectedLevel = filter.levels.some((filterLevel) => groupText.includes(`: ${filterLevel} `));
        const matchesSearch = !filter.searchText || groupText.toLowerCase().includes(filter.searchText.toLowerCase());

        if (hasSelectedLevel && matchesSearch) {
          groups.push(groupText);
        }
      }

      setFilteredGroups(groups);
      const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
      setPagination((prev) => ({
        ...prev,
        totalPages,
        currentPage: 1,
      }));

      const pageContent = groups.slice(0, pageSize).join('\n\n');
      setRawContent(pageContent);
    } finally {
      setFilterLoading(false);
    }

    return () => {
      setFilterLoading(false);
    };
  }, [filter, cachedContent, pageSize, isInitialized, loading]);

  const handleCustomPathClick = useCallback(() => {
    setShowCustomPathInput(true);
  }, []);

  if (showCustomPathInput) {
    return (
      <Flex flexDirection="column" gap={2}>
        <Typography variant="body1">
          <Trans>Enter the path to your log file:</Trans>
        </Typography>
        <TextField
          fullWidth
          value={customPath}
          onChange={(e) => setCustomPath(e.target.value)}
          placeholder="/path/to/your/log/file/debug.log"
        />
        <Flex gap={2}>
          <Button onClick={() => handleCustomPathSubmit(customPath)} variant="contained" disabled={!customPath}>
            <Trans>Load Logs</Trans>
          </Button>
          <Button onClick={() => setShowCustomPathInput(false)} variant="outlined">
            <Trans>Cancel</Trans>
          </Button>
        </Flex>
      </Flex>
    );
  }

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
        onCustomPathClick={handleCustomPathClick}
        hasCustomPath={Boolean(fileInfo.path && fileInfo.path !== defaultLogPath)}
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
            <CircularProgress variant={loadingProgress > 0 ? 'determinate' : 'indeterminate'} value={loadingProgress} />
          </Flex>
        ) : rawContent ? (
          <Box sx={{ margin: 0, fontFamily: 'monospace' }}>
            {rawContent.split('\n').map((line, index) => {
              const uniqueId = `${line.substring(0, 19)}-${index}`;

              if (line.trim()) {
                if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
                  const matchingLevels = Object.values(LogLevel).filter((logLevel) => line.includes(`: ${logLevel} `));
                  const level = matchingLevels[0];

                  if (level) {
                    const { 0: prefix, 1: message } = line.split(`: ${level} `);
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
