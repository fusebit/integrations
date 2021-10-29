interface WebhookStorageData {
  secret?: string;
  expiry?: number;
}

interface Event extends Record<string, any> {
  installId: string;
}
