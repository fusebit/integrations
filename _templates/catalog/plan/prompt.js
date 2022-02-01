module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'Name of the Out-Of-Plan Feed Entry',
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
    name: 'feedTags',
    message: 'Comma separated list of tags for the feed',
  },
];
