import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const AUTHORIZATION_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SERVICE_NAME = 'Salesforce';
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';
const WEBHOOK_CONFIGURATION_SECTION = 'Salesforce Webhooks Configuration';

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

    // Configure Salesforce Webhooks after the authorization callback redirect.
    this.router.get('/api/callback', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      await next();
      await this.service.configure(ctx, ctx.state.tokenInfo);
    });

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;

      ctx.body.schema.properties.webhookSchema = {
        type: 'object',
        properties: {
          webhooks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entityId: {
                  type: 'string',
                  enum: [
                    'Account',
                    'Campaign',
                    'Contact',
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
                },
                actions: {
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
                },
              },
            },
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
                    scope: '#/properties/webhookSchema',
                    label: 'Subscribe to events',
                  },
                ],
              },
            ],
          },
        ],
      });

      // Configuration screen settings
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'configurationScreenBgColorFrom');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'configurationScreenBgColorTo');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'configurationScreenWaitText');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientId.description = `The OAuth Consumer Key from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientSecret.description = `The Consumer Secret from your ${SERVICE_NAME} Connected App`;

      ctx.body.schema.properties.configurationScreenBgColorFrom = {
        title: 'Background configuration screen start color',
        type: 'string',
      };
      ctx.body.schema.properties.configurationScreenBgColorTo = {
        title: 'Background configuration screen end color',
        type: 'string',
      };
      ctx.body.schema.properties.configurationScreenWaitText = {
        title: 'Background configuration screen wait text',
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
