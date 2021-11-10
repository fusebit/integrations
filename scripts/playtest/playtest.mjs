#!/usr/bin/env zx

const fs = require('fs');

// The name of the deployment
// api.us-west-1 on.us-west-1 etc.
// only need to match up with how storage is set.
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;
const successWebhook = 'https://hooks.slack.com/services/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';
const failureWebhook = 'https://hooks.slack.com/services/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';

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
  let totalSuccess = true;
  const servicesWithPlay = await getServicesWithPlay();
  console.log(servicesWithPlay);
  for (const service of servicesWithPlay) {
    let storageKeys;
    try {
      JSON.parse(await $`fuse storage get -o json --storageId playwright/creds/${service}/${DEPLOYMENT_KEY}`);
    } catch (_) {
      storageErrors.push(service);
      servicesWithPlay = servicesWithPlay.filter((svc) => svc !== service);
    }
    for (const storageKey of Object.keys(storageKeys.data)) {
      await fs.promises.appendFile(
        `src/${service}/${service}-provider/.env.playwright`,
        `${storageKey}=${storageKeys.data[storageKey]}\n`
      );
    }
  }
  await $`lerna run play-install`;
  await $`lerna run play`;
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
        text: '' + `:warning: configuration for ${failure} not found :warning:`,
      },
    });
  }
  $`curl -X POST -d ${JSON.stringify(slack_payload)} -H "Content-Type: application/json" ${
    totalSuccess ? successWebhook : failureWebhook
  }`;
})();
