import { ipcRenderer } from 'electron';

import React, { useEffect } from 'react';
import styled from 'styled-components';

const LogContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  background-color: #000;
  color: #fff;
  font-family: monospace;
`;

export default function Logs(): React.ReactElement {
  useEffect(() => {
    const handleNewLogLine = (_: any, logLine: string) => {
      const logContainer = document.getElementById('logContainer');
      if (logContainer) {
        const newLogLine = document.createElement('div');
        newLogLine.textContent = logLine;
        logContainer.appendChild(newLogLine);
      }
    };

    ipcRenderer.on('log-line', handleNewLogLine);

    return () => {
      ipcRenderer.removeListener('log-line', handleNewLogLine);
    };
  }, []);

  return <LogContainer id="logContainer" />;
}
