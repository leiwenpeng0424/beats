import type { Plugin as Plugin_2 } from 'rollup';

declare function bundleProgress(): Plugin_2;
export default bundleProgress;

export declare type BundleStatus = {
    loaded: number;
    parsed: number;
};

export { }
