import nodePath from 'node:path';
import nodeFs from 'node:fs/promises';

function cleanup({ active } = { active: true }) {
  return {
    name: "rmdir",
    version: "0.0.1",
    async generateBundle(output, _, isWrite) {
      if (active && !isWrite) {
        if (output.file) {
          const absPath = nodePath.join(process.cwd(), output.file);
          try {
            await nodeFs.access(absPath);
            await nodeFs.unlink(absPath);
            await nodeFs.unlink(`${absPath}.map`);
          } catch (e) {
          }
        }
      }
    }
  };
}

export { cleanup as default };
