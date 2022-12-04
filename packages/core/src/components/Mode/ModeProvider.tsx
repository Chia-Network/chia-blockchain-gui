import { usePrefs } from '@chia-network/api-react';
import React, { createContext, ReactNode, useState, useMemo, useCallback } from 'react';

import type Mode from '../../constants/Mode';

export const ModeContext = createContext<
  | {
      mode?: Mode;
      setMode: (mode: Mode) => void;
    }
  | undefined
>(undefined);

export type ModeProviderProps = {
  children: ReactNode;
  mode?: Mode;
  persist?: boolean;
};

export default function ModeProvider(props: ModeProviderProps) {
  const { mode: defaultMode, children, persist = false } = props;
  const [modeState, setModeState] = useState<Mode | undefined>(defaultMode);
  const [modePref, setModePref] = usePrefs<Mode | undefined>('mode', defaultMode);

  const handleSetMode = useCallback(
    (newMode: Mode) => {
      if (persist) {
        setModePref(newMode);
      } else {
        setModeState(newMode);
      }
    },
    [persist, setModePref, setModeState]
  );

  const mode = persist ? modePref : modeState;

  const context = useMemo(
    () => ({
      mode,
      setMode: handleSetMode,
    }),
    [mode, handleSetMode]
  );

  return <ModeContext.Provider value={context}>{children}</ModeContext.Provider>;
}
