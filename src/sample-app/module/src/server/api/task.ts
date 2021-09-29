import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

router.post('/', async (req, res, next) => {
  req.session.taskData = req.session.taskData || {};
  // Save task
  const task = req.body;
  const tasks = req.session.taskData[req.session.tenantData.currentTenantId] || [];
  tasks.push(task);
  req.session.taskData[req.session.tenantData.currentTenantId] = tasks;
  res.send(tasks);

  // Post to Integration
  const currentTenant = req.session.tenantData.tenants?.find(
    (tenant) => tenant.tenantId === req.session.tenantData.currentTenantId
  );
  if (currentTenant.integrationInstalled && currentTenant.integrationActivated) {
    try {
      fetch(`${res.locals.config.integrationUrl}/api/${currentTenant.tenantId}/postSlackMessage`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${res.locals.config.FUSEBIT_JWT}`,
        },
        body: JSON.stringify(task),
      });
    } catch (e) {
      console.log('Error posting message through integration', e);
    }
  }
});

router.get('/', async (req, res, next) => {
  const tasks = req.session.taskData[req.session.tenantData.currentTenantId] || [];
  res.send(tasks);
});

export default router;
