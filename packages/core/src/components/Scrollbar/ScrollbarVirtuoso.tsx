import React, { useCallback, forwardRef, type ReactNode } from 'react';

import Scrollbar from './Scrollbar';

export type ScrollbarProps = {
  children: ReactNode;
};

function ScrollbarVirtuoso(props: ScrollbarProps, ref: any) {
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
    <Scrollbar {...rest} ref={refSetter}>
      {children}
    </Scrollbar>
  );
}

export default forwardRef(ScrollbarVirtuoso);
