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
class Service extends EntityBase.ServiceDefault {
  /**
   * Handles an event triggered by a connector Webhook
   * @param ctx The context object provided by the route function
   * @throws Will throw an error if webhooks are not implemented for the provided Connector.
   * @returns {Promise<void>}
   */
  public async handleWebhookEvent(ctx: EntityBase.Types.Context) {
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
  public async getWebhookTokenId(ctx: Connector.Types.Context, token: any): Promise<string> {
    const authId = await this.getTokenAuthId(ctx, token);
    const connectorId = ctx.state.params.entityId;
    return ['webhook', connectorId, authId].join('/');
  }

  // Default configuration functions
  protected getEventsByAuthId(ctx: Connector.Types.Context): Record<string, Connector.Types.IWebhookEvents> | void {
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
  }

  protected getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    ctx.throw(500, 'Event location configuration missing. Required for webhook processing.');
  }

  protected getAuthIdFromEvent(event: any): string | void {
    return;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    // No throw here.  This is called in the auth flow and needs to continue regardless of success
  }

  protected async createWebhookResponse(
    ctx: Connector.Types.Context,
    processPromise?: Promise<FanoutResponse_>
  ): Promise<void> {
    // No special response generated by default
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context): boolean {
    ctx.throw(500, 'Webhook Validation configuration missing. Required for webhook processing.');
  }

  protected getWebhookEventType(event: any): string {
    // No known event type
    return '';
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  }
}

/**
 * @class Connector
 * @augments EntityBase
 */
class Connector extends EntityBase {
  protected createService() {
    return new Connector.Service();
  }

  constructor() {
    super();
    this.service = this.createService();

    this.router.post('/api/fusebit_webhook_event', async (ctx: Connector.Types.Context) => {
      await this.service.handleWebhookEvent(ctx);
    });
  }
  static Service = Service;
  public service: Service;
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
  }
}
export default Connector;
