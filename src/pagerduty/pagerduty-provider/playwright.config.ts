export { PlayWrightConfig } from '@fusebit-int/play';
const config = {
  timeout: 180000,
  testDir: 'play',
  reporter: [['json', { outputFile: 'results.json' }]],
};

export default config;
