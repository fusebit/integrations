#!/usr/bin/env zx

const fs = require('fs')

// The name of the deployment
// api.us-west-1 on.us-west-1 etc.
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY

const getServicesWithPlay = async () => {
    let files = await fs.promises.readdir('./src')
    // Framework doesn't have a provider.
    files = files.filter((file) => file !== 'framework')
    return files.filter((filename) => {
        let files = fs.readdirSync(`./src/${filename}/${filename}-provider/`)
        files = files.filter((fileWithin) => fileWithin === 'play')
        return files.length === 1
    })
}

(async () => {
    const servicesWithPlay = await getServicesWithPlay()
    console.log(servicesWithPlay)
    for (const service of servicesWithPlay) {
        console.log(service)
        const storageKeys = JSON.parse(await $`fuse storage get -o json --storageId playwright/creds/${service}/${DEPLOYMENT_KEY}`)
        for (const storageKey of Object.keys(storageKeys.data)) {
            fs.promises.appendFile(`src/${service}/${service}-provider/.env.playwright`, `${storageKey}=${storageKeys.data[storageKey]}\n`)
        }
    }
    await $`lerna run play-install`
    await $`lerna run play`
})()