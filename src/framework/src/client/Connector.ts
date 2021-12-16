/* tslint:disable no-namespace no-empty-interface max-classes-per-file */
import EntityBase from './EntityBase';
import superagent from 'superagent';

import { makeFanoutRequester, FanoutRequest } from './FanoutRequest';

type FanoutResponse_ = PromiseSettledResult<superagent.Response>[];

/**
 * @ignore
 *
 * Utility function protecting against errors in assumptions around Promise execution sequencing.
 */
const writeSequencingBug = () => {
  throw new Error('Sequencing');
};

/**
 * @class
 * @alias connector.service
 * @augments EntityBase.ServiceBase
 */
export class Service extends EntityBase.ServiceDefault {
  /**
   * Handles an event triggered by a connector Webhook
   * @param ctx The context object provided by the route function
   * @throws Will throw an error if webhooks are not implemented for the provided Connector.
   * @returns {Promise<void>}
   */
  public async handleWebhookEvent(ctx: EntityBase.Types.Context) {
    const isValid = await this.validateWebhookEvent(ctx);

    if (!isValid) {
      ctx.throw(400, `Webhook event failed validation for connector ${ctx.state.params.entityId}`);
    }

    const isChallenge = await this.initializationChallenge(ctx);
    if (isChallenge) {
      return;
    }

    const eventsByAuthId = this.getEventsByAuthId(ctx);
    if (!eventsByAuthId) {
      ctx.throw(400, `Webhooks not implemented for connector ${ctx.state.params.entityId}`);
    }

    const responsePromises = await this.requestAll(ctx, eventsByAuthId);

    // Let the createWebhookResponse function decide if it wants to wait for fanout responses
    return this.createWebhookResponse(ctx, responsePromises.response);
  }

  // Perform each fanout request, blocking until all of the requests have been sent to prevent Lambda from
  // freezing the process prior to a successful dispatch.
  public async requestAll(
    ctx: Connector.Types.Context,
    eventsByAuthId: Record<string, Connector.Types.IWebhookEvents>
  ): Promise<{ response: Promise<FanoutResponse_> }> {
    const writePromises: Promise<void>[] = [];

    // Create a handler FanoutRequest object, tracking each outbound request.
    const fanoutRequests: FanoutRequest[] = Object.entries(eventsByAuthId).map(([authId, events]) => {
      const webhookEventId = this.getWebhookLookupId(ctx, authId);
      const webhookEvents = events.map((eventData) => this.createWebhookEvent(ctx, eventData, authId));

      // Create a Promise and save the resolve function for tracking that the request has been written
      let writeCompleted: () => void = writeSequencingBug;
      writePromises.push(new Promise<void>((resolve) => (writeCompleted = resolve)));

      return makeFanoutRequester(ctx, webhookEventId, webhookEvents, writeCompleted);
    });

    // Wrap all of the writePromises in a Promise.all() for safety before invoking the HTTP requests
    const requestPromise = Promise.all(writePromises);

    // Perform all of the HTTP requests, wrapping the calls in a Promise.all() for safety
    const responsePromise = Promise.allSettled(fanoutRequests.map((request) => request()));

    // Make sure all of the requests have been written, hopefully out the wire.
    await requestPromise;

    // Return the response promises in an object so that they don't get auto-resolved by the caller.
    return { response: responsePromise };
  }

  /**
   * Creates a new Webhook event from an opaque eventData
   *
   * @param ctx The context object provided by the route function
   * @param {any} eventData
   * @param {string} webhookAuthId
   * @returns {Connector.Types.IWebhookEvent}
   */
  public createWebhookEvent(
    ctx: Connector.Types.Context,
    eventData: any,
    webhookAuthId: string
  ): Connector.Types.IWebhookEvent {
    const webhookEventId = this.getWebhookLookupId(ctx, webhookAuthId);
    const webhookEventType = this.getWebhookEventType(eventData);

    return {
      data: eventData,
      eventType: webhookEventType,
      entityId: ctx.state.params.entityId,
      webhookEventId,
      webhookAuthId,
    };
  }

  // Convert a webhook event into the key attached to installs by getWebhookTokenId
  public getWebhookLookupId(ctx: Connector.Types.Context, authId: string): string {
    const connectorId = ctx.state.params.entityId;
    return ['webhook', connectorId, authId].join('/');
  }

