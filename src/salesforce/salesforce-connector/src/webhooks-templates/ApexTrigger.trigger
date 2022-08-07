trigger {{triggerName}} on {{entityId}} ({{events}}) {
      String url = '{{webhookEndpoint}}';
      String content = {{webhookClassName}}.jsonContent(Trigger.new, Trigger.old, String.valueOf(Trigger.operationType).toLowercase(), '{{entityId}}');
      {{webhookClassName}}.callout(url, content);
}