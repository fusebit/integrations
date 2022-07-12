import { Connector, Internal } from '@fusebit-int/framework';

import { AwsEngine } from './AwsEngine';
import * as ConfigurationUI from './configure';
import * as InstallUI from './install';
import { IAwsToken, ITags } from './AwsTypes';

export default class AwsConnector<S extends Connector.Types.Service = Connector.Service> extends Connector<S> {
  private createEngine(ctx: Connector.Types.Context) {
    return ctx.state.engine || new AwsEngine(ctx);
  }

  protected createSessionClient(ctx: Connector.Types.Context) {
    const fnUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${fnUrl.protocol}//${fnUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;
    return new Internal.Provider.TokenSessionClient<IAwsToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: async (token: IAwsToken): Promise<ITags | undefined> => {
        return {};
      },
      validateToken: async (token: IAwsToken) => {
        return;
      },
    });
  }

  constructor() {
    super();

    // Add the AwsEngine into context
    this.router.use(async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      ctx.state.engine = this.createEngine(ctx);
      return next();
    });

    // For connector configuration UI
    this.router.get(
      '/api/configure',
      this.middleware.authorizeUser('connector:put'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        ctx.body = JSON.parse(
          JSON.stringify({
            data: {
              ...ctx.state.manager.config.configuration,
            },
            schema: ConfigurationUI.schema,
            uiSchema: ConfigurationUI.uiSchema,
          })
        );

        return next();
      }
    );

    // Daisy's customer configuration flow
    // Start the auth flow, render the initial page
    this.router.get('/api/authorize', async (ctx: Connector.Types.Context) => {
      const sessionId = ctx.query.session;

      ctx.body = JSON.parse(
        JSON.stringify({
          schema: InstallUI.schema,
          uiSchema: InstallUI.uiSchema,
          data: {
            sessionId,
          },
        })
      );
    });

    // Collect the JSONForm response from /api/start
    // Store configuration within the session and start to generate the CFN
    // When everything is in place, redirect to a new page with a button to drop the user to the CFN
    // portal with instruction on how to connect everything
    this.router.post('/api/install', async (ctx: Connector.Types.Context) => {
      const { sessionId, ...configuration } = ctx.req.body;
      // Check a sessionId and proper configuration is provided
      if (!sessionId) {
        ctx.throw(403);
      }

      if (!configuration || !configuration.accountId) {
        ctx.throw(400);
      }

      const engine: AwsEngine = ctx.state.engine;
      
    });

    // Triggered when the customer click finish after creating the CFN resources, start polling for-
    // the ability to assume role and retries for ~5 minutes before giving up
    // In the frontend, this will be a huge spinwheel...
    this.router.get('/api/verify', async (ctx: Connector.Types.Context) => {});
  }
}
