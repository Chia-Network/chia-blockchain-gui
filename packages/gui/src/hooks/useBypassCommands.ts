import { uniq } from 'lodash';
import { useState, useEffect } from 'react';

export default function useBypassCommands() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [bypassCommands, setBypassCommands] = useState<string[]>([]);

  async function loadBypassCommands() {
    try {
      setLoading(true);
      const currentCommands = await window.appAPI.getBypassCommands();
      setBypassCommands(currentCommands);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBypassCommands();
  }, []);

  async function setCommands(newCommands: string[]) {
    await window.appAPI.setBypassCommands(newCommands);
    await loadBypassCommands();
  }

  async function addCommand(command: string) {
    const currentCommands = await window.appAPI.getBypassCommands();
    if (currentCommands.includes(command)) {
      return;
    }

    const newCommands = uniq([...currentCommands, command]);
    await setCommands(newCommands);
  }

  async function removeCommand(command: string) {
    const currentCommands = await window.appAPI.getBypassCommands();
    if (!currentCommands.includes(command)) {
      return;
    }

    const newCommands = currentCommands.filter((cmd) => cmd !== command);
    await setCommands(newCommands);
  }

  return {
    commands: bypassCommands,
    loading,
    error,
    setCommands,
    addCommand,
    removeCommand,
  };
}
