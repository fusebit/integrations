import superagent from 'superagent';
import Connector from './Connector';

// Check the writableFinished flag to determine if the request has been sent down the wire.
const isRequestWritten = (request: superagent.Request): boolean =>
  (request as any).req?.writableFinished || (request as any).req?.destroyed || (request as any).req?.aborted;

// Every 5ms, check to see if superagent has finished writing the request down the wire, calling
// onWriteCompleted when done.
const waitForDrain = async (request: superagent.Request, onWriteCompleted: Function): Promise<void> => {
  while (!isRequestWritten(request)) {
    await new Promise((resolve) => setTimeout(() => resolve(null), 5));
  }
  return onWriteCompleted();
};

export type FanoutRequest = () => Promise<superagent.Response>;

/**
 * @ignore
 *
 * Utility function to help out with the fanout request, making sure it's dispatched down the wire before the
 * Lambda gets suspended.
 */
export const makeFanoutRequester = (
  ctx: Connector.Types.Context,
  webhookEventId: string,
  webhookEvents: Connector.Types.IWebhookEvents,
  writeCompleted: Function
) => {
  // Create the actual Superagent.request object
  const makeRequest = () => {
    const url = new URL(`${ctx.state.params.baseUrl}/fan_out/event/webhook`);
    url.searchParams.set('tag', webhookEventId);
    if (ctx.state.manager.config.defaultEventHandler) {
      url.searchParams.set('default', ctx.state.manager.config.defaultEventHandler);
    }

    // Errors caught by the Promise.all below, where the request is actually started.
    return superagent
      .post(url.toString())
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
      .send({ payload: webhookEvents })
      .ok(() => true);
  };

  // Wait for both the request to complete as well as, separately, polling the request for write completion.
  //
  // Superagent is odd, here, in that the request object doesn't actually start the request until either
  // await or .end() is called on it, which allows the object to be creaetd above but not risk an exception.
  return async (): Promise<superagent.Response> => {
    let request: superagent.Request | undefined;
    try {
      // Create the request object in superagent
      request = makeRequest();

      // Start the drain monitor
      waitForDrain(request, writeCompleted);

      // Guarantee that it's protected within a Promise.all() by enforcing the await here.
      return request;
    } catch (err) {
      if (request) {
        request.abort();
      }
      writeCompleted();
      throw err;
    }
  };
};
