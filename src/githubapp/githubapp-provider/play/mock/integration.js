const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = 'githubapp';
const OWNER = '##OWNER##';
const REPOSITORY = '##REPOSITORY##';
const storageKey = '/test/githubapp/webhook/##STORAGE_KEY##';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const userClient = sdk.user();
  const { data } = await userClient.rest.users.getAuthenticated();
  ctx.body = data;
});

// List repository issues
router.get('/api/issues/:installId', async (ctx) => {
  const githubapp = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const userClient = githubapp.user();
  const iterator = userClient.paginate.iterator(userClient.rest.issues.listForRepo, {
    owner: OWNER,
    repo: REPOSITORY,
    per_page: 100,
  });
  // iterate through each response
  const issuesList = [];
  for await (const { data: issues } of iterator) {
    for (const issue of issues) {
      issuesList.push(issue);
    }
  }
  ctx.body = issuesList;
});

// Create a new GitHub issue
router.post('/api/issues/:installId', async (ctx) => {
  const githubapp = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const userClient = githubapp.user();
  const { data } = await userClient.rest.issues.create({
    owner: OWNER,
    repo: REPOSITORY,
    title: 'Hello world from Fusebit',
  });
  ctx.body = data;
});

router.put('/api/issues/:installId/:issueNumber', async (ctx) => {
  const githubapp = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const userClient = githubapp.user();
  const { data } = await userClient.rest.issues.update({
    owner: OWNER,
    repo: REPOSITORY,
    issue_number: ctx.params.issueNumber,
    title: ctx.req.body.title,
  });
  ctx.body = data;
});

// Endpoint used to check a storage item is properly saved.
router.get('/api/storage', async (ctx) => {
  ctx.body = await integration.storage.getData(ctx, storageKey);
});

// Listen all issues related webhooks
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  // Save something in storage to look up later on.
  await integration.storage.setData(ctx, storageKey, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
