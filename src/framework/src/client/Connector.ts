/* tslint:disable no-namespace no-empty-interface max-classes-per-file */
import EntityBase from './EntityBase';
import superagent from 'superagent';

/**
 * @class
 * @alias connector.service
 * @augments EntityBase.ServiceBase
 */
type FanOutStatus = [void, superagent.Response] | void;

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

    const responsePromises = await this.requestAll(ctx, eventsByAuthId);

    return this.createWebhookResponse(ctx, responsePromises.response);
  };

  // Dispatch the events to processWebhook, pivoted by the authId specified for each webhook.
  //
  // Return a Promise indicating the headers and body have been sent to for all of the events, but not that
  // the remote side has finished processing.  The Promise resolves into an object that contains a Promise
  // which can be waited on to capture the responses for all of the events.
  //
  // This allows the caller to guarantee that the events have been dispatched out and promptly return to the
  // webhook whatever response is necessary, while retaining the option to wait for the completion of all of
  // the events (if there's no outstanding speed requirement, or that's not a concern) to process the
  // responses as needed in generating the result for the originating webhook response.
  //
  // This is somewhat awkward because the lambda framework will freeze computation randomly - but sometimes
  // immediately - after the lambda returns a response to an event.
  public requestAll = async (
    ctx: Connector.Types.Context,
    eventsByAuthId: Record<string, Connector.Types.IWebhookEvents>
  ): Promise<{ response: Promise<FanOutStatus[]> }> => {
    // Collect the Promises for each of the superagent requests.
    const responsePromises: Promise<FanOutStatus>[] = [];

    // For each request, generate a new Promise in requestWritePromises that processWebhook resolves when the request is
    // fully written.  Guarantee that all of the Promises are created prior to the subsequent await
    // Promise.all() via the setImmediate.
    const requestWritePromises = Object.entries(eventsByAuthId as Record<string, Connector.Types.IWebhookEvents>).map(
      ([authId, events]: [string, Connector.Types.IWebhookEvents]) =>
        new Promise((requestWriteResolve) =>
          // Defer, so that the requestWriteResolve are all inside the Promise.all before they get
          // executed.
          setImmediate(() => {
            // The function promise resolves when the response is completed.
            responsePromises.push(this.processWebhook(ctx, authId, events, requestWriteResolve));
          })
        )
    );

    // Wait for all of the writes to complete.
    await Promise.all(requestWritePromises);

    // Return the response promises in an object so that they don't get auto-resolved by the caller.
    return { response: Promise.all(responsePromises) };
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
    eventsData: any[],
    requestWriteFinished: () => void
  ): Promise<FanOutStatus> => {
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
      const request = superagent
        .post(url.toString())
        .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
        .send({ payload: events })
        .ok(() => true);

      return Promise.all([
        // Wait for the request to be finished writing out of the network stack before (in the calling stack)
        // returning back a status to the Webhook caller.
        new Promise<void>((localWriteFinished) => {
          const waitForDrain = (): void => {
            setTimeout(
              () =>
                ((request as unknown) as { req: { writableFinished: boolean } })?.req?.writableFinished
                  ? (requestWriteFinished(), localWriteFinished())
                  : waitForDrain(),
              5
            );
          };
          waitForDrain();
        }),

        // Wait on the request - this is necessary to trigger superagent to actually send the request.
        request,
      ]);
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
    handler: (ctx: Connector.Types.Context, processPromise?: Promise<FanOutStatus[]>) => Promise<void>
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
    processPromise?: Promise<FanOutStatus[]>
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
 */
class Connector extends EntityBase {
  constructor() {
    super();
    this.router.post('/api/fusebit_webhook_event', async (ctx: Connector.Types.Context) => {
      await this.service.handleWebhookEvent(ctx);
    });
  }
  public service = new Service();
  public middleware = new EntityBase.MiddlewareDefault();
  public storage = new EntityBase.StorageDefault();
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
