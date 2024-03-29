import superagent from 'superagent';
import { FusebitContext } from './router';
import { Service } from './client/Integration';
import { EntityType } from './schema';

interface IConnector {
  instantiate(lookupKey: string): any;
}

/**
 * IInstanceConnectorConfig
 *
 * Configuration for an associated connector, supplied as part of the overall configuration to the
 * ConnectorManager.
 */
interface IInstanceConnectorConfig {
  name: string;
  path: string;

  /** Name of the SDK-providing npm package for this connector. */
  provider: string;

  /** The remote entity ID for this connector. */
  entityId: string;
  entityType: string;

  /** A cached instance object of the initialized package object. */
  instance?: IConnector;
}

/** A collection of associated connectors and their lookup names. */
interface IInstanceConnectorConfigMap {
  [name: string]: IInstanceConnectorConfig;
}

/**
 * ConnectorManager
 *
 * The ConnectorManager is responsible for facilitating integrations' connections to connectors, and caching
 * allocated instances of the configured relationship to be used in retrieving credentials from the remote
 * connector for the service.
 */
class ConnectorManager {
  protected connectors: IInstanceConnectorConfigMap;
  constructor() {
    this.connectors = {};
  }

  /**
   * Set up the configuration manager with a collection of connector configurations.
   */
  public setup(cfg?: IInstanceConnectorConfig[]) {
    if (!cfg) {
      return;
    }

    cfg.forEach((connector: IInstanceConnectorConfig) => {
      if (connector.entityType === EntityType.connector) {
        this.connectors[connector.name] = connector;
      }
    });
  }

  /**
   * Get a list of all of the connectors configured for this integration.
   * @returns A list of of the friendly connector names
   */
  public getConnectorList(): string[] {
    return Object.keys(this.connectors);
  }

  /**
   * Create an manager for this connector, and cache it locally.
   *
   * @param name Connector name
   * @param cfg The configuration object used to initialize the managing provider package
   */
  public loadConnector(name: string, cfg: IInstanceConnectorConfig) {
    const Connector = require(cfg.provider).default;
    return (cfg.instance = new Connector({ ...cfg }));
  }

  /**
   * Get a specific instantiated webhook connector manager object by name.
   *
   * Returns a function that accepts a context object and returns an instantiated webhook connector, configured with
   * the appropriate variables pulled from the ctx.  The returned function can be cached and used across
   * multiple calls and endpoints.
   *
   * @param name Connector name
   * @param {string} installId The unique id of the tenant Install that should be used to determine the
   * appropriate connector identity to populate into the sdk.
   */
  public async getWebhookClientByName(ctx: FusebitContext, name: string, installId: string) {
    const cfg = this.connectors[name];
    if (!cfg) {
      throw new Error(
        `Unknown connector ${name}; add it to the configuration (known: ${JSON.stringify(
          Object.keys(this.connectors)
        )})?`
      );
    }
    const inst = cfg.instance ? cfg.instance : this.loadConnector(name, cfg);

    const service = new Service();
    const install = await service.getInstall(ctx, installId);

    const identity = install.data[name];
    if (!identity || !identity.entityId || identity.entityType !== EntityType.identity) {
      ctx.throw(404);
    }
    const client = await inst.instantiateWebhook(ctx, identity.entityId, installId);
    return client;
  }
  /**
   * Get a specific instantiated connector manager object by name.
   *
   * Returns a function that accepts a context object and returns an instantiated connector, configured with
   * the appropriate variables pulled from the ctx.  The returned function can be cached and used across
   * multiple calls and endpoints.
   *
   * @param name Connector name
   * @param {string} sessionOrInstallId The unique id of the tenant Install/Session that should be used to determine the
   * appropriate connector identity to populate into the sdk.
   */
  public async getByName(ctx: FusebitContext, name: string, sessionOrInstallId?: string): Promise<any> {
    const cfg = this.connectors[name];
    if (!cfg) {
      throw new Error(
        `Unknown connector ${name}; add it to the configuration (known: ${JSON.stringify(
          Object.keys(this.connectors)
        )})?`
      );
    }
    const inst = cfg.instance ? cfg.instance : this.loadConnector(name, cfg);

    const service = new Service();

    // The install/identity might be null for cases when connectors are not associated with
    // a particular tenant. For example, the Microsoft Bot Connector is a connector that
    // uses client credentials to communicate with the Saas (the Microsoft Bot Framework). Hence,
    // no install/id is needed to intantiate it.
    let install;
    let resourceId;
    if (sessionOrInstallId?.startsWith('ins-')) {
      install = await service.getInstall(ctx, sessionOrInstallId);
      resourceId = install.data[name];
    }

    if (sessionOrInstallId?.startsWith('sid-')) {
      // When someone passes a sessionId, this gets the connectors that this session is dependent on,
      // and get the sessionId of the connector session that was created before the session in which
      // this function is invoked. Which is passed down and make the provider able to get the token of the depended on connector.
      const dependencies = await superagent
        .get(`${ctx.state.params.baseUrl}/session/${sessionOrInstallId}`)
        .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
        .send();

      resourceId = { entityId: dependencies.body.dependsOn[name].entityId, entityType: EntityType.session };
    }

    if (
      sessionOrInstallId &&
      (!resourceId ||
        !resourceId.entityId ||
        (resourceId.entityType !== EntityType.identity && resourceId.entityType !== EntityType.session))
    ) {
      ctx.throw(404);
    }

    const client = await inst.instantiate(ctx, resourceId?.entityId);
    client.fusebit = client.fusebit || {};
    client.fusebit.identity = resourceId;
    return client;
  }

  public getByNames(ctx: FusebitContext, names: string[], installId: string): Record<string, any> {
    return names.reduce<Record<string, any>>((acc, cur) => {
      acc[cur] = this.getByName(ctx, cur, installId);
      return acc;
    }, {});
  }

  public getConnector(name: string): IInstanceConnectorConfig | undefined {
    return this.connectors[name];
  }

  // Only used by test routines.
  public clear() {
    this.connectors = {};
  }
}

export { ConnectorManager, IConnector, IInstanceConnectorConfig, IInstanceConnectorConfigMap };
