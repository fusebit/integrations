import nock from 'nock';
import connector from '../libc';
import { commonConnectorTests, cfg, request } from '../../../../test';
import { Internal } from '../../../../src/framework/libc';
import { sampleConfig } from './sampleData';

commonConnectorTests(connector);

describe('Connector credentials', () => {
  test('Check handleWebhookEvent', async () => {
    const fakeAccessToken = 'ey...';

    const scope = nock(sampleConfig.configuration.tokenUrl)
      .get('', () => true)
      .reply(200, {
        access_token: fakeAccessToken,
      });

    const { Manager } = Internal;
    const manager = new Manager();
    manager.setup(
      {
        ...cfg,
        ...sampleConfig,
      },
      connector.router,
      undefined
    );

    const result = await manager.handle(request('GET', '/api/credentials'));
    expect(result.status).toBe(200);
    expect(result.body).toBeDefined();
    expect(result.body.accessToken).toBeDefined();
    expect(result.body.botClientId).toBe(sampleConfig.configuration.clientId);

    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
  });
});
