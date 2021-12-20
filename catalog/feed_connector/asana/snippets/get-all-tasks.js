async function asanaGetAllTasks(ctx, includeDetails, workspace, assignee, otherProperties) {
  // For the Asana SDK documentation, see https://github.com/Asana/node-asana
  const asanaClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  if (!workspace || !assignee) {
    // Default to listing issues assigned to the logged in user in the their first workspace
    const me = await asanaClient.users.me();
    workspace = workspace || me.workspaces[0].gid;
    assignee = assignee || me.gid;
  }
  // Page through to collect all tasks
  let tasks = [];
  let response;
  do {
    response = await asanaClient.tasks.getTasks({
      assignee,
      workspace,
      offset: response && response._response && response._response.next_page && response._response.next_page.offset,
      ...otherProperties,
    });
    if (response.data && includeDetails) {
      for (let i = 0; i < response.data.length; i++) {
        response.data[i] = await asanaClient.tasks.getTask(response.data[i].gid, undefined, {
          headers: { 'Asana-Enable': 'new_user_task_lists' },
        });
      }
    }
    tasks = tasks.concat(response.data);
  } while (response && response._response && response._response.next_page);
  return tasks;
}

const code = `
/**
 * Get all Asana tasks matching the search criteria. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param includeDetails {boolean} If set to true, all tasks details are included in the response. 
 * @param workspace {string} [undefined] Optional workspace Id to search in. Defaults to the first workspace of the logged in user. 
 * @param assignee {string} [undefined] Optional assignee Id to return tasks for. Defaults to the logged in user. 
 * @param otherProperties {object} [undefined] Optional additional criteria for matching tasks.
 * @returns {Array} Array of all tasks matching the search criteria
 */
${asanaGetAllTasks.toString()}
`;

module.exports = {
  name: 'Get all tasks',
  description: 'Get all Asana tasks matching the search critera.',
  code,
};
