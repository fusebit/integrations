async function asanaDeleteTask(ctx, taskGid, workspace) {
  // For the Asana SDK documentation, see https://github.com/Asana/node-asana
  const asanaClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  if (!workspace) {
    // Default to the first workspace of the logged in user
    const me = await asanaClient.users.me();
    workspace = me.workspaces[0].gid;
  }
  await asanaClient.tasks.deleteTask(taskGid, { workspace });
}

const code = `
/**
 * Delete an existing Asana task. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param taskGid {string} Task Id. 
 * @param workspace {steing} [undefined] Optional workspace Id. Defaults to first workspace of authorized user if not specified. 
 */
${asanaDeleteTask.toString()}
`;

module.exports = {
  name: 'Delete task',
  description: 'Delete an existing Asana task.',
  code,
};
