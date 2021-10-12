import superagent from 'superagent';
import Connector from './Connector';

// Check the writableFinished flag to determine if the request has been sent down the wire.
const isRequestWritten = (request: superagent.Request): boolean =>
  (request as any).req?.writableFinished ? true : false;

// Every 5ms, check to see if superagent has finished writing the request down the wire, calling
// onWriteCompleted when done.
const waitForDrain = (request: superagent.Request, onWriteCompleted: () => void): void => {
  setTimeout(() => (isRequestWritten(request) ? onWriteCompleted() : waitForDrain(request, onWriteCompleted)), 5);
};

/**
 * @ignore
 *
 * Utility class to help out with the fanout request, making sure it's dispatched down the wire before the
 * Lambda gets suspended.
 */
export class FanoutRequest {
  public constructor(
    private ctx: Connector.Types.Context,
    private webhookEventId: string,
    private webhookEvents: Connector.Types.IWebhookEvents,
    private writeCompleted: () => void
  ) {}

  // Create the actual Superagent.request object
  protected makeRequest = () => {
    const url = new URL(`${this.ctx.state.params.baseUrl}/fan_out/event/webhook`);
    url.searchParams.set('tag', this.webhookEventId);
    if (this.ctx.state.manager.config.defaultEventHandler) {
      url.searchParams.set('default', this.ctx.state.manager.config.defaultEventHandler);
    }

    // Errors caught by the Promise.all below, where the request is actually started.
    return superagent
      .post(url.toString())
      .set('Authorization', `Bearer ${this.ctx.state.params.functionAccessToken}`)
      .send({ payload: this.webhookEvents })
      .ok(() => true);
  };

  // Wait for both the request to complete as well as, separately, polling the request for write completion.
  //
  // Superagent is odd, here, in that the request object doesn't actually start the request until either
  // await or .end() is called on it, which allows the object to be creaetd above but not risk an exception.
  public request = async (): Promise<superagent.Response> => {
    // Create the request object in superagent
    const request = this.makeRequest();

    // Start the drain monitor
    waitForDrain(request, () => this.writeCompleted());

    // Guarantee that it's protected within a Promise.all() by enforcing the await here.
    return (await Promise.all([request]))[0];
  };
}
