interface IAwsConfig {
  mode: {
    useProduction: boolean;
  };
  bucketName: string;
  bucketPrefix: string;
  stackName: string;
  IAM: {
    accessKeyId: string;
    secretAccessKey: string;
    otpSecret: string;
    mfaSerial: string;
    region: string;
    timeout?: string;
  };
  customTemplate: {
    cfnObject?: string;
    roleName?: string;
  };
}

interface IAwsToken {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: number;
  OTPSecret?: string;
}

interface ITags extends Record<string, string | null> {}

interface IAssumeRoleConfiguration {
  accountId: string;
  externalId: string;
  roleArn: string;
  cachedCredentials?: IAwsToken;
  region: string;
  status?: 'REFRESHING' | 'READY' | 'FAILED';
  retryAfter?: number;
}

export interface IAwsProxyConfig {
  bucketName: string;
  bucketPrefix: string;
}

export { IAwsConfig, IAwsToken, IAssumeRoleConfiguration, ITags };
