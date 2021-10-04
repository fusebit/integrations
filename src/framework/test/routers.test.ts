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

      const handler = jest.fn(async (ctx: Internal.Types.CronContext, next: Internal.Types.Next) => {
        expect(ctx).toMatchObject({ url: config.schedule[0].endpoint });
        return next();
      });
      const handler2 = jest.fn(async (ctx: Internal.Types.CronContext, next: Internal.Types.Next) => {
        expect(ctx).toMatchObject({ url: config.schedule[0].endpoint });
        return next();
      });
      integration.cron.on(config.schedule[0].endpoint, handler, handler2);

      const manager = new Manager();
      manager.setup(config, integration.router);

      await manager.handle(request('CRON', 'placeholder'));
      expect(handler).toBeCalledTimes(1);
      expect(handler2).toBeCalledTimes(1);
    });

    test('Name-less registration matches all events', async () => {
      const integration = new Integration();

      const handler = jest.fn(async (ctx: Internal.Types.CronContext) => {
        expect(ctx).toMatchObject({ url: config.schedule[0].endpoint });
      });
      integration.cron.on(handler);

      const manager = new Manager();
      manager.setup(config, integration.router);

      await manager.handle(request('CRON', 'placeholder'));
      expect(handler).toBeCalledTimes(1);

      config.schedule[0].endpoint = '/something_else';
      await manager.handle(request('CRON', 'someotherplaceholder'));
      expect(handler).toBeCalledTimes(2);
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
