import { loadApexFile, replaceElements } from './apexUtilities';

export interface IApexTrigger {
  triggerName: string;
  className: string;
  entityId: string;
  webhookEndpoint: string;
  events: string[];
}

const createApexTrigger = async (options: IApexTrigger) => {
  const fileContent = await loadApexFile('ApexTrigger');
  return replaceElements(fileContent, ({ ...options, events: options.events.join(',') } as unknown) as Record<
    string,
    string
  >);
};

export default createApexTrigger;
