import { type Plugin } from "rollup";
import { type IPathObject } from "@nfts/tsc-json";
export type RollupAliasOptions = {
    alias: IPathObject;
};
/**
 * tsconfig paths to alias.
 * this plugin need to be the first one of the rollup plugin array.
 * @param alias
 */
export default function alias({ alias }: RollupAliasOptions): Plugin;
