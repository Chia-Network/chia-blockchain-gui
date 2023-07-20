import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { useCallback, forwardRef, type ReactNode } from 'react';

export type ScrollbarProps = {
  children: ReactNode;
};

function Scrollbar(props: ScrollbarProps, ref: any) {
  const { children, ...rest } = props;

  const refSetter = useCallback(
    (scrollbarsRef) => {
      if (scrollbarsRef) {
        // eslint-disable-next-line no-param-reassign -- We do not have types for this
        ref.current = scrollbarsRef.osInstance().getElements().viewport;
      }
    },
    [ref]
  );

  return (
    <OverlayScrollbarsComponent {...rest} ref={refSetter}>
      {children}
    </OverlayScrollbarsComponent>
  );
}

export default forwardRef(Scrollbar);
