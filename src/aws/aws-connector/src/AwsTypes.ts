interface IAwsConfig {
  sessionName: string;
  bucketName: string;
  bucketPrefix: string;
  stackName: string;
  IAM: {
    accessKeyId: string;
    secretAccessKey: string;
    otpSecret: string;
  };
  customTemplate: {
    cfnObject?: string;
    roleName?: string;
  };
  configPage: {
    windowTitle: string;
  };
}

interface IAwsToken {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: string;
  OTPSecret?: string;
}

interface ITags extends Record<string, string | null> {}

interface IAssumeRoleConfiguration {
  accountId: string;
  externalId: string;
  roleArn: string;
  cachedCredentials?: IAwsToken;
}

export { IAwsConfig, IAwsToken, IAssumeRoleConfiguration, ITags };
