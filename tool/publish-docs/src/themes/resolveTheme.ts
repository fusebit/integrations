import resolveFile from '../resolveFile';

export default async (theme: string) => {
  return await resolveFile(`themes/${theme}.css`);
};
