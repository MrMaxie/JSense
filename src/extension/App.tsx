import { observer } from 'mobx-react';
import { Header, Footer } from './partials';
import { If } from './bits';
import { root } from './stores';
import { Actions } from './views/Actions';

export const App = observer(() => {
    return (
        <div id="app">
            <Header />
            <div className="content">
                <If cond={() => root.currentView === 'actions'}>
                    <Actions />
                </If>
            </div>
            <Footer />
        </div>
    );
});
