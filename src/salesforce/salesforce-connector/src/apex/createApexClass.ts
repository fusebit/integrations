import { loadApexFile, replaceElements } from './apexUtilities';

const createApexClass = async (className: string, entityId: string, secret: string, webhookId: string) => {
  const fileContent = await loadApexFile('ApexClass');
  return replaceElements(fileContent, {
    className,
    entityId,
    secret,
    webhookId,
  });
};

export default createApexClass;
