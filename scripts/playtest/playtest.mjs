#!/usr/bin/env zx

const fs = require('fs');

// The domain name of the deployment
const DOMAIN_KEY = process.env.DOMAIN_KEY;
const successWebhook = process.env.SUCCESS_WEBHOOK;
const failureWebhook = process.env.FAILURE_WEBHOOK;
const repositoryCommitUrl = 'https://github.com/fusebit/integrations/commit/';

$.verbose = false;

const nameToMention = {
  'Matthew Zhao': '<@U01UDTF3VQR>',
  'Benn Bollay': '<@UUPT2SQN7>',
  'Ruben Restrepo': '<@U0277EMBRSN>',
  'Bruno Krebs': '<@U027X5JG8QG>',
  'Tomasz Janczuk': '<@UFN96HN1J>',
  'Yavor Georgiev': '<@UDGRLGJTG>',
  'Chris More': '<@U01NQDVLYKB>',
  'Shehzad Akbar': '<@U02CP37DEU8>',
  'Jacob Haller-Roby': '<@U01NQDVRW0Z>',
  'Liz Parody': '<@U02EJPA1MCJ>',
};

const getServicesWithPlay = async () => {
  let files = await fs.promises.readdir('./src');

  // Framework doesn't have a provider.
  files = files.filter((file) => file !== 'framework');

  return files.filter((filename) => {
    const dirList = fs.readdirSync(`./src/${filename}/${filename}-provider/`);
    return dirList.includes('play');
  });
};

const installAwsCli = async () => {
  // Installing latest AWS CLIv2
  await $`apt install -q -y zip unzip`;
  await $`curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"`;
  await $`unzip -q awscliv2.zip`;
  await $`./aws/install`;
};

const collectResults = (servicesWithPlay) => {
  const results = {};

  for (const svc of servicesWithPlay) {
    results[svc] = JSON.parse(fs.readFileSync(`./src/${svc}/${svc}-provider/results.json`, 'utf8'));
  }

  return results;
};

const convertResultsToSpecs = (results) => {
  // Add the serviceName to all of the specs
  Object.entries(results).forEach(([serviceName, result]) =>
    result.suites.forEach((suite) => suite.specs.forEach((spec) => (spec.serviceName = serviceName)))
  );

  const suites = Object.values(results)
    .map((result) => result.suites)
    .flat();
  return suites.map((suite) => suite.specs).flat();
};

const writeEnvFiles = async (services) => {
  const storageErrors = [];
  for (const service of services) {
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
      services = services.filter((svc) => svc !== service);
    }
  }

  return { services, storageErrors };
};

const cleanEntities = async (entityType) => {
  do {
    const entity = JSON.parse(await $`fuse ${entityType} ls -o json`);
    if (entity.items.length === 0) {
      break;
    }
    await Promise.all(entity.items.map((item) => $`fuse ${entityType} rm ${item.id} -q true`));
  } while (true);
};

const uploadPlaywrightTraces = async (services) => {
  const timeStamp = new Date().toISOString();
  // Send output to AWS
  await Promise.all(
    services.map((service) => {
      return $`aws s3 sync --no-progress ./src/${service}/${service}-provider/test-results/ s3://fusebit-playwright-output/${timeStamp}/${service}/ || true`;
    })
  );

  return timeStamp;
};

const getGitCommits = async () => {
  await $`git log -n 10  --pretty=%aN,%h,%s > /tmp/commits.txt`;
  const commitFile = fs.readFileSync('/tmp/commits.txt', 'utf8');
  const commits = commitFile.split('\n').filter((ln) => ln.length);
  return commits
    .map((commit) => {
      const commitSplit = commit.split(',');
      return {
        name: commitSplit[0],
        hash: commitSplit[1],
        message: commitSplit.slice(2).join(','),
      };
    })
    .filter((commit) => commit.name !== 'The GOAT')
    .slice(0, 3);
};

