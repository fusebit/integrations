function skipIfNoSampleApp() {
  return !this.state.answers.isSampleApp;
}

function skipIfNoPostEnabled() {
  return !this.state.answers?.isPostEnabled;
}

function skipIfNoGetEnabled() {
  return !this.state.answers?.isGetEnabled;
}

module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'Name of the feed entry',
  },
  {
    type: 'input',
    name: 'svgImageSmall',
    message: 'Glyph-only SVG Image (two blank lines to finish)\n',
    multiline: true,
  },
  {
    type: 'input',
    name: 'svgImageLarge',
    message: 'Glyph and Wordmark SVG Image (two blank lines to finish)\n',
    multiline: true,
  },
  // {
  //   type: 'input',
  //   name: 'feedTags',
  //   message: 'Comma separated list of tags for the feed',
  // },
  {
    type: 'multiselect',
    name: 'feedTags',
    message: 'List of tags for the feed (select all that apply with spacebar)',
    choices: [
      'Project Management',
      'Dev Tools',
      'Office',
      'Marketing',
      'Productivity',
      'Email',
      'Messaging',
      'Calendar',
      'Storage',
      'Video Conferencing',
      'CRM',
      'Support',
      'Spreadsheets',
      'Operations',
      'Sales Automation',
      'Community',
      'Social',
      'Cloud',
      'Video',
    ],
  },
  {
    type: 'input',
    name: 'feedDescription',
    message: 'Description for the README.md',
  },
  {
    type: 'input',
    name: 'scope',
    message: 'Space separated list of the default connector scopes',
  },
  {
    type: 'input',
    name: 'connectorName',
    message: 'Name of the connector to use (i.e. "Slack", or "HubSpot")',
  },
  {
    type: 'input',
    name: 'connectorSDKLink',
    message: 'Link to the SDK for the connector.',
  },
  {
    type: 'confirm',
    name: 'isSampleApp',
    message: 'Supported by the Sample App?',
  },
  {
    type: 'confirm',
    name: 'isGetEnabled',
    message: 'isGetEnabled',
    skip: skipIfNoSampleApp,
  },
  {
    type: 'confirm',
    name: 'isPostEnabled',
    message: 'isPostEnabled',
    skip: skipIfNoSampleApp,
  },
  {
    type: 'input',
    name: 'itemName',
    message: 'itemName',
    skip: skipIfNoSampleApp,
  },
  {
    type: 'list',
    name: 'property1',
    message: 'Property 1 (Name, Label, comma separated)',
    skip: skipIfNoSampleApp,
  },
  {
    type: 'list',
    name: 'property2',
    message: 'Property 2 (Name, Label, comma separated)',
    skip: skipIfNoSampleApp,
  },
  {
    type: 'input',
    name: 'getFail',
    message: 'What message to show on GET failure?',
    skip: skipIfNoGetEnabled,
  },
  {
    type: 'input',
    name: 'postSuccess',
    message: 'What message to show on POST success?',
    skip: skipIfNoPostEnabled,
  },
  {
    type: 'input',
    name: 'postFail',
    message: 'What message to show on POST failure?',
    skip: skipIfNoPostEnabled,
  },
];
