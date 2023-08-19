import { IPathObject } from '@nfts/tsc-json';
import { Plugin as Plugin_2 } from 'rollup';

/**
 * tsconfig paths to alias.
 * this plugin need to be the first one of the rollup plugin array.
 * @param alias
 */
declare function alias({ alias }: RollupAliasOptions): Plugin_2;
export default alias;

export declare type RollupAliasOptions = {
    alias: IPathObject;
};

export { }
