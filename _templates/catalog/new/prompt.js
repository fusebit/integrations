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
  {
    type: 'input',
    name: 'scope',
    message: 'Space separated list of the default connector scopes',
  },
];
