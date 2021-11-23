jest.mock('botbuilder');

import { WebRequest, WebResponse } from 'botbuilder';
import MicrosoftBotProvider from '../src/MicrosoftBotProvider';

class MockedMicrosoftBotProvider extends MicrosoftBotProvider {
  constructor() {
    const doesntReallyMatter = {} as any;
    super(doesntReallyMatter);
  }

  protected requestConnectorCredentials() {
    return Promise.resolve({
      botClientId: 'random-client-id',
      accessToken: 'random-access-token',
    });
  }
}

describe('Microsoft Bot Provider', () => {
  // This test is making sure that the original adapter provided by the Microsoft Bot Framework
  // SDK is getting a request body without the Fusebit properties we inject during the
  // function-api/connector/integration dance. Also, it makes sure that the rest of the code calling
  // this adapter (i.e., the integration code written by Daisy) does get a request body with the
  // Fusebit properties. Check the comments on the MicrosoftBotProvider class for more information.
  test('Check req.body', async () => {
    const provider = new MockedMicrosoftBotProvider();
    const alsoDoesntMatter = {} as any;
    const client = await provider.instantiate(alsoDoesntMatter);

    const req = {
      body: {
        data: {
          message: 'hi bot',
        },
        eventType: 'message',
        entityId: 'ms-bot',
        webhookEventId: 'webhook/ms-bot/28:16a42606-f57e-444e-9a97-3d703d05f436',
        webhookAuthId: '28:16a42606-f57e-444e-9a97-3d703d05f436',
        installIds: ['ins-00000000000000000000000000000000'],
      },
    } as WebRequest;

    const mockedClient = client as any;
    mockedClient.setProcessActivityExpectedBody(req.body.data);

    const res = {} as WebResponse;
    await client.processActivity(req, res, (): Promise<any> => {
      expect(req.body).toBe(req.body);
      expect(req.body.data).toBeDefined();
      expect(req.body.webhookEventId).toBeDefined();
      return Promise.resolve(true);
    });

    expect(req.body).toBe(req.body);
    expect(req.body.data).toBeDefined();
    expect(req.body.webhookEventId).toBeDefined();
  });
});
