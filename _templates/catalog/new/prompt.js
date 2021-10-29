module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'Name of the feed entry',
  },
  {
    type: 'input',
    name: 'svgImage',
    message: 'SVG Image (two blank lines to finish)\n',
    multiline: true,
  },
  {
    type: 'input',
    name: 'scope',
    message: 'Space separated list of the default connector scopes',
  },
];
