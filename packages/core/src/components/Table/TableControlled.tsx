import {
  Box,
  TableContainer,
  TableHead,
  Table as TableBase,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Tooltip,
  TablePagination,
  Collapse,
} from '@mui/material';
import { get } from 'lodash';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { ReactNode, useMemo, useState, SyntheticEvent, Fragment } from 'react';
import styled from 'styled-components';

import Color from '../../constants/Color';
import LoadingOverlay from '../LoadingOverlay';

const StyledTableHead = styled(TableHead)`
  background-color: ${({ theme }) => (theme.palette.mode === 'dark' ? Color.Neutral[700] : Color.Neutral[200])};
  font-weight: 500;
`;

export const StyledTableRow = styled(({ odd, oddRowBackgroundColor, ...rest }) => <TableRow {...rest} />)`
  ${({ odd, oddRowBackgroundColor, theme }) =>
    odd
      ? `background-color: ${
          oddRowBackgroundColor || (theme.palette.mode === 'dark' ? Color.Neutral[800] : Color.Neutral[100])
        };`
      : undefined}
`;

const StyledExpandedTableRow = styled(({ isExpanded, ...rest }) => <TableRow {...rest} />)`
  background-color: ${({ theme }) => (theme.palette.mode === 'dark' ? Color.Neutral[700] : Color.Neutral[200])};
  ${({ isExpanded }) => (!isExpanded ? 'display: none;' : undefined)}
`;

const StyledTableCell = styled(({ width, minWidth, maxWidth, ...rest }) => <TableCell {...rest} />)`
  max-width: ${({ minWidth, maxWidth, width }) => (maxWidth || width || minWidth) ?? 'none'};
  min-width: ${({ minWidth }) => minWidth || '0'};
  width: ${({ width, minWidth }) => (width || minWidth ? width : 'auto')}};
  border-bottom: 1px solid ${({ theme }) => (theme.palette.mode === 'dark' ? Color.Neutral[800] : Color.Neutral[200])};
`;

