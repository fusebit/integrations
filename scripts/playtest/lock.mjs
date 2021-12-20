#!/usr/bin/env zx

const fs = require('fs');
const os = require('os');
const path = require('path');

const LOCK_KEY = `lock/playwright`;
const LONG_POLL = argv['long-poll'];
const FORCE = argv['force'];

$.verbose = false;

const makeTmpFile = () => {
  const name = fs.mkdtempSync(path.join(os.tmpdir(), 'fusebit-playwright-lock'));
  return path.join(name, 'lock');
};

const tryEnsureLock = async () => {
  const lock = await tryGetLock();
  if (lock.data.locked === 'true') {
    console.log(`PlayWright is locked by ${lock.data.user}`);
    process.exit(1);
  }
  return lock;
};

const pollEnsureLock = async () => {
  do {
    const lock = await tryGetLock();
    if (lock.data.locked === 'false') {
      return lock;
    }
  } while (true);
};

const tryGetLock = async () => {
  try {
    return JSON.parse(await $`fuse storage get --storageId ${LOCK_KEY} -o json`);
  } catch (_) {
    await createNewLock();
    return tryGetLock();
  }
};

// Sometimes the lock can be accidentally deleted, recreate lock here if it isn't found
const createNewLock = async () => {
  const fileName = makeTmpFile();
  fs.writeFileSync(fileName, JSON.stringify({ data: { locked: 'false', user: 'Matthew Zhao' } }));
  await $`cat ${fileName} | fuse storage put - --storageId ${LOCK_KEY}`;
};

const gainLock = async (lock) => {
  lock.data.user = await whoami();
  lock.data.locked = 'true';
  const fileName = makeTmpFile();
  fs.writeFileSync(fileName, JSON.stringify(lock));
  await $`cat ${fileName} | fuse storage put - --storageId ${LOCK_KEY}`;
};

const loseLock = async (lock) => {
  lock.data.locked = 'false';
  const fileName = makeTmpFile();
  fs.writeFileSync(fileName, JSON.stringify(lock));
  await $`cat ${fileName} | fuse storage put - --storageId ${LOCK_KEY} -o json`;
};

const whoami = async () => {
  try {
    return (await $`git config --global --get user.name`).toString().split('\n')[0];
  } catch (_) {
    // Jenkins doesn't have git configured for user.name
    return (await $`whoami`).toString();
  }
};

const writeEtag = (etag) => {
  fs.writeFileSync('.playwright.lock', etag);
};

const getEtag = () => {
  try {
    return fs.readFileSync('.playwright.lock', 'utf-8');
  } catch (_) {
    console.log('WARNING - No lock found!');
    return 'THISISAIMPOSSIBLETOGETETAGBLAHBLAHBLAH';
  }
};

const acquireLock = async (force) => {
  let lock;
  if (LONG_POLL) {
    lock = await pollEnsureLock();
  } else if (FORCE) {
    lock = await tryGetLock();
  } else {
    lock = await tryEnsureLock();
  }
  if (force) {
    delete lock.etag;
  }
  await gainLock(lock);
  lock = await tryGetLock();
  writeEtag(lock.etag);
};

const unlock = async (force) => {
  let lock = await tryGetLock();
  const tag = await getEtag();
  if (force) {
    delete lock.etag;
  }

  if (lock.etag && lock.etag !== tag) {
    console.log('An newer process have acquired the lock.');
    process.exit(1);
  }

  await loseLock(lock);
};

(async () => {
  const action = argv._[1];
  if (action === 'lock') await acquireLock(FORCE);
  if (action === 'unlock') await unlock(FORCE);
})();
