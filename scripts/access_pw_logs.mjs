#!/usr/bin/env zx

const help = () => {
  console.log(`
          Welcome to the CLI helper for accessing playwright logs.
          To use this, run:
          ./scripts/access_pw_logs.mjs <timestamp> <service-name> --profile <aws-profile>
          timestamp: the ISOString timestamp that is used as the key within s3, available through GOATv2.
          service-name: the service name, ie: pagerduty, githubapp, etc.
          --profile: the AWS profile to utilize to access the s3 bucket where logs are stored.
      `);
};

(async () => {
  if (argv._.length != 3) {
    return help();
  }
  const [_, timeStamp, serviceName] = argv._;
  const profile = argv.profile;

  const profileArgument = profile ? '--profile' + profile : '';
  await $`aws s3 sync s3://fusebit-playwright-output/${timeStamp}/${serviceName}/ logs/ ${profileArgument}`;
})();
