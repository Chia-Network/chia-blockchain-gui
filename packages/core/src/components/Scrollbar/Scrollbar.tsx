import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { forwardRef, type ReactNode } from 'react';

import useScrollbarsSettings from '../../hooks/useScrollbarsSettings';

export type ScrollbarProps = {
  children: ReactNode;
};

function Scrollbar(props: ScrollbarProps, ref: any) {
  const { children, ...rest } = props;
  const { autoHide } = useScrollbarsSettings();

  return (
    <OverlayScrollbarsComponent options={{ scrollbars: { autoHide } }} {...rest} ref={ref}>
      {children}
    </OverlayScrollbarsComponent>
  );
}

export default forwardRef(Scrollbar);
