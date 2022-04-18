async function gitlabGetProjects(ctx) {
  // For the GitLab SDK documentation, see https://github.com/jdalrymple/gitbeaker
  const gitlabClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await gitlabClient.Projects.all({ membership: true });
}

const code = `
/**
 * Get list of Projects associated to the Tenant Account
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${gitlabGetProjects.toString()}
`;

module.exports = {
  name: 'Get list of Projects',
  description: 'Get list of Projects associated to the Tenant Account',
  code,
};
