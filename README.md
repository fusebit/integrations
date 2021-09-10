# Fusebit packages
## 👋 Welcome to Fusebit packages

Our product enables developers like you to quickly add integrations to an application using powerful API building blocks. It takes away the pain of developing against many disparate APIs while maintaining the flexibility and familiarity of a code-first platform. Just like Stripe solves payments for application developers, Fusebit solves integrations.
This repository include our official integrations packages for popular services and Fusebit SDK.
This packages are available when you create an integration, learn more about 
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

## Available utilities enabled by default

- TypeScript
- Testing with [Jest](https://jestjs.io/) and [Tap reporter](https://www.npmjs.com/package/jest-tap-reporter)
- TypeScript linting using eslint
- TypeScript watch mode using ts-node-dev
- Formatting using Prettier
- Pre-commit hook using Husky (will run linter, formatting and unit tests before each commit)

## Conventions

- Source folder: src
- Output directory: libc
- Sourcemaps enabled by default
- All the eslint plugins are using the recommended defaults

## Available commands

### Build TypeScript

```bash
$ lerna run build
```

### Version packages

```bash
$ lerna version
```

### Run linter

```bash
$ npm run lint
```

### Run linter with auto fix

```bash
$ npm run lint:fix
```

### Run tests with coverage report

```bash
$ npm run coverage
```
