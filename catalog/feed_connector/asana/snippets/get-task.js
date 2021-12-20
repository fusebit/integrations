async function asanaGetTask(ctx, taskGid, fields) {
  // For the Asana SDK documentation, see https://github.com/Asana/node-asana
  const asanaClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  const task = await asanaClient.tasks.getTask(taskGid, fields && { optFields: fields }, {
    headers: { 'Asana-Enable': 'new_user_task_lists' },
  });
  return task;
}

const code = `
/**
 * Get Asana task details. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param taskGid {string} Task Id. 
 * @param fields {Array} [undefined] Optional list of fields to return.
 * @returns {object} Asana task.
 */
${asanaGetTask.toString()}
`;

module.exports = {
  name: 'Get task details',
  description: 'Get Asana task details.',
  code,
};
