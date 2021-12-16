#!/usr/bin/env zx

const fs = require('fs');

// The name of the deployment
// api.us-west-1 on.us-west-1 etc.
// only need to match up with how storage is set.
const DEPLOYMENT_KEY = argv._[1];
const PROFILE_NAME = argv._[2];

const getServicesWithPlay = async () => {
  let files = await fs.promises.readdir('./src');
  // Framework doesn't have a provider.
  files = files.filter((file) => file !== 'framework');
  return files.filter((filename) => {
    let files = fs.readdirSync(`./src/${filename}/${filename}-provider/`);
    return files.includes('play');
  });
};

const me = async () => {
  if (process.env.JOB_NAME) {
    return 'CICD';
  } else {
    const user = await $`whoami`;
    if (user.includes('root')) {
      console.log('Do not use root user to execute this test!');
      process.exit(1);
    }
    return user;
  }
};

(async () => {
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
  await $`lerna run play --no-bail || true`;
})();
