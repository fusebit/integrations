import { loadApexFile, replaceElements } from './apexUtilities';

export interface IApexClassOptions {
  className: string;
  webhookId: string;
  webhookSecretMetadata: string;
  webhookSecretMetadataValue: string;
}

const createApexClass = async ({
  className,
  webhookId,
  webhookSecretMetadata,
  webhookSecretMetadataValue,
}: IApexClassOptions) => {
  const fileContent = await loadApexFile('ApexClass.cls');
  return replaceElements(fileContent, {
    className,
    webhookId,
    webhookSecretMetadata,
    webhookSecretMetadataValue,
  });
};

export default createApexClass;
