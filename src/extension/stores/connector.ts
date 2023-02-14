import { Message } from '~/module/msg';

let port = undefined as chrome.runtime.Port | undefined;
let onMessageListeners: Array<(request: any) => void> = [];

const onDisconnect = () => {
    port?.disconnect();
    port = undefined;

    setTimeout(() => {
        reconnect();
    });
};

const onMessageHandler = (request: any) => {
    onMessageListeners.forEach(x => {
        x(request);
    });
};

const reconnect = () => {
    if (port) {
        onDisconnect();
        return;
    }

    port = chrome.runtime.connect({
        name: [
            'jsense-dev-port',
            chrome.devtools.inspectedWindow.tabId ?? '0',
        ].join('~'),
    });

    port.onDisconnect.addListener(onDisconnect);
    port.onMessage.addListener(onMessageHandler);
};

setTimeout(() => {
    reconnect();
});

const onMessage = (fn: (req: any) => void) => {
    onMessageListeners.push(fn);
};

const offMessage = (fn: (req: any) => void) => {
    onMessageListeners = onMessageListeners.filter(x => x !== fn);
};

export const connector = {
    message: {
        on: onMessage,
        off: offMessage,
    },
    send: (data: Message) => {
        port?.postMessage(data);
    },
};
