const requireAllValues = (value) =>
  Object.entries(value).reduce((prev, entry) => prev || entry[1].length === 0, false)
    ? 'All fields must be supplied'
    : true;

module.exports = [
  {
    type: 'input',
    name: 'name',
    message:
      'Supply the name of the new service, for example "Slack", or "HubSpot". Capitalize the\n' +
      '  appropriate letters.\n\n  Name',
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
  },
  {
    type: 'form',
    name: 'play',
    message: `Playwright tests configuration.
    Many systems require a consistent and predictable id for webhooks, callback urls, etc.
    Choose an integration id and a connector id that won't conflict`,
    choices: [
      { name: 'connector', message: 'Connector name' },
      { name: 'integration', message: 'Integration name' },
      { name: 'eventType', message: 'Webhook event type' },
    ],
    validate: requireAllValues,
  },
].map((e) => ({ ...e, required: true }));
