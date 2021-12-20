#!/usr/bin/env zx

const fs = require('fs');

// The domain name of the deployment
// api.us-west-1 on.us-west-1 etc.
// only need to match up with how storage is set.
const DOMAIN_KEY = argv._[1];

if (!DOMAIN_KEY) {
  console.log('Usage:');
  console.log(`  ${argv._[0]} on.fusebit.io [--envonly] [--norename] `);
  process.exit(1);
}

$.verbose = false;

const getServicesWithPlay = async () => {
  let files = await fs.promises.readdir('./src');

  // Framework doesn't have a provider.
  files = files.filter((file) => file !== 'framework');

  return files.filter((filename) => {
    const dirList = fs.readdirSync(`./src/${filename}/${filename}-provider/`);
    return dirList.includes('play');
  });
};

const writeEnvFiles = async (services) => {
  const storageErrors = [];
  for (const service of services) {
    let storageKeys;
    try {
      storageKeys = JSON.parse(await $`fuse storage get -o json --storageId playwright/creds/${service}/${DOMAIN_KEY}`);
      console.log(`[ ] ... ${service}`);
      fs.unlinkSync(`src/${service}/${service}-provider/.env.playwright`);
      for (const storageKey of Object.keys(storageKeys.data)) {
        fs.appendFileSync(
          `src/${service}/${service}-provider/.env.playwright`,
          `${storageKey}=${storageKeys.data[storageKey]}\n`
        );
      }
    } catch (_) {
      console.log(`[ ] ... \x1b[9m${service}\x1b[0m`);
      storageErrors.push(service);
      services = services.filter((svc) => svc !== service);
    }
  }

  return { services, storageErrors };
};

(async () => {
  console.log(`[+] Writing credential files:`);
  const allServices = await getServicesWithPlay();
  await writeEnvFiles(allServices);

  if (argv.envonly) {
    process.exit(0);
  }

  try {
    await $`git diff --exit-code`;
  } catch (_) {
    console.log('[!] WARNING WARNING WARNING: Your Branch Is Not Clean, Commit Before Testing WARNING WARNING WARNING');
    process.exit(1);
  }

  if (!argv.norename) {
    console.log('[+] Patching files to use scope: @stage-fusebit');
    await $`LANG=c find ./ ! -name '*.mjs' ! -name '*.sh' -type f -exec sed -i '' 's/fusebit-int/stage-fusebit/g' {} \\;`;
  }

  console.log('[+] Building');
  await $`npm i && lerna bootstrap && lerna run build`;
  if (JSON.parse(fs.readFileSync('package.json')).name.includes('fusebit-int')) {
    console.log(
      '[!] WARNING WARNING WARNING your packages are not renamed, so you are publishing to fusebit-int. Please rename your files'
    );
    process.exit(1);
  }

  console.log('[+] Publishing');
  await $`./scripts/publish_all_force.sh`;

  console.log('[+] Installing playwright');
  await $`lerna run play:install --concurrency 1`;

  console.log('[>] Locking usage of the credentials for the test');
  await $`./scripts/playtest/lock.mjs lock`;

  console.log('[=] Running tests');
  await $`lerna run play --no-bail || true`;

  console.log('[<] Unlocking credentials');
  await $`./scripts/playtest/lock.mjs unlock`;

  if (!argv.norename) {
    await $`git stash`;
  }
})();
