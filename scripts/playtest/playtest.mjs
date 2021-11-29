#!/usr/bin/env zx

const fs = require('fs');

// The name of the deployment
// api.us-west-1 on.us-west-1 etc.
// only need to match up with how storage is set.
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;
const successWebhook = process.env.SUCCESS_WEBHOOK;
const failureWebhook = process.env.FAILURE_WEBHOOK;

const getServicesWithPlay = async () => {
  let files = await fs.promises.readdir('./src');
  // Framework doesn't have a provider.
  files = files.filter((file) => file !== 'framework');
  return files.filter((filename) => {
    let files = fs.readdirSync(`./src/${filename}/${filename}-provider/`);
    return files.includes('play');
  });
};

const installAwsCli = async () => {
  // Installing latest AWS CLIv2
  await $`apt install -y zip unzip`;
  await $`curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"`;
  await $`unzip awscliv2.zip`;
  await $`./aws/install`;
};

(async () => {
  // Install AWS CLI if running in CI/CD
  if (process.env.JOB_NAME) {
    await installAwsCli();
  }
  let storageErrors = [];
  let totalSuccess = true;
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

  // Clean out all integrations and connectors
  let success_int = false;
  let success_con = false;

  do {
    const ints = JSON.parse(await $`fuse integration ls -o json`);
    if (ints.items.length === 0) {
      success_int = true;
      break;
    }
    await Promise.all(ints.items.map((item) => $`fuse integration rm ${item.id} -q true`));
  } while (!success_int);

  do {
    const cons = JSON.parse(await $`fuse connector ls -o json`);
    if (cons.items.length === 0) {
      success_con = true;
      break;
    }
    await Promise.all(cons.items.map((item) => $`fuse connector rm ${item.id} -q true`));
  } while (!success_con);

  await $`lerna run play:install --concurrency 1`;
  await $`lerna run play --no-bail || true`;
  const slack_payload = {
    text: ':alarm_clock: Playwright results just came in :alarm_clock:',
    blocks: [],
  };
  for (const svc of servicesWithPlay) {
    const pl = JSON.parse(await fs.promises.readFile(`./src/${svc}/${svc}-provider/results.json`));
    const success = pl.suites[0].specs[0].ok;
    if (!success) {
      totalSuccess = false;
    }
    slack_payload.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '' +
          `${success ? ':white_check_mark:' : ':warning:'} ` +
          `${svc}'s playwright test ` +
          `${success ? 'passed' : 'failed'}`,
      },
    });
  }
  for (const failure of storageErrors) {
    slack_payload.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: configuration for ${failure} not found :warning:`,
      },
    });
  }
  const date = new Date().getTime();
  slack_payload.blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `To access trace files, run ./scripts/playtest/access.mjs ${date.toString()} <service>`,
    },
  });
  await $`curl -X POST -d ${JSON.stringify(slack_payload)} -H "Content-Type: application/json" ${
    totalSuccess ? successWebhook : failureWebhook
  }`;

  // Send output to AWS
  await Promise.all(
    servicesWithPlay.map((service) => {
      return $`aws s3 sync ./src/${service}/${service}-provider/test-results/ s3://fusebit-playwright-output/${date.toString()}/${service}/ || true`;
    })
  );
})();
