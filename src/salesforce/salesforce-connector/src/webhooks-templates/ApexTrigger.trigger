trigger {{triggerName}} on {{entityId}} ({{events}}) {
      String url = '{{webhookEndpoint}}';
      String content = {{className}}.jsonContent(Trigger.new, Trigger.old, String.valueOf(Trigger.operationType).toLowercase(), {{entityId}});
      {{className}}.callout(url, content);
}