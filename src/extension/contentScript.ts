import { $msg, DevAction } from '~/module/msg';

let port: chrome.runtime.Port | undefined;

const queue: any[] = [];

const onMessage = (request: any) => {
    request.source = 'jsense~';
    window.postMessage(request, '*');
};

const onDisconnect = () => {
    port?.onMessage.removeListener(onMessage);
    port?.disconnect();
    port = undefined;

    setTimeout(() => {
        reconnect();
    });
};

const reconnect = () => {
    if (port) {
        onDisconnect();
        return;
    }

    port = chrome.runtime.connect({ name: 'jsense-dev-port~0' });

    port.onDisconnect.addListener(onDisconnect);
    port.onMessage.addListener(onMessage);

    setTimeout(() => {
        while (queue.length > 0) {
            sendMessage(queue.pop());
        }
    });
};

const sendMessage = (msg: any) => {
    if (!port) {
        queue.push(msg);
        return;
    }

    try {
        port.postMessage(msg);
    } catch (err) {
        queue.push(msg);
        reconnect();
    }
};

window.addEventListener('message', event => {
    if (event.source !== window) {
        return;
    }

    const msg = event.data;

    if (!$msg.isAny(msg)) {
        return;
    }

    if ($msg.isDev(msg) && msg.action === DevAction.Init) {
        reconnect();
        return;
    }

    sendMessage(msg);
});
