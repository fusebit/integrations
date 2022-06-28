import { Connector } from '@fusebit-int/framework';

import { AwsEngine } from './AwsEngine';
import * as ConfigurationUI from './configure';

class AwsConnector<S extends Connector.Types.Service = Connector.Service> extends Connector<S> {
  private createEngine(ctx: Connector.Types.Context) {
    return ctx.state.engine || new AwsEngine(ctx);
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
    this.router.get('/api/start', async (ctx: Connector.Types.Context) => {
      const sessionId = ctx.query.session;
    });

    // Collect the JSONForm response from /api/start
    // Store configuration within the session and start to generate the CFN
    // When everything is in place, redirect to a new page with a button to drop the user to the CFN
    // portal with instruction on how to connect everything
    this.router.post('/api/install', async (ctx: Connector.Types.Context) => {});

    // Triggered when the customer click finish after creating the CFN resources, start polling for-
    // the ability to assume role and retries for ~5 minutes before giving up
    // In the frontend, this will be a huge spinwheel...
    this.router.get('/api/verify', async (ctx: Connector.Types.Context) => {});
  }
}
