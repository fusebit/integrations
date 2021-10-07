/* tslint:disable no-namespace no-empty-interface max-classes-per-file */
import EntityBase from './EntityBase';
import superagent from 'superagent';

/**
 * @class
 * @alias connector.service
 * @augments EntityBase.ServiceBase
 */
class Service extends EntityBase.ServiceDefault {
  /**
   * Handles an event triggered by a connector Webhook
   * @param ctx The context object provided by the route function
   * @throws Will throw an error if webhooks are not implemented for the provided Connector.
   * @returns {Promise<void>}
   */
  public handleWebhookEvent = async (ctx: EntityBase.Types.Context) => {
    const isValid = this.validateWebhookEvent(ctx);

    if (!isValid) {
      ctx.throw(400, `Webhook event failed validation for connector ${ctx.state.params.entityId}`);
    }

    const isChallenge = this.initializationChallenge(ctx);
    if (isChallenge) {
      ctx.status = 200;
      return;
    }

    const eventsByAuthId = this.getEventsByAuthId(ctx);
    if (!eventsByAuthId) {
      ctx.throw(400, `Webhooks not implemented for connector ${ctx.state.params.entityId}`);
    }

    // Event contains many different authId-associated entries - process them independently.
    const processPromise = Promise.all(
      Object.entries(
        eventsByAuthId as Record<string, Connector.Types.IWebhookEvents>
      ).map(([authId, events]: [string, Connector.Types.IWebhookEvents]) => this.processWebhook(ctx, authId, events))
    );
    return this.createWebhookResponse(ctx, processPromise);
  };

  /**
   * Creates a new Webhook event
   * @param ctx The context object provided by the route function
   * @param {any} event
   * @param {string} webhookAuthId
   * @returns {Connector.Types.IWebhookEvent}
   */
  public createWebhookEvent = (
    ctx: Connector.Types.Context,
    event: any,
    webhookAuthId: string
  ): Connector.Types.IWebhookEvent => {
    const webhookEventId = this.getWebhookLookupId(ctx, webhookAuthId);
    const webhookEventType = this.getWebhookEventType(event);

    return {
      data: event,
      eventType: webhookEventType,
      entityId: ctx.state.params.entityId,
      webhookEventId,
      webhookAuthId,
    };
  };

  /**
   * Handles a Webhook event
   * @param ctx The context object provided by the route function
   * @param {string} webhookAuthId
   * @param {any[]} eventsData
   * @returns {Promise<superagent.Response | void>}
   */
  public processWebhook = async (
    ctx: Connector.Types.Context,
    webhookAuthId: string,
    eventsData: any[]
  ): Promise<superagent.Response | void> => {
    try {
      const events = eventsData.map((eventData) => this.createWebhookEvent(ctx, eventData, webhookAuthId));
      const webhookEventId = this.getWebhookLookupId(ctx, webhookAuthId);

      const url = new URL(`${ctx.state.params.baseUrl}/fan_out/event/webhook`);
      url.searchParams.set('tag', webhookEventId);
      if (ctx.state.manager.config.defaultEventHandler) {
        url.searchParams.set('default', ctx.state.manager.config.defaultEventHandler);
      }

      // This await is necessary to guarantee that exceptions generated by superagent (for
      // networking glitches, for example) never leave the scope of this function, as this code
      // often runs without an associated try/await/catch block.
      const response = await superagent
        .post(url.toString())
        .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
        .send({ payload: events })
        .ok((res) => true);
      return response;
    } catch (e) {
      console.log('Error processing event:');
      console.log(e);
    }
  };

  // Convert a webhook event into the key attached to installs by getWebhookTokenId
  public getWebhookLookupId(ctx: Connector.Types.Context, authId: string): string {
    const connectorId = ctx.state.params.entityId;
    return ['webhook', connectorId, authId].join('/');
  }

  // Convert an OAuth token into the key used to look up matching installs for a webhook.
  public getWebhookTokenId = async (ctx: Connector.Types.Context, token: any): Promise<string> => {
    const authId = await this.getTokenAuthId(ctx, token);
    const connectorId = ctx.state.params.entityId;
    return ['webhook', connectorId, authId].join('/');
  };

  // Setters allow for individual Connectors to easily apply unique values if need be
  public setGetEventsFromPayload = (handler: (ctx: Connector.Types.Context) => any[] | void) => {
    this.getEventsFromPayload = handler;
  };

