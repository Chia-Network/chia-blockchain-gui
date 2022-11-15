import React, { type ReactNode } from 'react';

import LayoutHero from '../LayoutHero';
import Loading from '../Loading';

export type LayoutLoadingProps = {
  children?: ReactNode;
  hideSettings?: boolean;
};

export default function LayoutLoading(props: LayoutLoadingProps) {
  const { children, hideSettings } = props;

  return (
    <LayoutHero hideSettings={hideSettings}>
      <Loading center />
      {children}
    </LayoutHero>
  );
}
