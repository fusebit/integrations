export default interface AwsCredentials {
  credentials: { accessKeyId: string; secretAccessKey: string; sessionToken: string };
}
