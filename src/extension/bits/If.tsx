import { observer } from 'mobx-react';
import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
    cond: () => boolean;
}>;

export const If = observer((p: Props) => (
    p.cond()
        ? <>{p.children}</>
        : null
));
