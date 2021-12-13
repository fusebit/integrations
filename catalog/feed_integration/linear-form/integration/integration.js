// Fusebit Linear Integration
//
// This simple Linear integration allows you to call Linear APIs on behalf of the tenants of your
// application. Fusebit manages the Linear authorization process and maps tenants of your application
// to their Linear credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');
const schema = require('./schema.json');
const uiSchema = require('./uiSchema.json');
const integration = new Integration();
const client = require('@linear/sdk');

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;

const connectorName = 'linearConnector';

const getTenantInstalls = async (ctx, tenantId) => {
  const response = await superagent
    .get(`${ctx.state.params.baseUrl}/install?tag=fusebit.tenantId%3D${encodeURIComponent(tenantId)}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
  const body = response.body;
  if (body.items.length === 0) {
    ctx.throw(404, `Cannot find an Integration Install associated with tenant ${tenantId}`);
  }

  if (body.items.length > 1) {
    ctx.throw(400, `Too many Integration Installs found with tenant ${tenantId}`);
  }

  return body.items;
};

// The sample test endpoint of this integration gets all contacts stored in the Linear account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Linear client pre-configured with credentials necessary to communicate with your tenant's Linear account.
  // For the Linear SDK documentation, see https://developers.linear.app/docs/sdk/getting-started.
  const linearClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  // List all the Linear issues assigned to me.
  const install = await getTenantInstalls(ctx, ctx.params.tenantId);
  const teamName = install[0].data.form['team-name'];
  const teams = await linearClient.teams();
  let correctTeam;
  teams.nodes.forEach((team) => {
    if (team.name === teamName) {
      correctTeam = team;
    }
  });
  let issues = await correctTeam.issues();
  if (!issues.nodes.length) {
    ctx.body = {
      message: 'Your team have no issues!',
    };
    return;
  } else {
    ctx.body = {
      message: `Your team have ${issues.nodes.length} issues.`,
    };
    return;
  }
});

router.get('/api/form', async (ctx) => {
  let resp = await superagent
    .get(`${ctx.state.params.baseUrl}/session/${ctx.query.session}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
  const connectorUrl = ctx.state.params.baseUrl.split('/');
  connectorUrl.pop();
  connectorUrl.pop();
  connectorUrl.push('connector');
  connectorUrl.push(resp.body.dependsOn.linearConnector.parentEntityId);
  let resp2 = await superagent
    .get(`${connectorUrl.join('/')}/api/session/${resp.body.dependsOn.linearConnector.entityId}/token`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);

  const linearSdk = new client.LinearClient({ accessToken: resp2.body.access_token });
  const teams = await linearSdk.teams();
  let teamNames = [];
  teams.nodes.forEach((team) => teamNames.push(team.name));
  schema.properties['team-name'].enum = teamNames;
  const [form, contentType] = integration.response.createJsonForm({
    schema,
    uiSchema,
    dialogTitle: 'Choose Your Team',
    submitUrl: 'form/submitted',
    state: {
      session: ctx.query.session,
    },
  });
  ctx.body = form;
  ctx.header['Content-Type'] = contentType;
});

router.post('/api/form/submitted', async (ctx) => {
  const pl = JSON.parse(ctx.req.body.payload);
  await superagent
    .put(`${ctx.state.params.baseUrl}/session/${pl.state.session}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
    .send({ output: pl.payload });
  return ctx.redirect(`${ctx.state.params.baseUrl}/session/${pl.state.session}/callback`);
});

module.exports = integration;
