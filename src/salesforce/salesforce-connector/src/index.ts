import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const AUTHORIZATION_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SERVICE_NAME = 'Salesforce';
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';
const WEBHOOK_CONFIGURATION_SECTION = 'Webhook Development Configuration';

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  protected createService() {
    return new ServiceConnector.Service();
  }

  constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;

      ctx.body.schema.properties.webhooks = {
        type: 'array',
        enum: [
          'Account',
          'Campaign',
          'Case',
          'Contract',
          'Conversation',
          'Customer',
          'Employee',
          'Event (Calendar)',
          'Expense',
          'Goal',
          'Group',
          'Invoice',
          'Lead',
          'Opportunity',
          'Order',
          'Task',
          'TimeSheet',
          'User',
          'WorkOrder',
        ],
      };

      ctx.body.schema.properties.actions = {
        type: 'object',
        properties: {
          afterInsert: {
            type: 'boolean',
            description: 'After insert',
          },
          afterUpdate: {
            type: 'boolean',
            description: 'After update',
          },
          afterDelete: {
            type: 'boolean',
            description: 'After delete',
          },
          afterUndelete: {
            type: 'boolean',
            description: 'After undelete',
          },
        },
      };

      ctx.body.uischema.elements.push({
        type: 'Group',
        label: WEBHOOK_CONFIGURATION_SECTION,
        rule: {
          effect: 'SHOW',
          condition: {
            scope: '#/properties/mode/properties/useProduction',
            schema: {
              const: true,
            },
          },
        },
        elements: [
          {
            type: 'VerticalLayout',
            elements: [
              {
                type: 'HorizontalLayout',
                elements: [
                  {
                    type: 'Control',
                    scope: '#/properties/webhookPublisherClientId',
                  },
                  {
                    type: 'Control',
                    scope: '#/properties/webhookPublisherPrivateKey',
                    options: {
                      format: 'password',
                    },
                  },
                ],
              },
              {
                type: 'HorizontalLayout',
                elements: [
                  {
                    type: 'Control',
                    scope: '#/properties/webhookPublisherUser',
                  },
                  {
                    type: 'Control',
                    scope: '#/properties/webhookPublisherAuthorizationServer',
                  },
                ],
              },
              {
                type: 'HorizontalLayout',
                elements: [
                  {
                    type: 'Control',
                    scope: '#/properties/webhooks',
                    label: 'Salesforce entity',
                  },
                ],
              },
              {
                type: 'HorizontalLayout',
                elements: [
                  {
                    type: 'Control',
                    scope: '#/properties/actions',
                    label: 'Subscribe to events',
                  },
                ],
              },
            ],
          },
        ],
      });

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientId.description = `The OAuth Consumer Key from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientSecret.description = `The Consumer Secret from your ${SERVICE_NAME} Connected App`;

      ctx.body.schema.properties.webhookPublisherPrivateKey = {
        title: 'Private Key',
        type: 'string',
      };

      ctx.body.schema.properties.webhookPublisherClientId = {
        title: 'Client ID',
        type: 'string',
      };

      ctx.body.schema.properties.webhookPublisherUser = {
        title: 'Authorized user',
        type: 'string',
      };

      ctx.body.schema.properties.webhookPublisherAuthorizationServer = {
        title: 'Authorization server URL',
        type: 'string',
      };
    });

    const Joi = this.middleware.validate.joi;

    /**
     * Create a new Salesforce Webhook (Apex Trigger)
     */
    this.router.post(
      '/api/webhook',
      this.middleware.validate({
        body: Joi.object({
          entityId: Joi.string().required(),
          events: Joi.array()
            .items(
              Joi.string().valid(
                'before insert',
                'before update',
                'before delete',
                'after insert',
                'after update',
                'after delete',
                'after undelete'
              )
            )
            .min(1),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.createWebhook(ctx);
      }
    );

    /**
     * List created Webhooks schema
     */
    this.router.get(
      '/api/webhook',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.listWebhooksSchema(ctx);
      }
    );

    /**
     * List created Webhooks schema
     */
    this.router.get(
      '/api/webhook/configure',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.checkWebhookConfiguration(ctx);
      }
    );

    /**
     * Configure Webhooks for Salesforce development instance
     */
    this.router.post(
      '/api/webhook/configure',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.enableWebhooksForDevelopment(ctx);
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
