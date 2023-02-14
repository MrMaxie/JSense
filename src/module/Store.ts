type StoreType = 'snapshot' | 'simple';

export class Store<T> {
    constructor(
        private label: string,
        private type: StoreType,
        private value: T,
        private onReverseUpdate: (value: string) => void | boolean | Promise<void>,
    ) {}

    /**
     * Removes store from UI
     */
    dispose = () => {};

    /**
     * Updates stored value
     */
    update = (value: T) => {};
}
