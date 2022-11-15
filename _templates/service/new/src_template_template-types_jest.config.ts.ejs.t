---
to: "<%= (includeWebhooks || generateTypes) ? `src/${name.toLowerCase()}/${name.toLowerCase()}-types/jest.config.ts` : null %>"
---
import config from '../../../jest.config';

export default config;