const createSlackBlocks = (services, unknown, title, specTest) => {
  const results = collectResults(services);
  console.log(`results: ${JSON.stringify(results, null, 2)}`);

  // It's inefficient, but so what.
  const specs = convertResultsToSpecs(results);
  const pass = specs.filter((spec) => spec.ok && specTest(spec));
  const fail = specs.filter((spec) => !spec.ok && specTest(spec));

  const block = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${title} Test Results`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Passing: ${pass.length} tests*`,
          },
          {
            type: 'mrkdwn',
            text: ' ' + ':white_check_mark:'.repeat(pass.length),
          },
          {
            type: 'mrkdwn',
            text: `*Failed: ${fail.length} tests*`,
          },
          {
            type: 'mrkdwn',
            text: ' ' + ':x:'.repeat(fail.length),
          },
          {
            type: 'mrkdwn',
            text: `*Missing Config: ${unknown.length} tests*`,
          },
          {
            type: 'mrkdwn',
            text: ' ' + ':grey_question:'.repeat(unknown.length),
          },
        ],
      },
    ],
  };

  if (fail.length) {
    block.blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '*Passed Tests*:',
          },
          { type: 'mrkdwn', text: ' ' + pass.map((p) => p.serviceName).join('\n') },
          {
            type: 'mrkdwn',
            text: '*Unknown Tests*:',
          },
          { type: 'mrkdwn', text: ' ' + unknown.join('\n') },
          {
            type: 'mrkdwn',
            text: '*Failed Tests*:',
          },
          { type: 'mrkdwn', text: ' ' + fail.map((f) => f.serviceName).join('\n') },
        ],
      }
    );
  }

  return [block, fail.length];
};

const addCommitterBlock = (block, commits) => {
  const section = {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: '*Last Committers*',
      },
      {
        type: 'plain_text',
        text: ' ',
      },
    ],
  };

  commits.forEach((commit) => {
    section.fields.push(
      {
        type: 'mrkdwn',
        text: `${nameToMention[commit.name] || commit.name}`,
      },
      {
        type: 'mrkdwn',
        text: `<${repositoryCommitUrl}${commit.hash}|${commit.hash}>: ${commit.message}`,
      }
    );
  });
  block.blocks.push(section);

  return block;
};

const addSlackTrailer = (block, timeStamp) => {
  block.blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: ':mag: Traces',
        },
        {
          type: 'mrkdwn',
          text: `:gear: <${process.env.BUILD_URL}|Logs>`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '\n ```./scripts/access_pw_logs.mjs ' + `${timeStamp}` + ' <service-name>```',
      },
    }
  );

  return block;
};

const sendSlackBlocks = async (blocks, numFail) => {
  const url = numFail === 0 ? successWebhook : failureWebhook;
  await $`curl -X POST -d ${JSON.stringify(blocks)} -H "Content-Type: application/json" ${url}`;
};

(async () => {
  // Install AWS CLI if running in CI/CD
  if (process.env.JOB_NAME) {
    await installAwsCli();
  }

  const allServices = await getServicesWithPlay();

  let { services, storageErrors } = await writeEnvFiles(allServices);

  // Clean out all integrations and connectors
  await cleanEntities('integration');
  await cleanEntities('connector');

  // Run tests
  await $`lerna run play:install --concurrency 1`;
  await $`./scripts/playtest/lock.mjs lock --long-poll`;
  await $`lerna run play --no-bail || true`;
  await $`./scripts/playtest/lock.mjs unlock`;
  // Upload results to S3
  const timeStamp = await uploadPlaywrightTraces(services);

  // Get git commit results
  const commits = await getGitCommits();

  // Post a slack message for proxy tests results, one for proxy results, and one for general
  const resultSets = {
    Proxy: (spec) => spec.title.toLowerCase().includes('proxy'),
    General: (spec) => !spec.title.toLowerCase().includes('proxy'),
  };

  await Promise.all(
    Object.entries(resultSets).map(async ([name, filter]) => {
      let [blocks, numFail] = createSlackBlocks(services, storageErrors, name, filter);
      if (numFail) {
        blocks = addCommitterBlock(blocks, commits);
        blocks = addSlackTrailer(blocks, timeStamp);
      }

      console.log(JSON.stringify(blocks, null, 2), numFail);
      await sendSlackBlocks(blocks, numFail);
    })
  );
})();
