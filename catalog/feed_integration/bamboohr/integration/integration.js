const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'bamboohrConnector';

// Test Endpoint: Count the total number of employees.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://documentation.bamboohr.com/reference
  const bambooHRClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const { employees } = await bambooHRClient.get('employees/directory');
  ctx.body = `There are ${employees.length} employees in your BambooHR organization`;
});

// Endpoint for Sample App: Retrieve employee directory
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const bambooHRClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://documentation.bamboohr.com/reference/get-employees-directory-1
  const { employees } = await bambooHRClient.get('employees/directory');

  ctx.body = employees.map((employee) => ({
    displayName: employee.displayName,
    jobTitle: employee.jobTitle,
  }));
});

// Endpoint for Sample App: Add new employee to your BambooHR organization
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const bambooHRClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://documentation.bamboohr.com/reference/add-employee-1
  await bambooHRClient.post('employees', {
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'CTO',
  });

  ctx.body = 'Employee created';
});

module.exports = integration;
