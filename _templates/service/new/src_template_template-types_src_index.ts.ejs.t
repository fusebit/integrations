---
to: "<%= (includeWebhooks || generateTypes) ? `src/${name.toLowerCase()}/${name.toLowerCase()}-types/src/index.ts` : null %>"
---
<%= includeWebhooks ? `
export interface ICreateWebhookProps {}

export interface IUpdateWebhookProps {}

export interface ICreateWebhookResponse {}

export interface IUpdateWebhookResponse {}

export interface IWebhookGetResponse {}

export interface IDeleteWebhookResponse {}

` : null %>