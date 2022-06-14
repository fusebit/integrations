import { loadApexFile, replaceElements } from './apexUtilities';

export interface IApexTestClass {
  testClassName: string;
  webhookClassName: string;
  entityId: string;
  webhookEndpoint: string;
}

const createApexTestClass = async (options: IApexTestClass) => {
  const fileContent = await loadApexFile('ApexTestClass');
  return replaceElements(fileContent, (options as unknown) as Record<string, string>);
};

export default createApexTestClass;
