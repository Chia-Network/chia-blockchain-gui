import { useContext, useEffect, useState, ReactNode, useCallback } from 'react';

import ModalDialogsContext from '../components/ModalDialogs/ModalDialogsContext';

export default function useOpenDialog() {
  const [dialogs, setDialogs] = useState<ReactNode[]>([]);
  const context = useContext(ModalDialogsContext);
  if (!context) {
    throw new Error('Use ModalDialogsProvider provider');
  }

  const { hide, show } = context;

  // remove all modals after unmount
  useEffect(
    () => () => {
      dialogs.forEach((dialog) => {
        hide(dialog);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Used only for unmounting
    []
  );

  const handleOpen = useCallback(
    async (dialog: ReactNode) => {
      setDialogs((prevState) => [...prevState, dialog]);

      const result = await show(dialog);

      setDialogs((prevState) => prevState.filter((d) => d !== dialog));

      return result;
    },
    [show]
  );

  return handleOpen;
}
