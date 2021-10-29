interface WebhookStorageData {
  secret?: string;
  expiry?: number;
}

interface Event extends Record<string, any> {
  installId: string;
}

interface ITest {
  a: number;
  b: string;
}

type ATest = ITest[keyof ITest][];
