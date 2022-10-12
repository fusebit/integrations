export interface IMicrosoftGraphSubscriptionData {
  tenantId: string;
  changeType: string;
  resource: string;
  expirationDateTime: string;
  encryptionCertificate?: string;
  includeResourceData?: boolean;
  encryptionCertificateId?: string;
  useBeta?: boolean;
  lifecycleNotificationUrl?: string;
  notificationQueryOptions?: string;
}

export interface IMicrosoftGraphSubscription {
  id: string;
  resource: string;
  applicationId: string;
  changeType: string;
  clientState: string;
  notificationUrl: string;
  expirationDateTime: string;
  creatorId: string;
  notificationQueryOptions: string;
  lifecycleNotificationUrl: string;
  includeResourceData: boolean;
  latestSupportedTlsVersion: string;
  encryptionCertificate: string;
  encryptionCertificateId: string;
  notificationUrlAppId: string;
}

export interface IMicrosoftGraphUpdateSubscriptionData {
  expirationDateTime: string;
  accessToken: string;
}

export interface IMicrosoftGraphSubscriptionList {
  value: Array<IMicrosoftGraphSubscription>;
}
