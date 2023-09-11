import { a } from "@/a/a";
import { b } from "@/a/b/b";
import { c } from "@/a/b/c/c";
import { log } from "externals:stream";

export default function App() {
    log();
    return a + b + c;
}
