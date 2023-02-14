import { AppAction } from './msg';
import { $msg, DevAction } from './msg';

export class Action {
    constructor(
        private id: number,
        private label: string,
        private onCall: () => void | boolean | Promise<void>,
    ) {
        $msg.app.post({
            action: DevAction.ActionRegister,
            label,
            id,
        });

        window.addEventListener('message', msg => {
            if (!$msg.isApp(msg.data)) {
                return;
            }

            if (msg.data.action !== AppAction.ActionFire) {
                return;
            }

            if (msg.data.id !== id) {
                return;
            }

            onCall();
        });
    }

    /**
     * Removes action from UI
     */
    dispose = () => {};

    /**
     * Lock action
     */
    lock = () => {};

    /**
     * Unock action
     */
    unlock = () => {};
}
