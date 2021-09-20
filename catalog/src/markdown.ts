import { join } from 'path';

import * as fsSync from 'fs';
const fs = fsSync.promises;

const importDir = 'markdown';

export const loadImports = async () => {
  const files = (await fs.readdir(importDir)).filter(
    (fileName) => !fsSync.lstatSync(join(importDir, fileName)).isDirectory()
  );

  const result: Record<string, string> = {};

  for (const filename of files) {
    result[filename.replace('.md', '')] = (await fs.readFile(join(importDir, filename))).toString();
  }

  return result;
};

export const generateMarkdown = (
  sourceFileName: string,
  input: string,
  includeMeta: boolean,
  imports: Record<string, string>
) => {
  const lines = input.split('\n');

  const output: string[] = [];

  const cmdRe = new RegExp('^\\[//]: # \\(([A-Z]*): ([A-Z]*)\\)$');

  lines.forEach((line) => {
    const match = line.match(cmdRe);

    if (match && match[1] === 'IMPORT') {
      if (!imports[match[2]]) {
        console.error(`[WARN] ${sourceFileName}: Unknown import ${match[2]}; dropping line.`);
        return;
      }
      if (includeMeta) {
        output.push('', `[//]: # (START: ${match[2]})`, '');
      }
      output.push(imports[match[2]]);
      if (includeMeta) {
        output.push('', `[//]: # (END: ${match[2]})`, '');
      }
    } else {
      output.push(line);
    }
  });

  return output.join('\n');
};
