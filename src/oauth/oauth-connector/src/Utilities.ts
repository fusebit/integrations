import fs from 'fs';
import { join } from 'path';

type Entries<T extends Record<string, any>> = [keyof T, any][];

export const ObjectEntries = <T>(obj: T): Entries<T> => {
  return Object.entries(obj) as Entries<T>;
};

export const loadFilecontent = async (fileName: string, folder: string, elements: Record<string, string>) => {
  const path = join(__dirname, folder, fileName);
  const content = await fs.promises.readFile(path, 'utf8');
  return content.replace(/{{([^}]*)}}/g, (r, k) => elements[k]);
};
