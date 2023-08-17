import React, { type ReactNode } from 'react';

import LayoutHero from '../LayoutHero';
import Loading from '../Loading';

export type LayoutLoadingProps = {
  children?: ReactNode;
};

export default function LayoutLoading(props: LayoutLoadingProps) {
  const { children } = props;

  return (
    <LayoutHero>
      <Loading center />
      {children}
    </LayoutHero>
  );
}
