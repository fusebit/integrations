#!/usr/bin/env zx

const fs = require('fs');

// The domain name of the deployment
// api.us-west-1 on.us-west-1 etc.
// only need to match up with how storage is set.
const DOMAIN_KEY = argv._[1];
const NORENAME = argv['norename'];

const getServicesWithPlay = async () => {
  let files = await fs.promises.readdir('./src');
  // Framework doesn't have a provider.
  files = files.filter((file) => file !== 'framework');
  return files.filter((filename) => {
    let files = fs.readdirSync(`./src/${filename}/${filename}-provider/`);
    return files.includes('play');
  });
};

(async () => {
  let storageErrors = [];
  let servicesWithPlay = await getServicesWithPlay();
  console.log(servicesWithPlay);
  for (const service of servicesWithPlay) {
    let storageKeys;
    try {
      storageKeys = JSON.parse(await $`fuse storage get -o json --storageId playwright/creds/${service}/${DOMAIN_KEY}`);
      for (const storageKey of Object.keys(storageKeys.data)) {
        await fs.promises.appendFile(
          `src/${service}/${service}-provider/.env.playwright`,
          `${storageKey}=${storageKeys.data[storageKey]}\n`
        );
      }
    } catch (_) {
      storageErrors.push(service);
      servicesWithPlay = servicesWithPlay.filter((svc) => svc !== service);
    }
  }
  try {
    await $`git diff --exit-code`;
  } catch (_) {
    console.log('WARNING WARNING WARNING: Your Branch Is Not Clean, Commit Before Testing WARNING WARNING WARNING');
    process.exit(1);
  }
  if (!NORENAME) {
    await $`LANG=c find ./ ! -name '*.mjs' ! -name '*.sh' -type f -exec sed -i '' 's/fusebit-int/stage-fusebit/g' {} \\;`;
  }
  await $`npm i && lerna bootstrap && lerna run build`;
  if (JSON.parse(fs.readFileSync('package.json')).name.includes('fusebit-int')) {
    console.log(
      'WARNING WARNING WARNING your packages are not renamed, so you are publishing to fusebit-int. Please rename your files'
    );
    process.exit(1);
  }
  await $`./scripts/publish_all_force.sh`;
  await $`lerna run play:install --concurrency 1`;
  await $`./scripts/playtest/lock.mjs lock`;
  await $`lerna run play --no-bail || true`;
  await $`./scripts/playtest/lock.mjs unlock`;
  if (!NORENAME) {
    await $`git stash`;
  }
})();
