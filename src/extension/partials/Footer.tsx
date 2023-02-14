import { observer } from 'mobx-react';
import { root } from '../stores/root';
import { If } from '../bits';

declare const SELF_VERSION: string;

const Status = observer(() => (
    <span className="status" data-is-connected={root.isAppConnected}>
        <If cond={() => root.isAppConnected}>
            Connected
        </If>
        <If cond={() => !root.isAppConnected}>
            Disconnected
        </If>
    </span>
));

export const Footer = () => (
    <div className="footer">
        <div className="left">
            <Status />
        </div>
        <div className="right">
            JSense v{SELF_VERSION}
        </div>
    </div>
);