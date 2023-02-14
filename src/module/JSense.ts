import { $msg, DevAction } from '~/module/msg';
import { Action } from './Action';
import { Store } from './Store';

export class JSense {
    private isEnabled = false;

    private lastIds: Record<string, number> = {
        action: 0,
    };

    start = () => {
        this.isEnabled = true;
        window.postMessage($msg.create('dev', {
            action: DevAction.Init,
        }), '*');
    };

    stop = () => {
        this.isEnabled = false;
    };

    createAction = (
        label: string,
        onCall: () => void | boolean | Promise<void>,
    ) => (
        new Action(this.generateNextId('action'), label, onCall)
    );

    createSnapshotStore = <T>(
        label: string,
        firstValue: T,
        onReverseUpdate: (value: string) => void | boolean | Promise<void>,
    ) => {
        return new Store<T>(label, 'snapshot', firstValue, onReverseUpdate);
    };

    createSimpleStore = <T>(
        label: string,
        firstValue: T,
        onReverseUpdate: (value: string) => void | boolean | Promise<void>,
    ) => {
        return new Store<T>(label, 'simple', firstValue, onReverseUpdate);
    };

    private generateNextId = (type: string) => {
        const nextId = (this.lastIds[type] ?? 0) + 1;
        this.lastIds[type] = nextId;
        return nextId;
    };

    static instance?: JSense;

    static init() {
        let instance = JSense.instance;

        if (!instance) {
            instance = new JSense();
            JSense.instance = instance;
        }

        return instance;
    }
}
