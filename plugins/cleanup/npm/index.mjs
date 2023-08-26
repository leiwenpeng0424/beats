import { file } from '@nfts/nodeutils';

function cleanup({ dir } = { dir: "./npm" }) {
  let removed = false;
  return {
    name: "rmdir",
    generateBundle: {
      handler() {
        if (removed)
          return;
        console.log(`Removing ${file.normalize(dir)}`);
        file.rmdirSync(file.normalize(dir));
        removed = true;
      }
    }
  };
}

export { cleanup };
