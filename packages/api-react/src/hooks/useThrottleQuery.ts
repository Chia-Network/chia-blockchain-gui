import { throttle } from 'lodash';
import { useRef, useMemo } from 'react';

import useForceUpdate from './useForceUpdate';

const emptyObject = {};

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

  // Warning: Do not replace `useMemo` with `useCallback` below.
  // `useMemo` is correct.
  // lodash's `throttle` returns a function and does not execute the throttled function.
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
    selectFromResult(state: any) {
      refState.current = state;

      processUpdate();

      return emptyObject;
    },
  });

  return refState.current;
}
