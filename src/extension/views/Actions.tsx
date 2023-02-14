import { observer } from 'mobx-react';
import { root } from '../stores';

export const Actions = observer(() => {
    const items = root.actions
        .map(x => x)
        .sort((a, b) => a.id - b.id)
        .map(x => (
            <div
                key={x.id}
                onClick={x.fire}
                className="action-btn"
            >
                {x.label}
            </div>
        ));

    return (
        <div className="views--actions">
            {items}
        </div>
    );
});
