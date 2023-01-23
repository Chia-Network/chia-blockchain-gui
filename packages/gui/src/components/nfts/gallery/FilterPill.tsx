import { Trans } from '@lingui/macro';
import { Fade } from '@mui/material';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import ArrowDownIcon from '../../../assets/img/arrow-down.svg';

const Pill = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  height: 38px;
  border: 1px solid ${(props) => (props.isDarkMode ? '#333' : '#e0e0e0')};
  box-radius: 5px;
  padding: 10px 15px;
  background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
  border-radius: 5px;
  align-items: center;
  cursor: pointer;
  z-index: 7;
  user-select: none;
  > svg {
    path {
      fill: ${(props) => (props.isDarkMode ? '#fff' : '#333')};
    }
  }
`;

const ArrowDown = styled(ArrowDownIcon)`
  margin-left: 10px;
`;

type FilterPillProps = {
  children: ReactNode;
  filtersShown: string[];
  which: string;
  setFiltersShown: any;
  title: ReactNode;
  isDarkMode: boolean;
};

export default function FilterPill(props: FilterPillProps) {
  const { children, filtersShown, which, setFiltersShown, title, isDarkMode } = props;

  function toggleFilterShow() {
    setFiltersShown(
      filtersShown.indexOf(which) === -1 ? filtersShown.concat(which) : filtersShown.filter((x) => x !== which)
    );
  }
  return (
    <Pill onClick={() => toggleFilterShow()} isDarkMode={isDarkMode}>
      <Trans>{title}</Trans>
      <ArrowDown />
      <Fade in={filtersShown.indexOf(which) > -1} timeout={600}>
        <div>{children}</div>
      </Fade>
    </Pill>
  );
}
