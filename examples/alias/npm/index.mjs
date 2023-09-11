import { log } from 'externals:stream';

const a = 1;

const b = 2;

const c = 3 + a;

function App() {
  log();
  return a + b + c;
}

export { App as default };
//# sourceMappingURL=index.mjs.map
