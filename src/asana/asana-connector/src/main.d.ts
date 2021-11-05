interface WebhookStorageData {
  secret?: string;
  expiry?: number;
}

interface Event extends Record<string, any> {
  installId: string;
}

type StorageBucketItem = import('@fusebit-int/framework').Connector.Types.StorageBucketItem & {
  data?: WebhookStorageData;
};

type StorageBucketItemParams = import('@fusebit-int/framework').Connector.Types.StorageBucketItemParams & {
  data: WebhookStorageData;
};
