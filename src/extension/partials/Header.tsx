import { observer } from 'mobx-react';
import { root } from '../stores';

export const Header = observer(() => {
    const items = [
        ['actions', 'Actions'],
        ['variables', 'Variables'],
        ['stores', 'Stores'],
    ] as const;

    const els = items.map(x => (
        <div
            className="menu-item"
            data-is-active={root.currentView === x[0]}
        >
            {x[1]}
        </div>
    ));

    return (
        <div className="header">
            <div className="left">
                {els}
            </div>
            <div className="right"></div>
        </div>
    );
});