type Entries<T extends Record<string, any>> = [keyof T, any][];

export const ObjectEntries = <T>(obj: T): Entries<T> => {
  return Object.entries(obj) as Entries<T>;
};