  // Figure out which authentication id matches the supplied event, and thus which identity
  public setGetAuthIdFromEvent = (handler: (event: any) => string | void) => {
    this.getAuthIdFromEvent = handler;
  };

  // initializationChallenge returns true if the event is a security challenge by the remote service, and not
  // an actual event to be sent onwards to an integration.
  public setInitializationChallenge = (handler: (ctx: Connector.Types.Context) => boolean) => {
    this.initializationChallenge = handler;
  };

  // getTokenAuthId takes an authentication token and extracts out the authId, to match against future
  // events.
  public setGetTokenAuthId = (handler: (ctx: Connector.Types.Context, token: any) => Promise<string | void>): void => {
    this.getTokenAuthId = handler;
  };

  // createWebhookResponse sets any necessary response elements that the service expects in the webhook
  // response, while the webhook is being processed in the other promise.
  public setCreateWebhookResponse = (
    handler: (ctx: Connector.Types.Context, processPromise?: Promise<any>) => Promise<void>
  ) => {
    this.createWebhookResponse = handler;
  };

  // validateWebhookEvent validates the integrity of the event, usually via some cryptographic hash.
  public setValidateWebhookEvent = (handler: (ctx: Connector.Types.Context) => boolean) => {
    this.validateWebhookEvent = handler;
  };

  // getWebhookEventType returns a string that can becomes part of the event path, and is used to filter for
  // different webhooks in the integration.
  public setGetWebhookEventType = (handler: (event: any) => string) => {
    this.getWebhookEventType = handler;
  };

  // Default configuration functions
  private getEventsByAuthId = (ctx: Connector.Types.Context): Record<string, Connector.Types.IWebhookEvents> | void => {
    const events = this.getEventsFromPayload(ctx);
    if (!events) {
      ctx.throw(500, 'No Events found on payload.');
    }

    return events.reduce((acc, event) => {
      const authId = this.getAuthIdFromEvent(event);
      if (!authId) {
        ctx.throw(500, 'No AuthId present for event.');
      }
      (acc[authId] = acc[authId] || []).push(event);
      return acc;
    }, {});
  };

  private getEventsFromPayload = (ctx: Connector.Types.Context): any[] | void => {
    ctx.throw(500, 'Event location configuration missing. Required for webhook processing.');
  };

  private getAuthIdFromEvent = (event: any): string | void => {
    return;
  };

  private getTokenAuthId = async (ctx: Connector.Types.Context, token: any): Promise<string | void> => {
    // No throw here.  This is called in the auth flow and needs to continue regardless of success
  };

  private createWebhookResponse = async (
    ctx: Connector.Types.Context,
    processPromise?: Promise<any>
  ): Promise<void> => {
    // No special response generated by default
  };

  private validateWebhookEvent = (ctx: Connector.Types.Context): boolean => {
    ctx.throw(500, 'Webhook Validation configuration missing. Required for webhook processing.');
  };

  private getWebhookEventType = (event: any): string => {
    // No known event type
    return '';
  };

  private initializationChallenge = (ctx: Connector.Types.Context): boolean => {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  };
}

/**
 * @class Connector
 * @augments EntityBase
 * @ignore
 */
class Connector extends EntityBase {
  constructor() {
    super();
    this.router.post('/api/fusebit_webhook_event', async (ctx: Connector.Types.Context) => {
      await this.service.handleWebhookEvent(ctx);
    });
  }
  /**
   * @ignore
   */
  public service = new Service();
  /**
   * @ignore
   */
  public middleware = new EntityBase.MiddlewareDefault();
  /**
   * @ignore
   */
  public storage = new EntityBase.StorageDefault();
  /**
   * @ignore
   */
  public response = new EntityBase.ResponseDefault();
}
namespace Connector {
  export namespace Types {
    export type Router = EntityBase.Types.Router;
    export type Context = EntityBase.Types.Context;
    export type Next = EntityBase.Types.Next;
    export type Handler = (
      ctx: Connector.Types.Context,
      next: Connector.Types.Next
    ) => ReturnType<Connector.Types.Next>;
    export interface IOnStartup extends EntityBase.Types.IOnStartup {}
    export interface IWebhookEvent {
      data: any;
      eventType: string;
      entityId: string;
      webhookEventId: string;
      webhookAuthId: string;
    }
    export type IWebhookEvents = IWebhookEvent[];
  }
}
export default Connector;
