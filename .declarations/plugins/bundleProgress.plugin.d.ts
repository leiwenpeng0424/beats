import { type Plugin } from "rollup";
export type BundleStatus = {
    loaded: number;
    parsed: number;
};
export default function bundleProgress(): Plugin;
