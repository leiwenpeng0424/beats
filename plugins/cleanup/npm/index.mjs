import { file } from '@nfts/nodeutils';
import * as nodeFs from 'node:fs';

function cleanup({ dir } = { dir: "./npm" }) {
  let removed = false;
  return {
    name: "rmdir",
    generateBundle: {
      handler() {
        if (removed)
          return;
        const realPath = file.normalize(dir);
        if (nodeFs.existsSync(realPath)) {
          file.rmdirSync(realPath);
          removed = true;
        }
      }
    }
  };
}

export { cleanup };
