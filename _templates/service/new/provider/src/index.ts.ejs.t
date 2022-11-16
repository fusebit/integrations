---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/src/index.ts
---
import Provider from './<%= h.capitalize(name) %>Provider';

export default Provider;
