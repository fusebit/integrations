---
to: "<%= (includeWebhooks || generateTypes) ? `src/${name.toLowerCase()}/${name.toLowerCase()}-types/README.md` : null %>"
---
# `@fusebit-int/<%= name.toLowerCase() %>-types`

> Shared types between the provider and connector
