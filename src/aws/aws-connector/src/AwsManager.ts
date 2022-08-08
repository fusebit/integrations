import { Connector, Internal } from '@fusebit-int/framework';

import { AwsEngine } from './AwsEngine';
import * as ConfigurationUI from './configure';
import * as InstallUI from './install';
import { IAwsToken, ITags } from './AwsTypes';

class AwsConnector<S extends Connector.Types.Service = Connector.Service> extends Connector<S> {
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
      createTags: (token: IAwsToken) => {
        return {};
      },
      validateToken: (token: IAwsToken) => {
        return;
      },
    });
  }

  protected createIdentityClient(ctx: Connector.Types.Context) {
    const fnUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${fnUrl.protocol}//${fnUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;
    return new Internal.Provider.TokenIdentityClient<IAwsToken>({
      accessToken: ctx.state.params.functionAccessToken,
      baseUrl: `${baseUrl}/identity`,
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
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
        const engine: AwsEngine = this.createEngine(ctx);
        ctx.body = JSON.parse(
          JSON.stringify({
            data: engine.configToJsonForms(),
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
      ctx.state.tokenClient = this.createSessionClient(ctx);

      [ctx.body, ctx.headers['Content-Type']] = Internal.Form({
        schema: InstallUI.schema,
        uiSchema: InstallUI.uiSchema,
        state: {
          sessionId,
        },
        dialogTitle: 'AWS information',
        submitUrl: 'authorize/cb',
        windowTitle: 'AWS information',
        // Not sure what the proper cancel url would be here
        cancelUrl: '/cancel',
        data: {},
      });
    });

    // Collect the JSONForm response from /api/start
    // Store configuration within the session and start to generate the CFN
    // When everything is in place, redirect to a new page with a button to drop the user to the CFN
    // portal with instruction on how to connect everything
    this.router.post('/api/authorize/cb', async (ctx: Connector.Types.Context) => {
      const pl = JSON.parse(ctx.req.body.payload);
      const configuration = pl.payload;
      const { sessionId } = pl.state;
      ctx.state.sessionId = sessionId;
      ctx.state.tokenClient = this.createSessionClient(ctx);
      // Check a sessionId and proper configuration is provided
      if (!ctx.state.sessionId) {
        ctx.throw(403);
      }

      if (!configuration || !configuration.accountId) {
        ctx.throw(400);
      }

      const engine: AwsEngine = ctx.state.engine;
      ctx.body = await engine.handleFirstInstallStep(ctx);
      ctx.type = 'html';
    });

    this.router.get('/api/authorize/finalize', async (ctx: Connector.Types.Context) => {
      ctx.state.tokenClient = this.createSessionClient(ctx);
      const engine: AwsEngine = ctx.state.engine;
      await engine.CleanupS3(ctx.query.sessionId);
      ctx.redirect(engine.getFinalCallbackUrl(ctx));
    });

    this.router.get('/api/session/:lookupKey/health', async (ctx: Connector.Types.Context) => {
      ctx.state.tokenClient = this.createSessionClient(ctx);
      const lookupKey = ctx.params.lookupKey;
      const engine: AwsEngine = ctx.state.engine;
      await engine.ensureCrossAccountAccess(ctx, lookupKey);
    });

    this.router.get(
      '/api/:lookupKey/token',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        const awsEngine: AwsEngine = ctx.state.engine;
        ctx.body = await awsEngine.ensureCrossAccountAccess(ctx, ctx.params.lookupKey);
        if (!ctx.body) {
          ctx.throw(404);
        }
        return next();
      }
    );

    this.router.get(
      '/api/:lookupKey/health',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        const engine: AwsEngine = ctx.state.engine;
        const response = await engine.ensureCrossAccountAccess(ctx, ctx.params.lookupKey);
        if (!response) {
          ctx.throw(404);
        }

        return next();
      }
    );
  }
}

const connector = new AwsConnector();
export default connector;
export { AwsConnector };
