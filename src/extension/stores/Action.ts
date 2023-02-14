import { connector } from './connector';
import { types } from 'mobx-state-tree';
import { $msg, AppAction } from '~/module/msg';

export const Action = types
    .model({
        id: types.identifierNumber,
        label: types.string,
    })
    .actions(self => ({
        fire: () => {
            connector.send($msg.create('app', {
                id: self.id,
                action: AppAction.ActionFire,
            }));
        },
    }));
