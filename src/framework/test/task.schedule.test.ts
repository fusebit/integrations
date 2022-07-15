import nock from 'nock';
import { Constants, getContext } from './utilities';
import { Integration } from '../src';

const { endpoint } = Constants;

nock(endpoint, {
  reqheaders: {
    Authorization: () => true,
    'User-Agent': 'fusebit/v2-sdk',
  },
})
  .post('/api/task')
  .reply(202, { location: 'b' });

describe('Task Scheduling', () => {
  test('Task Scheduling invokes the right endpoint', async () => {
    const integration = new Integration();
    const ctx = getContext();

    const location = await integration.service.scheduleTask(ctx, { path: '/api/task' });
    expect(location).toEqual('b');
  });
});
