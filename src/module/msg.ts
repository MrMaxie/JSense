type BaseMessage = {
    source: 'jsense-module';
    _seenByProxy?: boolean;
};

export enum DevAction {
    Init = '<<init>>',

    AppConnected = 'app/connected',
    AppDisconnected = 'app/disconnected',

    ActionRegister = 'action/register',
    ActionDispose = 'action/dispose'
}

export enum AppAction {
    DevConnected = 'dev/connected',
    DevDisconnected = 'dev/disconnected',

    ActionFire = 'action/fire',
}

type DevMessageBody = (
    | { action: DevAction.Init }
    | { action: DevAction.AppConnected }
    | { action: DevAction.AppDisconnected }
    | { action: DevAction.ActionRegister, id: number, label: string }
    | { action: DevAction.ActionDispose, id: number }
);

type DevMessage = BaseMessage & {
    target: 'dev';
} & DevMessageBody;

type AppMessageBody = (
    | { action: AppAction.DevConnected }
    | { action: AppAction.DevDisconnected }
    | { action: AppAction.ActionFire, id: number }
);

type AppMessage = BaseMessage & {
    target: 'app';
} & AppMessageBody;

export type Message = AppMessage | DevMessage;

const isMessage = (msg: any): msg is Message => (
    msg && typeof msg === 'object' && msg !== null && 'source' in msg && msg.source === 'jsense~' && 'action' in msg
);

const isAppMessage = (msg: any): msg is AppMessage => (
    isMessage(msg) && msg.target === 'app'
);

const isDevMessage = (msg: any): msg is DevMessage => (
    isMessage(msg) && msg.target === 'dev'
);

type CreateMsg = (
    & ((target: 'app', details: AppMessageBody) => AppMessage)
    & ((target: 'dev', details: DevMessageBody) => DevMessage)
);

const appPost = (details: DevMessageBody) => {
    window.postMessage(createMsg('dev', details), '*');
};

const toAppMsg = (msg: any) => isAppMessage(msg) ? msg : false;

const toDevMsg = (msg: any) => isDevMessage(msg) ? msg : false;

const createMsg = ((target: string, details: Record<string, unknown>) => ({
    target,
    source: 'jsense~',
    ...details,
})) as unknown as CreateMsg;

const markAsSeenByProxy = (msg: any) => {
    if (!isMessage(msg)) {
        return;
    }

    msg._seenByProxy = true;
};

const isSeenByProxy = (msg: any) => {
    if (!isMessage(msg)) {
        return;
    }

    return msg._seenByProxy === true;
};

export const $msg = {
    create: createMsg,
    castToApp: toAppMsg,
    castToDev: toDevMsg,
    isApp: isAppMessage,
    isDev: isDevMessage,
    isAny: isMessage,
    proxy: {
        markAsSeen: markAsSeenByProxy,
        isSeen: isSeenByProxy,
    },
    app: {
        post: appPost,
    },
};
