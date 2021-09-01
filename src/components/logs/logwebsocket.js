import mitt from 'mitt';
import { List } from 'immutable';
import { bufferConcat, convertBufferToLines } from 'react-lazylog/src/utils';

const crypto = window.require('crypto');
const WebSocket = window.require('ws');

export default (url, weboptions, cert_options) => {
    const { onClose, onError } = weboptions;
    const emitter = mitt();
    let encodedLog = new Uint8Array();
    let overage = null;
    const encoder = new TextEncoder('utf-8');

    emitter.on('data', data => {
        encodedLog = bufferConcat(encodedLog, encoder.encode(data));
        const { lines, remaining } = convertBufferToLines(encoder.encode(data), overage);
        overage = remaining;

        emitter.emit('update', { lines, encodedLog });
    });

    emitter.on('done', () => {
        if (overage) {
            emitter.emit('update', { lines: List.of(overage), encodedLog });
        }
        emitter.emit('end', encodedLog);
    });

    emitter.on('start', () => {
        try {
            // try to connect to websocket
            const socket = new WebSocket(url, cert_options);

            socket.on('open', function open() {
                const regservice = JSON.stringify({
                    command: 'register_service',
                    data: { "service": "daemon_logs" },
                    ack: false,
                    origin: 'daemon_logs',
                    destination: 'daemon',
                    request_id: crypto.randomBytes(32).toString('hex'),
                });

                const getlog = JSON.stringify({
                    command: 'get_logfile',
                    data: { "service": "daemon_logs" },
                    ack: false,
                    origin: 'daemon_logs',
                    destination: 'daemon',
                    request_id: crypto.randomBytes(32).toString('hex'),
                });

                socket.send(regservice);
                socket.send(getlog);
            });

            if (onClose)
                socket.on('close', onClose(null));

            if (onError)
                socket.on('error', onError(err));

            socket.on('message', function incoming(message) {
                let msg = JSON.parse(message);

                if (msg.command === "register_service") {
                    return;
                }

                if (msg.command === "get_logfile") {
                    // this returns one big string in msg.data.log
                    emitter.emit('data', msg.data.log);
                }

                if (msg.command === "log_update") {
                    // this returns an array of strings in msg.data.log
                    for (var i = 0; i < msg.data.log.length; i++) {
                        emitter.emit('data', msg.data.log[i]);
                    }
                }
            });

            emitter.on('abort', () => socket.close());
        } catch (err) {
            emitter.emit('error', err);
        }
    });

    return emitter;
};