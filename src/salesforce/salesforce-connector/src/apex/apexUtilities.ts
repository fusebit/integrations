import fs from 'fs';
import { join } from 'path';

const loadApexFile = async (fileName: string) => {
  const path = join(__dirname, '../webhooks-templates', fileName);
  return await fs.promises.readFile(path, 'utf8');
};

const replaceElements = (content: string, elements: Record<string, string>) => {
  return content.replace(/{{([^}]*)}}/g, (r, k) => elements[k]);
};

export { loadApexFile, replaceElements };