  // Convert an OAuth token into the key used to look up matching installs for a webhook.
  public async getWebhookTokenId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const authId = await this.getTokenAuthId(ctx, token);
    if (authId) {
      const connectorId = ctx.state.params.entityId;
      if (Array.isArray(authId)) {
        return authId.map((authIdItem) => ['webhook', connectorId, authIdItem].join('/'));
      }
      return ['webhook', connectorId, authId].join('/');
    }
  }

  // Default configuration functions
  public getEventsByAuthId(ctx: Connector.Types.Context): Record<string, Connector.Types.IWebhookEvents> | void {
    const events = this.getEventsFromPayload(ctx);
    if (!events) {
      ctx.throw(500, 'No Events found on payload.');
    }

    return events.reduce((acc, event) => {
      const authId = this.getAuthIdFromEvent(ctx, event);
      if (!authId) {
        ctx.throw(500, 'No AuthId present for event.');
      }
      (acc[authId] = acc[authId] || []).push(event);
      return acc;
    }, {});
  }

  /**
   * Override: extract from a payload into an array of events to be processed later.
   */
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    ctx.throw(500, 'Event location configuration missing. Required for webhook processing.');
  }

  /**
   * Override: return the authentication id that can be used as a key for this particular event to group it
   * with other events belonging to that same authentication domain.
   */
  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return;
  }

  /**
   * Override: When supplied with an OAuth token, extract out the key that will be used for authentication
   * association in webhook events.
   */
  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    // No throw here.  This is called in the auth flow and needs to continue regardless of success
  }

  /**
   * Override: When a custom response is needed to send back to the webhook service, other than a 200 OK.
   */
  public async createWebhookResponse(
    ctx: Connector.Types.Context,
    processPromise?: Promise<FanoutResponse_>
  ): Promise<void> {
    const { immediateResponse } = ctx.state.manager.config.configuration;

    if (immediateResponse) {
      const params = ctx.state.params;
      const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
      const immediateResponseUrl = `${baseUrl}/integration/${immediateResponse}/api/fusebit/webhook/event/immediate-response`;

      const res = await superagent
        .post(immediateResponseUrl)
        .set('Authorization', `Bearer ${params.functionAccessToken}`);
      console.log('=-=-=-=-=-=-=-=');
      console.log(res.body);
      console.log('=-=-=-=-=-=-=-=');
    }
  }

  /**
   * Override: Cryptographically validate the contents of the request.
   */
  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    ctx.throw(500, 'Webhook Validation configuration missing. Required for webhook processing.');
  }

  /**
   * Override: Different webhooks may have different types, this gives us the ability to segment on different
   * types of webhooks so that the integration can attach to different events.
   */
  public getWebhookEventType(event: any): string {
    // No known event type
    return '';
  }

  /**
   * Override: Some webhooks have a special request that they send to test the validation checks of the
   * receiver.  Is this one of those requests?
   */
  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  }
}

/**
 * @class Connector
 * @augments EntityBase
 */
class Connector<S extends Connector.Service = Connector.Service> extends EntityBase {
  static Service = Service;

  constructor() {
    super();

    // `/api/fusebit_webhook_event` is legacy.  Should be maintained for backwards compatability until we can
    // determine that it is not in use by any customers.
    this.router.post(
      ['/api/fusebit/webhook/event', '/api/fusebit_webhook_event'],
      async (ctx: Connector.Types.Context) => {
        await this.service.handleWebhookEvent(ctx);
      }
    );

    this.router.post('/api/fusebit/webhook/event/immediate-response', async (ctx: Connector.Types.Context) => {
      ctx.body = {
        text: ':hourglass_flowing_sand: Running...',
      };
    });
  }

  protected createService(): S {
    return new Connector.Service() as S;
  }

  public service: S = this.createService();
  public middleware = new EntityBase.MiddlewareDefault();
  public storage = new EntityBase.StorageDefault();
  public response = new EntityBase.ResponseDefault();
}

type _Service = Service;

namespace Connector {
  export type Service = _Service;
  export namespace Types {
    export import Router = EntityBase.Types.Router;
    // export type Router = EntityBase.Types.Router;
    export import Context = EntityBase.Types.Context;
    export import Next = EntityBase.Types.Next;
    export type Handler = (
      ctx: Connector.Types.Context,
      next: Connector.Types.Next
    ) => ReturnType<Connector.Types.Next>;
    export type FanoutResponse = FanoutResponse_;
    export interface IOnStartup extends EntityBase.Types.IOnStartup {}
    export interface IWebhookEvent {
      data: any;
      eventType: string;
      entityId: string;
      webhookEventId: string;
      webhookAuthId: string;
    }
    export type IWebhookEvents = IWebhookEvent[];
    export type Response = EntityBase.ResponseDefault;
    export type Middleware = EntityBase.MiddlewareDefault;
    export type Storage = EntityBase.StorageDefault;
    export type Service = _Service;
    export type StorageBucketItem = EntityBase.Types.StorageBucketItem;
    export type StorageBucketItemParams = EntityBase.Types.StorageBucketItemParams;
  }
}
export default Connector;
