import { types, destroy } from 'mobx-state-tree';
import { Action } from './Action';
import { connector } from './connector';
import { $msg, DevAction } from '~/module/msg';

export const root = types
    .model({
        isAppConnected: false,
        actions: types.array(Action),
        currentView: types.enumeration([
            'actions',
            'variables',
            'stores',
        ]),
    })
    .actions(self => ({
        onMessage(data: any) {
            const msg = $msg.castToDev(data);

            if (!msg) {
                return;
            }

            switch (msg.action) {
                case DevAction.AppConnected:
                    self.isAppConnected = true;
                    self.actions.clear();
                    return;

                case DevAction.AppDisconnected:
                    self.isAppConnected = false;
                    self.actions.clear();
                    return;

                case DevAction.ActionRegister:
                    self.actions.push(Action.create({
                        id: msg.id,
                        label: msg.label,
                    }));
                    return;

                case DevAction.ActionDispose:
                    const action = self.actions.find(x => x.id === msg.id);


                    if (!action) {
                        return;
                    }

                    destroy(action);
                    self.actions.remove(action);
                    return;
            }
        },
        afterCreate() {
            connector.message.on(this.onMessage);
        },
        beforeDestroy() {
            connector.message.off(this.onMessage);
        },
    }))
    .create({
        currentView: 'actions',
    });
