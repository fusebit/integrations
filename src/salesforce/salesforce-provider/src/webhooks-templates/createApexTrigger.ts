export interface IApexTrigger {
  triggerName: string;
  className: string;
  entityId: string;
  webhookEndpoint: string;
  events: string[];
}

const createApexTrigger = (options: IApexTrigger) => {
  return `trigger ${options.triggerName} on ${options.entityId} (${options.events.join(',')}) {
      String url = '${options.webhookEndpoint}';
      String content = ${
        options.className
      }.jsonContent(Trigger.new, Trigger.old, String.valueOf(Trigger.operationType).toLowercase());
      ${options.className}.callout(url, content);
    }
`;
};

export default createApexTrigger;
