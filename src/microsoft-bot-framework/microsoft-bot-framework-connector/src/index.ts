import superagent from 'superagent';
import { Connector } from '@fusebit-int/framework';
import schema from './config/schema.json';
import uischema from './config/uischema.json';

import { Service } from './Service';

const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

class ServiceConnector extends Connector {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  public constructor() {
    super();

    this.router.use((ctx: Connector.Types.Context, next: Connector.Types.Next): ReturnType<Connector.Types.Next> => {
      const { config: cfg } = ctx.state.manager;
      cfg.configuration.constants = {
        urls: {
          production: {
            tokenUrl: TOKEN_URL,
          },
          webhookUrl: `${ctx.state.params.baseUrl}/api/fusebit_webhook_event`,
        },
      };

      // Make sure there is a sensible default value for tokenUrl, but still allow it to be
      // overwritten if necessary.
      if (cfg.configuration.mode?.useProduction) {
        cfg.configuration.tokenUrl = cfg.configuration.tokenUrl || cfg.configuration.constants.urls.production.tokenUrl;
      }

      return next();
    });

    this.router.get(
      '/api/configure',
      this.middleware.authorizeUser('connector:put'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        ctx.body = JSON.parse(
          JSON.stringify({
            data: {
              ...ctx.state.manager.config.configuration,
            },
            schema,
            uischema,
          })
        );
        return next();
      }
    );

    this.router.get(
      '/api/credentials',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        try {
          const botFrameworkAccessTokenResponse = await superagent
            .get(ctx.state.manager.config.configuration.tokenUrl)
            .type('form')
            .send({
              grant_type: 'client_credentials',
              client_id: ctx.state.manager.config.configuration.clientId,
              client_secret: ctx.state.manager.config.configuration.clientSecret,
              scope: ctx.state.manager.config.configuration.scope,
            });

          const botFrameworkAccessToken = botFrameworkAccessTokenResponse.body.access_token;

          ctx.body = {
            accessToken: botFrameworkAccessToken,
            botClientId: ctx.state.manager.config.configuration.clientId,
          };
        } catch (error) {
          if (error instanceof Error) {
            ctx.throw(500, error.message);
          }
          // TODO log this error object (or whatever that is at this point)
          ctx.throw(500);
        }
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
