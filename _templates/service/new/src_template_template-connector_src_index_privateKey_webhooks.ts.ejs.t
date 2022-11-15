---
to: "<%= !connector.tokenUrl && includeWebhooks ? `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/src/index.ts` : null %>"
---
import { PrivateKeyConnector } from '@fusebit-int/privatekey-connector';
import { Service } from './Service';

class ServiceConnector extends PrivateKeyConnector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected getServiceName(): string {
    return '<%= name %>';
  }

  protected getKeyName(): string {
    return '<%= privateKeyFieldName %>';
  }

  cosntructor() {
    super();
    
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
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };