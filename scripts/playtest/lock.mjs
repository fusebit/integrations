#!/usr/bin/env zx

const fs = require('fs')

const LOCK_KEY = 'lock/playwright'
const LONG_POLL = argv['long-poll']
const FORCE = argv['force']


const tryEnsureLock = async() => {
    const lock = await tryGetLock()
    if (lock.data.locked === "true") {
        console.log(`PlayWright is locked by ${lock.data.user}`)
        process.exit(1)
    }
    return lock
}

const pollEnsureLock = async() => {
    let locked = true
    do {
        const lock = await tryGetLock()
        if (lock.data.locked === 'false') {
            return lock
        }
        locked = true
    } while (locked)
}

const tryGetLock = async() => {
    try {
        return JSON.parse(await $`fuse storage get --storageId ${LOCK_KEY} -o json`)
    } catch (_) {
        await createNewLock()
        return tryGetLock()
    }
}

// Sometimes the lock can be accidentally deleted, recreate lock here if it isn't found
const createNewLock = async() => {
    fs.writeFileSync('tmp', JSON.stringify({ data: { locked: 'false', user: 'Matthew Zhao' } }))
    await $`cat tmp | fuse storage put - --storageId ${LOCK_KEY}`
    fs.rmSync('tmp')
}

const gainLock = async (lock) => {
    lock.data.user = await whoami()
    lock.data.locked = 'true'
    fs.writeFileSync('tmp', JSON.stringify(lock))
    await $`cat tmp | fuse storage put - --storageId ${LOCK_KEY}`
    fs.rmSync('tmp')
}

const loseLock = async (lock) => {
    lock.data.locked = 'false'
    fs.writeFileSync('tmp', JSON.stringify(lock))
    await $`cat tmp | fuse storage put - --storageId ${LOCK_KEY} -o json`
    fs.rmSync('tmp')
}

const whoami = async () => {
    return (await $`git config --global --get user.name`).toString().split('\n')[0]
}

const writeEtag = (etag) => {
    fs.writeFileSync('.lock', etag)
}

const getEtag = () => {
    return fs.readFileSync('.lock', 'utf-8')
}

const acquireLock = async(force) => {
    let lock;
    if (LONG_POLL) {
        lock = await pollEnsureLock()
    } else if (FORCE) {
        lock = await tryGetLock()
    }
     else {
        lock = await tryEnsureLock()
    }
    if (force) {
        delete lock.etag
    }
    await gainLock(lock)
    lock = await tryGetLock()
    writeEtag(lock.etag)
}

const unlock = async (force) => {
    let lock = await tryGetLock()
    const tag = await getEtag()
    if (force) {
        delete lock.etag
    }

    if (lock.etag && lock.etag !== tag) {
        console.log('An newer process have acquired the lock.')
        process.exit(1)
    }

    await loseLock(lock)
}

(async () => {
    const action = argv._[1]
    if (action === 'lock')
            await acquireLock(FORCE)
    if (action === 'unlock')
            await unlock(FORCE)
})()