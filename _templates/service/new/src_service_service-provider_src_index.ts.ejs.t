---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/src/index.ts
---
import <%= h.capitalize(name) %>Provider from './Provider';

export default <%= h.capitalize(name) %>Provider;
