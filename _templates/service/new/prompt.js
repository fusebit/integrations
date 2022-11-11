const requireAllValues = (value) =>
  Object.entries(value).reduce((prev, entry) => prev || entry[1].length === 0, false)
    ? 'All fields must be supplied'
    : true;

function skipIfNpmPackageNotAvailable() {
  return !this.state.answers?.npmPackageProvided;
}

function skipIfOAuthNotAvailable() {
  return this.state.answers?.type !== 'OAuth 2.0 Connector';
}

function skipIfOAuthAvailable() {
  return this.state.answers?.type === 'OAuth 2.0 Connector';
}

function skipIfNpmPackageIsAvailable() {
  return this.state.answers?.npmPackageProvided;
}

function skipIfAPIClientNotCreated() {
  return !this.state.answers?.includeApiClient;
}

module.exports = [
  {
    type: 'input',
    name: 'name',
    message:
      'Supply the name of the new service, for example "Slack", or "HubSpot". Capitalize the\n' +
      '  appropriate letters.\n\n  Name',
  },
  {
    type: 'confirm',
    name: 'npmPackageProvided',
    message: 'Does the service offer a public npm package?',
  },
  {
    type: 'form',
    name: 'provider',
    message:
      'Specify the name of the package in the public npm repository used by customers to manipulate\n' +
      '  the service.',
    choices: [
      { name: 'package', message: 'Package name' },
      { name: 'semver', message: 'Semver' },
    ],
    validate: requireAllValues,
    skip: skipIfNpmPackageNotAvailable,
  },
  {
    type: 'confirm',
    name: 'includeApiClient',
    message: 'Do you want to include an API Client for your Provider?',
    skip: skipIfNpmPackageIsAvailable,
  },
  {
    type: 'input',
    name: 'apiClientBaseUrl',
    message: "What's the API Client base URL (example: https://api.example.com/api/v2)?",
    skip: skipIfAPIClientNotCreated,
    validate: requireAllValues,
  },
  {
    type: 'select',
    name: 'type',
    message: 'What kind of authorization do you want to use?',
    choices: ['OAuth 2.0 Connector', 'Private Key Connector'],
  },
  {
    type: 'form',
    name: 'connector',
    message: 'Specify the OAuth URLs used by the service',
    choices: [
      { name: 'tokenUrl', message: 'Token Exchange URL' },
      { name: 'authorizationUrl', message: 'Authorization URL' },
      { name: 'revokeUrl', message: 'Revocation URL' },
    ],
    validate: requireAllValues,
    skip: skipIfOAuthNotAvailable,
  },
  {
    type: 'input',
    name: 'privateKeyFieldName',
    message: 'Specify the name of the private key field (defaults to API Key)',
    validate: requireAllValues,
    skip: skipIfOAuthAvailable,
    default: 'API Key',
  },
  {
    type: 'confirm',
    name: 'includeWebhooks',
    message: 'Do you want to generate a Webhook Client?',
    validate: requireAllValues,
  },
].map((e) => ({ ...e, required: true }));
