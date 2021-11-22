#!/usr/bin/env zx
const fs = require('fs/promises');
const { join } = require('path');
const { dirname } = require('path');
(async () => {
  // Install the toolchain
  await $`npm install -g @fusebit/cli`;
  // Import credentials
  await $`echo $FUSE_PROFILE_DEMOAPP_321_US_WEST_2_STAGE | base64 -d | fuse profile import demoapp.stage`;
  await $`echo $FUSE_PROFILE_DEMOAPP_763_US_WEST_1_API | base64 -d | fuse profile import demoapp.prod`;

  // Deploy to each profile
  for (const profile of ['demoapp.stage', 'demoapp.prod']) {
    await $`fuse profile set ${profile}`;
    const integration_templates = ['slack-bot'];
    const replaceKeys = {};
    for (const integration_template of integration_templates) {
      let integrationLayout = await $`fuse integration init -d placeholder -f ${integration_template} -o json  | jq`;
      integrationLayout = JSON.parse(integrationLayout);
      replaceKeys[integrationLayout.integrations[0].id] = `${integration_template}-integration`;
      for (const component of integrationLayout.integrations[0].data.components) {
        if (component.entityType !== 'connector') {
          continue;
        }
        replaceKeys[component.entityId] = component.name;
      }
      integrationLayout = JSON.stringify(integrationLayout);
      for (const replaceKey of Object.keys(replaceKeys)) {
        integrationLayout = integrationLayout.replace(new RegExp(replaceKey, 'g'), replaceKeys[replaceKey]);
      }
      integrationLayout = JSON.parse(integrationLayout);
      for (const index in integrationLayout.connectors) {
        const config = await getStorage(`config/${integration_template}/${integrationLayout.connectors[index].id}`);
        console.log(config);
        integrationLayout.connectors[index].data = mergeDeep(integrationLayout.connectors[index].data, config, true);
      }
      await $`mkdir integration`;
      await writeDirectory('integration', integrationLayout.integrations[0]);
      await $`cd integration && npm run deploy`;
      for (const connector of integrationLayout.connectors) {
        await $`mkdir connector`;
        await writeDirectory('connector', connector);
        await $`cd connector && npm run deploy`;
        await $`rm -rf connector`;
      }
    }
  }
})();

const getStorage = async (key) => {
  const storageRaw = await $`fuse storage get --storageId ${key} -o json`;
  try {
    const data = JSON.parse(storageRaw);
    return data.data;
  } catch (e) {
    return {};
  }
};

// Stolen from q5
const mergeDeep = (lhs, source, isMergingArrays = false) => {
  const target = ((obj) => {
    let cloneObj;
    try {
      cloneObj = JSON.parse(JSON.stringify(obj));
    } catch (err) {
      throw new Error('Circular references not supported in mergeDeep');
    }
    return cloneObj;
  })(lhs);

  const isObject = (obj) => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      if (isMergingArrays) {
        target[key] = targetValue.map((x, i) =>
          sourceValue.length <= i ? x : mergeDeep(x, sourceValue[i], isMergingArrays)
        );
        if (sourceValue.length > targetValue.length) {
          target[key] = target[key].concat(sourceValue.slice(targetValue.length));
        }
      } else {
        target[key] = targetValue.concat(sourceValue);
      }
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = mergeDeep({ ...targetValue }, sourceValue, isMergingArrays);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
};

const writeDirectory = async (path, spec) => {
  const FusebitStateFile = '.fusebit-state';
  const FusebitMetadataFile = 'fusebit.json';
  const cwd = path || process.cwd();

  // Write the version, if present
  await writeFile(join(cwd, FusebitStateFile), JSON.stringify({ version: spec.version }));
  delete spec.version;

  // Write all of the files in the specification
  await Promise.all(
    Object.entries(spec.data.files).map(async ([filename, contents]) => {
      await writeFile(join(cwd, filename), contents);
    })
  );

  delete spec.data.files;

  // Reconstruct the fusebit.json file
  const config = {
    id: spec.id,
    tags: spec.tags,
    ...spec.data,
  };

  await fs.writeFile(join(cwd, FusebitMetadataFile), JSON.stringify(config, null, 2));
};
