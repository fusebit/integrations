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

### If you want to filter command for certain package

```bash
lerna run <command> --scope=<package>
```

### Watch mode
Navigate to the package you're working on and run

```bash
npm run dev
```

### Run linter with auto fix

```bash
lerna run lint:fix
```

### Run prettier checks

```bash
npm run prettier:check
```

### Run prettier fix

```bash
npm run prettier:fix
```

### Run linter

```bash
lerna run lint
```
### Run linter fix

```bash
lerna run lint:fix
```

## Available utilities enabled by default

- TypeScript
- Testing with [Jest](https://jestjs.io/) and [Tap reporter](https://www.npmjs.com/package/jest-tap-reporter)
- TypeScript linting using eslint
- TypeScript watch mode available
- Formatting using Prettier
- Pre-commit hook using Husky (will run linter, formatting and unit tests before each commit)

## Conventions

- Source folder: src
- Output directory: libc
- Sourcemaps enabled by default
- All the eslint plugins are using the recommended defaults

## Versioning
Interactive prompt
### If you want to choose from an interactive prompt use

```bash
npm run packages:version
```

### Chosee between minor, patch and major releases

```bash
npm run packages:version [minor,patch,major]
```



