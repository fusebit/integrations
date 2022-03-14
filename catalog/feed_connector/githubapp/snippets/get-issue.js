async function githubappGetIssue(ctx, owner, repo, issueNumber) {
  const githubapp = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // Ensure you have configured your GitHub Connector properly in order to authenticate as a GitHub Application.
  // Setup properly the Client Secret and App ID from your GitHub app in your Connector configuration.
  // See our developer docs for more information https://developer.fusebit.io/docs/githubapp
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

  const { data } = await installationClient.rest.issues.get({ owner, repo, issue_number: issueNumber });
  return data;
}

const code = `
/**
 * Get Github issue details. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param owner {string} Repository owner. 
 * @param repo {string} Repository name.
 * @param issueNumber {number} Issue number.
 * @returns {object} Github issue.
 */
${githubappGetIssue.toString()}
`;

module.exports = {
  name: 'Get issue details',
  description: 'Get Github issue details.',
  code,
};
