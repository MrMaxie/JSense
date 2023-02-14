import { useEffect, useState } from 'react';
import { jsense } from '../module';

export const App = () => {
    const [value, setValue] = useState(0);

    const inc = () => setValue(x => x + 1);
    const dec = () => setValue(x => x - 1);

    useEffect(() => {
        const a1 = jsense.createAction('Set 100', () => {
            setValue(100);
        });
        const a2 = jsense.createAction('Up', inc);
        const a3 = jsense.createAction('Down', dec);
        const vs1 = jsense.createSimpleStore('Value', value, v => {
            setValue(() => parseInt(v, 10));
        });

        return () => {
            a1.dispose();
            a2.dispose();
            a3.dispose();
            vs1.dispose();
        };
    }, []);

    return (
        <>
            <div>Value: {value}</div>
            <button onClick={() => setValue(x => x + 1)}>
                +
            </button>
            <button onClick={() => setValue(x => x - 1)}>
                -
            </button>
        </>
    );
};
