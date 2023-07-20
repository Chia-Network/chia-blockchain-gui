import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
/*
import React, { useCallback } from 'react';
/*
const Scrollbar = React.forwardRef(({ children, className, style }, ref) => {
  const refSetter = useCallback(
    (scrollbarsRef) => {
      if (scrollbarsRef) {
        // @ts-ignore
        ref.current = scrollbarsRef.osInstance().getElements().viewport;
      }
    },
    [ref]
  );

  return (
    <OverlayScrollbarsComponent ref={refSetter} className={className} style={style}>
      {children}
    </OverlayScrollbarsComponent>
  );
});
*/

export default OverlayScrollbarsComponent;
