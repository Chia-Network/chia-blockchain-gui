import React from 'react';
import { Trans } from '@lingui/macro';
import { Link } from '@chia/core';
import { LazyLog, ScrollFollow } from 'react-lazylog'
import LayoutMain from '../layout/LayoutMain';
import { LogsHeaderTarget } from './LogsHeader';
import logwebsocket from './logwebsocket';
import isElectron from 'is-electron';

class ChiaLog extends LazyLog {
  initEmitter() {
    const {
      url,
      websocketOptions,
    } = this.props;

    const keyStr: string | null = localStorage.getItem("WSS-KEY");
    const certStr: string | null = localStorage.getItem("WSS-CERT");

    const cert_options = {
      cert: certStr,
      key: keyStr,
      rejectUnauthorized: false,
      perMessageDeflate: false,
      maxPayload: 5000000000,
    };

    return logwebsocket(url, websocketOptions, cert_options);
  }
}

export default function Logs() {

  // get the daemon's uri from global storage (put there by loadConfig)
  let url = null;
  if (isElectron()) {
    const electron = window.require('electron');
    const { remote: r } = electron;
    url = r.getGlobal('daemon_rpc_ws');
  }

  return (
    <LayoutMain
      maxWidth="false"
      loading={false}
      loadingTitle={<Trans>Loading Logs</Trans>}
      title={
        <>
          <Link to="/dashboard/logs" color="textPrimary">
            <Trans>Logs</Trans>
          </Link>
          <LogsHeaderTarget />
        </>
      }
    >
      <ScrollFollow
        startFollowing={true}
        render={({ onScroll, follow }) => (
          <ChiaLog
            extraLines={2}
            enableSearch
            caseInsensitive
            selectableLines={true}
            url={url}
            stream
            onScroll={onScroll}
            follow={follow} />
        )}
      />
    </LayoutMain>
  );
}
