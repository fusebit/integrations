module.exports = [
  {
    type: 'input',
    name: 'connector',
    message:
      'Supply the name of an existing connector, for example "slack", or "hubspot". Case insensitive.' +
      '\n\n  Connector',
  },
  {
    type: 'input',
    name: 'snippet',
    message:
      'Supply the name of the new snippet to create, for example "send-message", or "get-companies". Case insensitive. Use hyphens to delineate words.' +
      '\n\n  Snippet',
  },
].map((e) => ({ ...e, required: true }));
