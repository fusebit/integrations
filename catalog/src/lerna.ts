import { spawnSync } from 'child_process';

export const getPackages = () => {
  return JSON.parse(spawnSync('lerna', ['list', '--json'], { cwd: '..', encoding: 'utf8' }).stdout).reduce(
    (acc: any, pkg: any) => {
      acc[pkg.name] = pkg;
      return acc;
    },
    {}
  );
};
