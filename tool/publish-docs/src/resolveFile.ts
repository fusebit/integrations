import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default async (fileName: string) => {
  const filePath = resolve(__dirname, fileName);
  const file = await readFile(filePath);
  return file.toString('utf-8');
};
