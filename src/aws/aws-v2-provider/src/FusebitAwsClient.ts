interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

export default class FusebitAwsClient {
  constructor(private credentials: AwsCredentials, public fusebit: any) {}

  public get<Sdk>(client: new (creds: any) => Sdk, region: string) {
    return new client({
      ...this.credentials,
      region,
    });
  }
}
