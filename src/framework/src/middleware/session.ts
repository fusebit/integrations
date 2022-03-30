import { v4 as uuidv4 } from 'uuid';
import superagent from 'superagent';

import { FusebitContext, Next } from '../router';
import { Internal } from '..';

export interface ISessionOptions {
  healthUrlPath: string;
  startUrlPath: string;
  getTenantId: (ctx: FusebitContext) => string;
  commitUrlPath: string;
  installUrlPath: string;
  getFinalRedirectUrl: (ctx: FusebitContext, installId: string, tenantId: string, targetUrl: string) => string;
}

interface IFusebitJwt {
  'https://fusebit.io/permissions': {
    allow: { action: string; resource: string }[];
  };
}

export const defaultSessionOptions: ISessionOptions = {
  healthUrlPath: '/api/health',
  startUrlPath: '/api/service/start',
  installUrlPath: '/api/service/tenant/:tenantId/install',
  getTenantId: () => uuidv4(),
  commitUrlPath: '/api/service/commit',
  getFinalRedirectUrl: (ctx: FusebitContext, installId: string, tenantId: string, targetUrl: string) =>
    `${ctx.state.params.baseUrl}/api/health?install=${installId}&tenant=${tenantId}`,
};

const start = (options: ISessionOptions) => async (ctx: FusebitContext) => {
  const tenantId = options.getTenantId(ctx);
  const baseUrl = ctx.state.params.baseUrl;
  const token = ctx.state.params.functionAccessToken;

  const response = await superagent
    .post(`${baseUrl}/session`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send({
      redirectUrl: `${baseUrl}${options.commitUrlPath}`,
      tags: {
        'fusebit.tenantId': tenantId,
      },
    });

  const sessionId = response.body.id;

  ctx.redirect(`${baseUrl}/session/${sessionId}/start`);
};

export const commit = (options: ISessionOptions) => async (ctx: FusebitContext) => {
  const baseUrl = ctx.state.params.baseUrl;
  const sessionId = ctx.query.session;
  const token = ctx.state.params.functionAccessToken;

  // Start the commit process
  let result = await superagent
    .post(`${baseUrl}/session/${sessionId}/commit`)
    .set('Authorization', `Bearer ${token}`)
    .send();

  const { targetUrl } = result.body;

  // Get the session while the commit is going to grab the tenant id; try multiple times in case there's a
  // race.
  do {
    result = await superagent.get(`${baseUrl}/session/${sessionId}/`).set('Authorization', `Bearer ${token}`);
  } while (!result.body.output);
  const tenantId = result.body.tags['fusebit.tenantId'];
  const installId = result.body.output.entityId;

  const finalUrl = options.getFinalRedirectUrl(ctx, installId, tenantId, targetUrl);
  ctx.redirect(finalUrl);
};

const health = () => async (ctx: FusebitContext, next: Next) => {
  const token = ctx.state.params.functionAccessToken;
  const sessionResource = `/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/${ctx.state.params.entityType}/${ctx.state.params.entityId}/session/`;
  const installResource = `/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/${ctx.state.params.entityType}/${ctx.state.params.entityId}/install/`;

  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8')) as IFusebitJwt;

  const allow = payload['https://fusebit.io/permissions'].allow;
  if (!allow.some((entry) => entry.action === 'session:add' && entry.resource === sessionResource)) {
    throw new Error("Missing 'session:add' permissions on the integration");
  }

  if (!allow.some((entry) => entry.action === 'session:commit' && entry.resource === sessionResource)) {
    throw new Error("Missing 'session:commit' permissions on the integration");
  }

  if (!allow.some((entry) => entry.action === 'install:get' && entry.resource === installResource)) {
    throw new Error("Missing 'install:get' permissions on the integration");
  }
  return next();
};

const getInstallByTenant = () => async (ctx: FusebitContext) => {
  const baseUrl = ctx.state.params.baseUrl;
  const token = ctx.state.params.functionAccessToken;
  const tenantId = ctx.params.tenantId;
  const result = await superagent
    .get(`${baseUrl}/install/?tag=fusebit.tenantId=${tenantId}`)
    .set('Authorization', `Bearer ${token}`);

  ctx.body = {
    installs: result.body.items,
  };
};

export const session = (router: Internal.Router, options: Partial<ISessionOptions> = defaultSessionOptions) => {
  const opts: ISessionOptions = { ...defaultSessionOptions, ...options };
  router.get(`${opts.startUrlPath}`, start(opts));
  router.get(`${opts.commitUrlPath}`, commit(opts));
  router.get(`${opts.healthUrlPath}`, health());
  router.get(`${opts.installUrlPath}`, getInstallByTenant());
};

// Share the handlers in case the caller wants to make use of them directly.
session.start = start;
session.commit = commit;
session.health = health;
session.defaults = defaultSessionOptions;