const StyledTableCellContent = styled(Box)<{ forceWrap: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: ${(props) => (props.forceWrap ? 'wrap' : 'nowrap')};
`;

const StyledExpandedTableCell = styled(({ isExpanded, ...rest }) => <TableCell {...rest} />)``;

const StyledExpandedTableCellContent = styled(Box)`
  padding: 1rem 0;
`;

function PaperScrollbar(props) {
  const { children, rest } = props;

  return (
    <Paper {...rest}>
      <OverlayScrollbarsComponent options={{ scrollbars: { autoHide: 'leave' } }}>
        {children}
      </OverlayScrollbarsComponent>
    </Paper>
  );
}

function PaginationScrollbar(props) {
  const { children, rest } = props;

  return (
    <Box sx={{ display: 'table', width: '100%' }} {...rest}>
      <OverlayScrollbarsComponent options={{ scrollbars: { autoHide: 'leave' } }}>
        {children}
      </OverlayScrollbarsComponent>
    </Box>
  );
}

export type Col = {
  key?: number | string;
  field: ReactNode | ((row: Row) => ReactNode);
  title: ReactNode;
  minWidth?: string;
  maxWidth?: string;
  width?: string;
  tooltip?: ReactNode | ((row: Row) => ReactNode);
  forceWrap?: boolean;
};

export type Row = {
  [key: string]: any;
};

type InternalTableCol = Col & { key: string | number };

export type InternalTableRow = Row & { id: string | number };

export type TableControlledProps = {
  cols: Col[];
  rows: Row[];
  page?: number;
  pages?: boolean;
  rowsPerPageOptions?: number[];
  rowsPerPage?: number;
  hideHeader?: boolean;
  caption?: ReactNode;
  onRowClick?: (e: SyntheticEvent, row: Row) => void;
  rowHover?: boolean;
  uniqueField?: string;
  metadata?: any;
  expandedField?: (row: Row) => ReactNode;
  expandedCellShift?: number;
  onPageChange?: (rowsPerPage: number, page: number) => void;
  count?: number;
  isLoading?: boolean;
  onToggleExpand?: (rowId: string, expanded: boolean, rowData: any) => void;
  ExtraRowsAfterHeader?: ReactNode;
};

export default function TableControlled(props: TableControlledProps) {
  const {
    cols = [],
    rows = [],
    page,
    pages = false,
    rowsPerPageOptions = [10, 25, 100],
    rowsPerPage = 10,
    hideHeader = false,
    caption,
    onRowClick,
    rowHover = false,
    uniqueField,
    metadata,
    expandedField,
    expandedCellShift = 0,
    onPageChange,
    count,
    isLoading,
    onToggleExpand = () => {},
    ExtraRowsAfterHeader = null,
  } = props;
  const [expanded, setExpanded] = useState<{
    [key: string]: boolean;
  }>({});

  function handleSetRowsPerPage(newRowsPerPage: number) {
    if (onPageChange) {
      onPageChange(newRowsPerPage, 0);
    }
  }

  function handleSetPage(newPage: number) {
    if (onPageChange) {
      onPageChange(rowsPerPage, newPage);
    }
  }

  function handleToggleExpand(rowId: string, row: any) {
    onToggleExpand(rowId, !expanded[rowId], row);
    setExpanded({
      ...expanded,
      [rowId]: !expanded[rowId],
    });
  }

  function handleChangePage(_event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) {
    handleSetPage(newPage);
  }

  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    handleSetRowsPerPage(+event.target.value);
  }

  const currentCols = useMemo<InternalTableCol[]>(
    () =>
      cols.map((col, index) => ({
        key: index,
        ...col,
      })),
    [cols]
  );

  const preparedRows = useMemo<InternalTableRow[]>(
    () =>
      rows.map((row, rowIndex) => ({
        $uniqueId: uniqueField ? get(row, uniqueField) : rowIndex,
        ...row,
      })),
    [rows, uniqueField]
  );

  function handleRowClick(e: SyntheticEvent, row: Row) {
    if (onRowClick) {
      onRowClick(e, row);
    }
  }

  return (
    <LoadingOverlay loading={isLoading}>
      <TableContainer component={PaperScrollbar}>
        <TableBase>
          {caption && <caption>{caption}</caption>}
          {!hideHeader && (
            <StyledTableHead>
              <TableRow>
                {currentCols.map((col) => (
                  <StyledTableCell key={col.key} minWidth={col.minWidth} maxWidth={col.maxWidth} width={col.width}>
                    <StyledTableCellContent>{col.title}</StyledTableCellContent>
                  </StyledTableCell>
                ))}
              </TableRow>
            </StyledTableHead>
          )}

          <TableBody>
            {ExtraRowsAfterHeader}
            {preparedRows.map((row, rowIndex) => (
              <TableControlledRow
                row={row}
                rowIndex={rowIndex}
                currentCols={currentCols}
                expandedCellShift={expandedCellShift}
                expanded={expanded}
                handleToggleExpand={handleToggleExpand}
                handleRowClick={handleRowClick}
                rowHover={rowHover}
                metadata={metadata}
                expandedField={expandedField}
              />
            ))}
          </TableBody>
        </TableBase>
        {pages && (
          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component={PaginationScrollbar}
            count={count ?? rows.length ?? 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>
    </LoadingOverlay>
  );
}

export function TableControlledRow({
  row,
  rowIndex,
  currentCols,
  expandedCellShift,
  expanded = {},
  handleToggleExpand,
  handleRowClick,
  rowHover,
  metadata,
  expandedField,
  oddRowBackgroundColor,
}) {
  const id = `${row.$uniqueId?.toString()}-${rowIndex}`;
  const isExpanded = !!expanded[id];
  const expandableCells = [];

  for (let i = 0; i < expandedCellShift; i += 1) {
    expandableCells.push(
      <StyledExpandedTableCell key={i} style={{ paddingBottom: 0, paddingTop: 0 }} isExpanded={isExpanded} />
    );
  }
  return (
    <Fragment key={id}>
      <StyledTableRow
        odd={rowIndex % 2 === 1}
        oddRowBackgroundColor={oddRowBackgroundColor}
        onClick={handleRowClick ? (e) => handleRowClick(e, row) : undefined}
        hover={rowHover}
      >
        {currentCols.map((col) => {
          const { field, tooltip, forceWrap } = col;

          const value =
            typeof field === 'function'
              ? field(row, metadata, isExpanded, () => handleToggleExpand(id, row))
              : // @ts-ignore
                get(row, field);

          let tooltipValue;
          if (tooltip) {
            if (tooltip === true) {
              tooltipValue = value;
            } else {
              tooltipValue =
                typeof tooltip === 'function'
                  ? tooltip(row)
                  : // @ts-ignore
                    get(row, tooltip);
            }
          }

          return (
            <StyledTableCell minWidth={col.minWidth} maxWidth={col.maxWidth} width={col.width} key={col.key}>
              {tooltipValue ? (
                <Tooltip title={tooltipValue}>
                  <StyledTableCellContent>{value}</StyledTableCellContent>
                </Tooltip>
              ) : (
                <StyledTableCellContent forceWrap={forceWrap}>{value}</StyledTableCellContent>
              )}
            </StyledTableCell>
          );
        })}
      </StyledTableRow>
      <StyledExpandedTableRow isExpanded={isExpanded}>
        {expandableCells}
        <StyledExpandedTableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={currentCols.length - expandedCellShift}
        >
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <StyledExpandedTableCellContent>{expandedField && expandedField(row)}</StyledExpandedTableCellContent>
          </Collapse>
        </StyledExpandedTableCell>
      </StyledExpandedTableRow>
    </Fragment>
  );
}
