async function asanaCreateTask(ctx, name, notes, otherProperties) {
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
  const task = await asanaClient.tasks.createTask(
    { name, notes, ...otherProperties },
    { headers: { 'Asana-Enable': 'new_user_task_lists' } }
  );
  return task;
}

const code = `
/**
 * Create a new Asana task. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param name {string} Task name
 * @param notes {string} Task notes
 * @param otherProperties {object} [undefined] Optinal additional properties of the task, including "workspace".
 * @returns {object} Newly created task.
 */
${asanaCreateTask.toString()}
`;

module.exports = {
  name: 'Create a new task',
  description: 'Create a new Asana task.',
  code,
};
