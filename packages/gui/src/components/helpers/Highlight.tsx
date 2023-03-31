import { Box } from '@mui/material';
import React, { useMemo } from 'react';

export type HighlightProps = {
  value: string;
  search: string;
};

export default function Highlight(props: HighlightProps) {
  const { value, search } = props;

  const canSearch = value && search;

  const parts = useMemo(() => {
    if (!canSearch) {
      return [value];
    }
    const r = new RegExp(`(${search})`, 'i');
    return value.split(r);
  }, [value, search, canSearch]);

  if (parts.length <= 1) {
    return <Box as="span">{value}</Box>;
  }

  return (
    <Box as="span">
      {parts.map((part) => {
        const isMatch = part.toLocaleLowerCase() === search.toLocaleLowerCase();
        return (
          <Box as="span" display="inline" color={isMatch ? 'primary.main' : undefined}>
            {part}
          </Box>
        );
      })}
    </Box>
  );
}
