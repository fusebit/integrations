import { FusebitContext } from '../router';
import { IInstanceConnectorConfig } from '../ConnectorManager';

export abstract class WebhookClient<C = any> {
  abstract create: (...args: any[]) => Promise<any>;
  abstract get: (...args: any[]) => Promise<any>;
  abstract list: (...args: any[]) => Promise<any>;
  abstract delete: (...args: any[]) => Promise<any>;
  abstract deleteAll: (...args: any[]) => Promise<any>;

  constructor(ctx: FusebitContext, lookupKey: string, installId: string, config: IInstanceConnectorConfig, client: C) {
    this.ctx = ctx;
    this.client = client;
    this.config = config;
    this.lookupKey = lookupKey;
    this.installId = installId;
  }
  protected ctx: FusebitContext;
  protected lookupKey: string;
  protected installId: string;
  protected config: IInstanceConnectorConfig;
  protected client: C;
}
