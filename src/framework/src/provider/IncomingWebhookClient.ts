import { FusebitContext } from '../router';

export abstract class IncomingWebhookClient {
  protected ctx: FusebitContext;
  abstract send: (data?: any) => Promise<any>;

  constructor(ctx: FusebitContext) {
    this.ctx = ctx;
  }
}
