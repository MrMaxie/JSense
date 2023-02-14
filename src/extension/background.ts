import { $msg, DevAction, AppAction } from '../module/msg';

const contextList = new Map<number, {
    app?: chrome.runtime.Port;
    appQueue: any[];
    dev?: chrome.runtime.Port;
    devQueue: any[];
}>;

const getContext = (id: number) => {
    let ctx = contextList.get(id);

    if (!ctx) {
        ctx = {
            app: undefined,
            dev: undefined,
            appQueue: [],
            devQueue: [],
        };
        contextList.set(id, ctx);
    }

    return ctx;
};

const resolveMessage = (id: number, msg: any) => {
    const ctx = getContext(id);

    if (!$msg.isAny(msg)) {
        return;
    }

    if ($msg.proxy.isSeen(msg)) {
        return;
    }

    $msg.proxy.markAsSeen(msg);

    if ($msg.isDev(msg)) {
        if (ctx.dev) {
            ctx.dev.postMessage(msg);
        } else {
            ctx.devQueue.push(msg);
        }
        console.log(`%c[app] [${id}] %O`, 'color: #e0aaff', msg);
        return;
    }

    if ($msg.isApp(msg)) {
        if (ctx.app) {
            ctx.app.postMessage(msg);
        } else {
            ctx.appQueue.push(msg);
        }
        console.log(`%c[dev] [${id}] %O`, 'color: #4cc9f0', msg);
    }
};

const updateConnectionsInfo = (id: number) => {
    const ctx = getContext(id);

    const msgAppCon = $msg.create('app', { action: AppAction.DevConnected });
    const msgDevCon = $msg.create('dev', { action: DevAction.AppConnected });
    const msgAppDis = $msg.create('app', { action: AppAction.DevDisconnected });
    const msgDevDis = $msg.create('dev', { action: DevAction.AppDisconnected });

    ctx.dev?.postMessage(ctx.app ? msgDevCon : msgDevDis);
    ctx.app?.postMessage(ctx.dev ? msgAppCon : msgAppDis);

    if (ctx.dev) {
        while (ctx.devQueue.length > 0) {
            ctx.dev.postMessage(ctx.devQueue.pop());
        }
    }

    if (ctx.app) {
        while (ctx.appQueue.length > 0) {
            ctx.app.postMessage(ctx.appQueue.pop());
        }
    }

    console.log('Id:', id, 'App:', Boolean(ctx.app), 'Dev:', Boolean(ctx.dev));
};

chrome.runtime.onConnect.addListener(port => {
    let tabId = port.sender?.tab?.id;
    let portName: 'app' | 'dev' | undefined = undefined;

    if (tabId) {
        if (port.name !== 'jsense-dev-port~0') {
            return;
        }

        portName = 'app';
    } else {
        const nameParts = port.name.split('~');

        if (nameParts.length !== 2) {
            return;
        }

        const [constant, strTabId] = nameParts;

        if (constant !== 'jsense-dev-port') {
            return;
        }

        if (!/^\d+$/.test(strTabId)) {
            return;
        }

        tabId = parseInt(strTabId, 10);
        portName = 'dev';
    }

    const ctx = getContext(tabId);

    console.log(`%c[system] [${tabId}] ${portName} connected!`, 'color: #ff4433');

    ctx[portName] = port;

    updateConnectionsInfo(tabId);

    const handler = (request: any) => {
        resolveMessage(tabId!, request);
    };

    port.onMessage.addListener(handler);

    port.onDisconnect.addListener(() => {
        console.log(`%c[system] [${tabId}] ${portName} disconnected!`, 'color: #ff4433');

        port.onMessage.removeListener(handler);
        ctx[portName!] = undefined;

        updateConnectionsInfo(tabId!);
    });
});
