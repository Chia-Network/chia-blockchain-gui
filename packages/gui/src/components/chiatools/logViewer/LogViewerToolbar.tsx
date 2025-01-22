import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
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
import React, { useEffect, useState, useMemo, memo } from 'react';

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
  onCustomPathClick: () => void;
  hasCustomPath: boolean;
};

export default memo(
  ({
    filter,
    onFilterChange,
    onRefresh,
    onExport,
    onCopy,
    loading,
    pagination,
    onPageChange,
    onCustomPathClick,
    hasCustomPath,
  }: LogViewerToolbarProps) => {
    const [searchText, setSearchText] = useState('');

    // Create a memoized debounced filter function
    const debouncedFilterFunc = useMemo(
      () =>
        debounce((filterText: string) => {
          onFilterChange({
            ...filter,
            searchText: filterText,
          });
        }, 300),
      [filter, onFilterChange],
    );

    useEffect(
      () => () => {
        debouncedFilterFunc.cancel();
      },
      [debouncedFilterFunc],
    );

    const handleFilterChange = (inputText: string) => debouncedFilterFunc(inputText);

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
                onChange={(event) => {
                  const newText = event.target.value;
                  setSearchText(newText);
                  handleFilterChange(newText);
                }}
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
              <Tooltip title={<Trans>Change Log File Location</Trans>}>
                <span>
                  <IconButton onClick={onCustomPathClick} disabled={loading}>
                    <FolderOpenIcon color={hasCustomPath ? 'primary' : undefined} />
                  </IconButton>
                </span>
              </Tooltip>

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
  },
);
