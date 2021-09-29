import { Integration, Internal } from '../src';

import { request, getIntegrationConfig } from './utilities';

const { Manager } = Internal;

const config = {
  ...getIntegrationConfig(),
  schedule: [{ endpoint: '/some_cron_endpoint', cron: '*', timezone: 'Asia/Tokyo' }],
};

describe('Routers', () => {
  describe('Event Routing', () => {
    test('Event router routes events', async () => {
      const integration = new Integration();

      // XXX Why is this Internal.Types instead of Integration.Types? Integration.Types complains about using a
      // type like a namespace...
      const handler = jest.fn(async (ctx: Internal.Types.EventContext) => {
        expect(ctx).toMatchObject({ originalUrl: 'some_event' });
      });
      integration.event.on('some_event', handler);

      const manager = new Manager();
      manager.setup(config, integration.router);

      await manager.handle(request('EVENT', 'some_event'));
      expect(handler).toBeCalledTimes(1);
    });
  });

  describe('Cron Routing', () => {
    test('Cron router routes crons', async () => {
      const integration = new Integration();

      const handler = jest.fn(async (ctx: Internal.Types.CronContext) => {
        expect(ctx).toMatchObject({ url: config.schedule[0].endpoint });
      });
      integration.cron.on(config.schedule[0].endpoint, handler);

      const manager = new Manager();
      manager.setup(config, integration.router);

      await manager.handle(request('CRON', 'placeholder'));
      expect(handler).toBeCalledTimes(1);
    });

    test('Non-matching cron entries do not get called', async () => {
      const integration = new Integration();

      const handler = jest.fn(async (ctx: Internal.Types.CronContext) => {
        expect(ctx).toMatchObject({ url: config.schedule[0].endpoint });
      });
      integration.cron.on('/non_matching_endpoint', handler);

      const manager = new Manager();
      manager.setup(config, integration.router);

      await manager.handle(request('CRON', 'placeholder'));
      expect(handler).not.toBeCalled();
    });
  });
});
