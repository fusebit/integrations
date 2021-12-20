async function asanaUpdateTask(ctx, taskGid, propertiesToUpdate) {
  // For the Asana SDK documentation, see https://github.com/Asana/node-asana
  const asanaClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  data = data || {};
  if (!data.workspace) {
    // Default to the first workspace of the logged in user
    const me = await asanaClient.users.me();
    data.workspace = me.workspaces[0].gid;
  }
  const task = await asanaClient.tasks.updateTask(taskGid, propertiesToUpdate, {
    headers: { 'Asana-Enable': 'new_user_task_lists' },
  });
  return task;
}

const code = `
/**
 * Create a new Asana task. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param taskGid {string} Task Id
 * @param propertiesToUpdate {object} Properties of the task to update
 * @returns {object} Updated task.
 */
${asanaUpdateTask.toString()}
`;

module.exports = {
  name: 'Update an existing task',
  description: 'Update an existing Asana task.',
  code,
};
