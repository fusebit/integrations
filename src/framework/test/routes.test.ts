import { Internal } from '../src';
const { Manager, Router } = Internal;

const request = (method: string, path: string, headers?: any, query?: any, body?: any) => {
  return { headers, method, path, query, body };
};

const cfg = {
  handler: 'foo',
  configuration: {},
  defaultEventHandler: '',
  mountUrl: '',
  schedule: [],
};

const newManager = (router: Internal.Router) => {
  const manager = new Manager();
  manager.setup(cfg, router, undefined);

  return manager;
};

describe('Routes', () => {
  it('do routes work', async () => {
    const router = new Router();
    router.get('/hello/:username', async (ctx: Internal.Types.Context) => {
      ctx.body = `hello${ctx.params.username}`;
    });

    const manager = newManager(router);

    const result = await manager.handle(request('GET', '/hello/user'));

    expect(result.body).toBe('hellouser');
    expect(result.status).toBe(200);
  });

  it('unknown requests return 404', async () => {
    const router = new Router();
    const manager = newManager(router);

    const result = await manager.handle(request('GET', '/notfound'));

    expect(result.status).toBe(404);
  });

  it('post accesses parameters in ctx.request.body', async () => {
    const router = new Router();
    router.post('/hello/', async (ctx: Internal.Types.Context) => {
      ctx.body = `hello ${ctx.req.body.username}`;
    });

    const manager = newManager(router);

    const result = await manager.handle(request('POST', '/hello/', undefined, undefined, { username: 'world' }));

    expect(result.body).toBe('hello world');
    expect(result.status).toBe(200);
  });

  it('path with trailing slash does not match route', async () => {
    const router = new Router();
    router.get('/hello/', async (ctx: Internal.Types.Context) => {
      ctx.body = 'hello';
    });

    const manager = newManager(router);

    const result = await manager.handle(request('GET', '/hello'));

    expect(result.body).toEqual({ message: 'Not Found', status: 404 });
    expect(result.status).toBe(404);
  });

  it('path without trailing slash still matches route', async () => {
    const router = new Router();
    router.get('/hello', async (ctx: Internal.Types.Context) => {
      ctx.body = 'hello';
    });

    const manager = newManager(router);

    const result = await manager.handle(request('GET', '/hello/'));

    expect(result.body).toBe('hello');
    expect(result.status).toBe(200);
  });

  it('demonstrate a query string', async () => {
    const router = new Router();
    router.get('/hello', async (ctx: Internal.Types.Context) => {
      ctx.body = `hello ${ctx.query.qp}`;
    });

    const manager = newManager(router);

    const result = await manager.handle(request('GET', '/hello/', undefined, { qp: 'value' }));

    expect(result.body).toBe('hello value');
    expect(result.status).toBe(200);
  });

  it('demonstrate accessing headers', async () => {
    const router = new Router();
    router.get('/hello', async (ctx: Internal.Types.Context) => {
      expect(ctx.headers.qp).toBe('value');
      ctx.body = `hello ${ctx.headers.qp}`;
    });

    const manager = newManager(router);

    const result = await manager.handle(request('GET', '/hello/', { qp: 'value' }));

    expect(result.body).toBe('hello value');
    expect(result.status).toBe(200);
  });

  it('demonstrate middleware', async () => {
    const router = new Router();
    router.get(
      '/hello',
      async (ctx: Internal.Types.Context, next: Internal.Types.Next) => {
        ctx.state.n = 1;
        await next();
        ctx.body = ctx.body.toUpperCase();
      },
      async (ctx: Internal.Types.Context) => {
        ctx.body = `hello ${ctx.state.n}`;
      }
    );

    const manager = newManager(router);

    const result = await manager.handle(request('GET', '/hello/', { qp: 'value' }));

    expect(result.body).toBe('HELLO 1');
    expect(result.status).toBe(200);
  });

  it('Default route healthcheck returns success', async () => {});
  it('Default route healthcheck returns failure', async () => {});
});
