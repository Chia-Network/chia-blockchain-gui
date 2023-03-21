import { throttle } from 'lodash';
import { useRef, useMemo } from 'react';

import useForceUpdate from './useForceUpdate';

export default function useThrottleQuery(
  queryHook: Function,
  variables?: Object,
  options?: Object,
  throttleOptions: {
    wait?: number;
    leading?: boolean;
    trailing?: boolean;
  } = {}
) {
  const { leading = true, trailing = true, wait = 0 } = throttleOptions;

  const forceUpdate = useForceUpdate();

  const refState = useRef<any>();

  const processUpdate = useMemo(
    () =>
      throttle(() => forceUpdate(), wait, {
        leading,
        trailing,
      }),
    [wait, leading, trailing, forceUpdate]
  );

  queryHook(variables, {
    ...options,
    selectFromResult(state) {
      refState.current = state;

      processUpdate();

      return null;
    },
  });

  return refState.current;
}
