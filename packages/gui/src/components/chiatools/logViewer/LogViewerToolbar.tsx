import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Pagination,
  Paper,
} from '@mui/material';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from 'react';

import { LogLevel, LogViewerFilter, PaginationInfo } from './LogViewerTypes';

type LogViewerToolbarProps = {
  filter: LogViewerFilter;
  onFilterChange: (filter: LogViewerFilter) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCopy: () => void;
  loading?: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
};

export default function LogViewerToolbar({
  filter,
  onFilterChange,
  onRefresh,
  onExport,
  onCopy,
  loading,
  pagination,
  onPageChange,
}: LogViewerToolbarProps) {
  const [searchText, setSearchText] = useState('');

  // Create a ref to store the debounced function
  const debouncedRef = React.useRef<any>();

  // Create debounced filter update
  const debouncedFilterUpdate = useCallback(
    (inputText: string) => {
      if (debouncedRef.current) {
        debouncedRef.current.cancel();
      }

      debouncedRef.current = debounce((filterText: string) => {
        onFilterChange({
          ...filter,
          searchText: filterText,
        });
      }, 300);

      debouncedRef.current(inputText);
    },
    [filter, onFilterChange],
  );

  // Update local state immediately but debounce the filter update
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setSearchText(newText);
    debouncedFilterUpdate(newText);
  };

  // Clean up debounce on unmount
  useEffect(
    () => () => {
      if (debouncedRef.current) {
        debouncedRef.current.cancel();
      }
    },
    [],
  );

  const handleLevelChange = (event: any) => {
    const {
      target: { value },
    } = event;
    onFilterChange({
      ...filter,
      levels: typeof value === 'string' ? value.split(',') : value,
    });
  };

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 1, mb: 1 }}>
      <Flex gap={2} alignItems="center" justifyContent="space-between">
        <Flex gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              multiple
              value={filter.levels}
              onChange={handleLevelChange}
              displayEmpty
              renderValue={() => 'Log Levels'}
              size="small"
            >
              {Object.values(LogLevel).map((level) => (
                <MenuItem key={level} value={level}>
                  <Checkbox checked={filter.levels.includes(level)} />
                  <ListItemText primary={level} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <TextField
              size="small"
              label={<Trans>Search</Trans>}
              value={searchText}
              onChange={handleSearchChange}
              sx={{ minWidth: 200 }}
            />
          </FormControl>
        </Flex>

        <Flex gap={2} alignItems="center">
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={(_, page) => onPageChange(page)}
            disabled={loading}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />

          <Box>
            <Tooltip title={<Trans>Copy to Clipboard</Trans>}>
              <span>
                <IconButton onClick={onCopy} disabled={loading}>
                  <ContentCopyIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={<Trans>Export Logs</Trans>}>
              <span>
                <IconButton onClick={onExport} disabled={loading}>
                  <FileDownloadIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={<Trans>Refresh</Trans>}>
              <span>
                <IconButton onClick={onRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Flex>
      </Flex>
    </Paper>
  );
}
