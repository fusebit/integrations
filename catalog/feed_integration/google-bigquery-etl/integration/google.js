const { BigQueryReadClient } = require('@google-cloud/bigquery-storage');

const getProjects = async (googleClient) =>
  (await googleClient.cloudresourcemanager('v1').projects.list()).data.projects;

const getBigQueryReadClient = async (googleClient, projectId) => {
  const { OAuth2Client } = require('google-auth-library');

  const oAuth2Client = new OAuth2Client();
  oAuth2Client.credentials = googleClient.fusebit.credentials;

  const client = new BigQueryReadClient({
    projectId,
    auth: {
      getClient: () => oAuth2Client,
    },
  });
  await client.initialize(); // Make sure the auth is working

  return client;
};

module.exports = {
  getProjects,
  getBigQueryReadClient,
};
