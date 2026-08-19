import React, { useMemo, useState } from 'react';

import TableControlled, { TableControlledProps, InternalTableRow } from './TableControlled';

type Props = TableControlledProps;

export default function Table({
  rows = [],
  page: defaultPage = 0,
  pages = false,
  rowsPerPage: defaultRowsPerPage = 10,
  ...rest
}: Props) {
  const [page, setPage] = useState<number>(defaultPage);
  const [rowsPerPage, setRowsPerPage] = useState<number>(defaultRowsPerPage);

  function handlePageChange(newRowsPerPage: number, newPage: number) {
    setPage(newPage);
    setRowsPerPage(newRowsPerPage);
  }

  const visibleRows = useMemo<InternalTableRow[]>(() => {
    if (!pages) {
      return rows;
    }

    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, pages, page, rowsPerPage]);

  return (
    <TableControlled
      rows={visibleRows}
      onPageChange={handlePageChange}
      page={page}
      rowsPerPage={rowsPerPage}
      pages={pages}
      count={rows.length}
      {...rest}
    />
  );
}
