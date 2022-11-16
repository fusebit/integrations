---
to: "<%= (includeWebhooks || generateTypes) ? `src/${name.toLowerCase()}/${name.toLowerCase()}-types/.eslintrc.js` : null %>"
---
module.exports = require('../../../base-eslintrc');