import { createRoot } from 'react-dom/client';
import { App } from './App';
import { jsense } from '../module';

const main = () => {
    const $el = document.getElementById('app');

    jsense.start();

    if (!$el) {
        return;
    }

    const root = createRoot($el);
    root.render(<App />);
};

main();
