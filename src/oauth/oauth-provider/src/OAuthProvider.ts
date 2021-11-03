import { Internal } from '@fusebit-int/framework';

/*
 * An example class that pairs with the oauth-connector/OAuthConnector.  Many such classes may pair with
 * the OAuthConnector (for those that are fairly generic in their OAuth usage).  There's no expectation nor
 * need for them to derive from this particular instance.
 */
export default class OAuthProvider extends Internal.ProviderActivator<{ accessToken: string }> {
  /*
   * The ctx is needed so that the integration can hook out auth tokens from the request.
   *
   * Normally, this function would return an instantiated SDK object populated and enriched as appropriate.
   * For now, just return the accessToken for the caller to do with as they please.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<{ accessToken: string }> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    // Take the responding token, put it into the object below.
    return {
      accessToken: credentials.access_token,
    };
  }
}
