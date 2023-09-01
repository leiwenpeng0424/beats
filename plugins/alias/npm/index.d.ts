import { IPathObject } from '@nfts/tsc-json';
import { Plugin as Plugin_2 } from 'rollup';

/**
 * ts-config paths to alias.
 * This plugin need to be the first one of the rollup plugin array.
 * @param alias
 */
export declare function alias({ alias }: RollupAliasOptions): Plugin_2;

/**
 * Map alias to realpath.
 * @param alias
 * @returns
 */
export declare const aliasToModulePath: (alias?: IPathObject) => (id: string) => string | null;

export declare type RollupAliasOptions = {
    alias: IPathObject;
};

export { }
