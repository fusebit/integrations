import { promises as fs } from 'fs';

export const readFile = async (fileName: string) => {
  return await fs.readFile(fileName);
};
