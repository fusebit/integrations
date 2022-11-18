---
inject: true
to: "<%= `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/src/index.ts` %>"
after: '// Webhook management'
---
<% if (includeWebhooks) { -%>
// TODO: Implement proper Webhook Schema validation
const Joi = this.middleware.validate.joi;

// Webhook management
this.router.post(
    '/api/webhook',
    this.middleware.authorizeUser('connector:execute'),
    async (ctx: Connector.Types.Context) => {
    ctx.body = await this.service.registerWebhook(ctx);
    }
);

this.router.patch(
    '/api/webhook/:id',
    this.middleware.authorizeUser('connector:execute'),
    async (ctx: Connector.Types.Context) => {
    ctx.body = await this.service.updateWebhook(ctx);
    }
);

this.router.delete(
    '/api/webhook/:id',
    this.middleware.authorizeUser('connector:execute'),
    async (ctx: Connector.Types.Context) => {
    ctx.body = await this.service.deleteWebhook(ctx);
    }
);

this.router.get(
    '/api/webhook/:id',
    this.middleware.authorizeUser('connector:execute'),
    async (ctx: Connector.Types.Context) => {
    ctx.body = await this.service.getWebhook(ctx);
    }
);

this.router.get(
    '/api/webhook',
    this.middleware.authorizeUser('connector:execute'),
    async (ctx: Connector.Types.Context) => {
    ctx.body = await this.service.listWebhooks(ctx);
    }
);
<% } -%>