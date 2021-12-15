# Fusebit Integrations
## 👋 Welcome to Fusebit 

Our product enables developers like you to quickly add integrations to an application using powerful API building blocks. It takes away the pain of developing against many disparate APIs while maintaining the flexibility and familiarity of a code-first platform. Just like Stripe solves payments for application developers, Fusebit solves integrations.

This repository includes our official integrations packages for popular services and Fusebit SDK.
These packages are available when you create an integration, learn more about 
[integrations](https://developer.fusebit.io/docs)


**Join our community**

<a target="_blank" href="https://fusebitio.slack.com">![alt text](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white "Slack logo")</a>

## 🧑‍🤝‍🧑 Contributing

You will be able to collaborate soon!

## 🧰 Packages

Available packages

| Name         |          Type           |
| ------------ | :---------------------: |
| @fusebit-int/framework        |         Fusebit SDK         |
| @fusebit-int/oauth-connector   | Generic OAuth Connector |
| @fusebit-int/oauth-provider      |   Generic OAuth Provider   |
| @fusebit-int/hubspot-connector |   HubSpot Connector   |
| @fusebit-int/hubspot-provider     |   HubSpot SDK Provider          |
| @fusebit-int/slack-connector      |   Slack Connector   |
| @fusebit-int/slack-provider      |    Slack SDK Provider   |

## 💻 Installation

Before using, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 14.17.6 or higher is recommended.

You need to install lerna globally

```bash
npm i -g lerna
```

### Install Dependencies

```bash
npm i
```

### Install package dependencies

```bash
lerna bootstrap
```

### Build TypeScript

```bash
lerna run build
```

## Available utilities enabled by default

- TypeScript
- Testing with [Jest](https://jestjs.io/) and [Tap reporter](https://www.npmjs.com/package/jest-tap-reporter)
- TypeScript linting using eslint
- TypeScript watch mode available
- Formatting using Prettier
- Pre-commit hook using Husky (will run linter, formatting and unit tests before each commit)

# Example Commands:

| Command |          Description |
| ------------ | :---------------------: |
| `lerna run <command> --scope=<package>` | Filter a lerna command for a certain package |
| `cd <package> && npm run dev` | Watch a particular package |
| `lerna run lint:check` | Check for issues identified by lint |
| `lerna run lint:fix` | Run the linter, automatically fixing identified issues |
| `npm run prettier:check` | Check to see if all files are pretty |
| `npm run prettier:fix` | Make all of the files pretty |
| `lerna run packages:version` | Use an interactive prompt to select the next version |
| `npm run packages:version [minor,patch,major]` | Automatically bump the version of all packages |
| `npm run dev:version` | Automatically bump the prerelease version |
| `lerna clean --yes` | Clean the tree |
| `git commit ... --no-verify` | Do a commit while disabling the pre-commit checks |
| `./scripts/publish_all.sh <profile name>` | Automatically publish everything to your fusebit registry. |
| `lerna run test` | Run all of the tests |
| `lenra run test --scope @fusebit-int/oauth-connector` | Run the tests for just the `oauth-connector` package |
| `lerna run build --scope @fusebit-int/slack-connector` | Build and run the tests for a specific package |
| `npx hygen service new` | Create a new connector and provider, using the results of the prompts |
| `npx hygen snippet new` | Create a new snippet for an existing connector, using the results of the prompts |
| `npx hygen catalog new` | Create a new catalog entry for the connector and provider, using the results of the prompts |
| `npx hygen help` | See available actions |
