import { Trans } from '@lingui/macro';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import ArrowDownIcon from '../../../assets/img/arrow-down.svg';

const Pill = styled.div`
  display: flex;
  height: 38px;
  border: 1px solid #e0e0e0;
  box-radius: 5px;
  padding: 10px 15px;
  background: #fff;
  border-radius: 5px;
  align-items: center;
  cursor: pointer;
  z-index: 7;
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
};

export default function FilterPill(props: FilterPillProps) {
  const { children, filtersShown, which, setFiltersShown, title } = props;

  function toggleFilterShow() {
    setFiltersShown(
      filtersShown.indexOf(which) === -1 ? filtersShown.concat(which) : filtersShown.filter((x) => x !== which)
    );
  }
  return (
    <Pill onClick={() => toggleFilterShow()}>
      <Trans>{title}</Trans>
      <ArrowDown />
      <div style={{ display: filtersShown.indexOf(which) > -1 ? 'flex' : 'none' }}>{children}</div>
    </Pill>
  );
}
