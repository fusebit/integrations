async function githubappGetAllIssues(ctx, ownerOrOrg, repo, otherProperties) {
  const githubapp = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // Ensure you have configured your GitHub Connector properly in order to authenticate as a GitHub Application.
  // Setup properly the Client Secret and App ID from your GitHub app in your Connector configuration.
  // See our developer docs for more information https://developer.fusebit.io/docs/github
  const appClient = await githubapp.app();
  const { data: installations } = await appClient.rest.apps.listInstallations();

  if (!installations.length) {
    ctx.throw(404, 'This application has no installations');
  }

  const installation = installations.find((installation) => installation.account.login === ctx.params.owner);

  if (!installation) {
    ctx.throw(404, `Installation not found for account ${ctx.params.owner}`);
  }

  // Now you have your installation, you can request an access token to the specific installation
  // We perform all that work for you and you get back an authenticated SDK as a GitHub installation.
  const installationClient = await appClient.installation(installation.id);

  const orgLevel = typeof repo !== 'string';
  otherProperties = orgLevel
    ? {
        per_page: 100,
        org: ownerOrOrg,
        ...repo,
      }
    : {
        per_page: 100,
        owner: ownerOrOrg,
        repo,
        ...otherProperties,
      };

  const iterator = installationClient.paginate.iterator(
    orgLevel ? installationClient.rest.issues.listForOrg : installationClient.rest.issues.listForRepo,
    otherProperties
  );

  const issuesList = [];
  for await (const { data: issues } of iterator) {
    for (const issue of issues) {
      issuesList.push(issue);
    }
  }

  return issuesList;
}

const code = `
/**
 * Get all Github issues matching the search criteria. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param ownerOrOrg {string} Repository owner or organization name
 * @param repo {string} [undefined] Optional Repository name. 
 * @param otherProperties {object} [undefined] Optional additional criteria for matching issues. 
 * @returns {Array} Array of all issues matching the search criteria
 */
${githubappGetAllIssues.toString()}
`;

module.exports = {
  name: 'Get all Github issues',
  description: 'Get all Github issues matching the search criteria.',
  code,
};
