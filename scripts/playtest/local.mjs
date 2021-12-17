#!/usr/bin/env zx

const fs = require('fs');

// The name of the deployment
// api.us-west-1 on.us-west-1 etc.
// only need to match up with how storage is set.
const DEPLOYMENT_KEY = argv._[1];
const forced = argv.forced;
const LOCK_NAME = 'lock/playwright';

const lock = async (me) => {
  // Check if lock exists
  const get = JSON.parse(await $`fuse storage get --storageId ${LOCK_NAME} -o json`);
  if (get.data.locked === 'true') {
    console.log(`${get.data.name} is currently using playwright to perform tests, please wait...`);
    process.exit(1);
  }
  fs.writeFileSync('/tmp/lock', JSON.stringify({ data: { name: me, locked: 'true' }, etag: get.etag }));
  try {
    await $`cat /tmp/lock | fuse storage put - --storageId ${LOCK_NAME}`;
  } catch (_) {
    // This will fail if there is a race condition, try to lock again
    await lock(me);
  }
};

const unlock = async () => {
  fs.writeFileSync('/tmp/lock', JSON.parse({ data: { locked: 'false' } }));
  await $`cat /tmp/lock | fuse storage put - --storageId ${LOCK_NAME}`;
};

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
  let me = (await $`git config --global --get user.name`).toString();
  me = me.split('\n')[0];
  let storageErrors = [];
  let servicesWithPlay = await getServicesWithPlay();
  console.log(servicesWithPlay);
  for (const service of servicesWithPlay) {
    let storageKeys;
    try {
      storageKeys = JSON.parse(
        await $`fuse storage get -o json --storageId playwright/creds/${service}/${DEPLOYMENT_KEY}`
      );
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
  await $`LANG=c find ./ ! -name '*.mjs' ! -name '*.sh' -type f -exec sed -i '' 's/fusebit-int/stage-fusebit/g' {} \\;`;
  await $`npm i && lerna bootstrap && lerna run build`;
  await $`./scripts/publish_all_force.sh ${PROFILE_NAME}`;
  await $`lerna run play:install --concurrency 1`;
  if (forced) {
    await unlock();
  }
  await lock(me);
  await $`lerna run play --no-bail || true`;
  await unlock();
  await $`git stash`;
})();
