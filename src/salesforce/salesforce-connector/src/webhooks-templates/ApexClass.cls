public class {{className}} implements HttpCalloutMock {

        public static HttpRequest request;
        public static HttpResponse response;
    
        public HTTPResponse respond(HTTPRequest req) {
            request = req;
            response = new HttpResponse();
            response.setStatusCode(200);
            return response;
        }
    
        public static String jsonContent(List<Object> triggerNew, List<Object> triggerOld, String action, String eventType) {
            String newObjects = '[]';
            if (triggerNew != null) {
                newObjects = JSON.serialize(triggerNew);
            }
    
            String oldObjects = '[]';
            if (triggerOld != null) {
                oldObjects = JSON.serialize(triggerOld);
            }
    
            String userId = UserInfo.getUserId();
            String instanceUrl = EncodingUtil.urlEncode(URL.getSalesforceBaseUrl().toExternalForm(), 'UTF-8');
           
            String content = JSON.serialize(new Map<String, Object>{
                    'old' => oldObjects,
                    'new' => newObjects,
                    'type' => eventType,
                    'userId' => userId,
                    'instanceUrl' => instanceUrl,
                    'action' => action
            });

            return content;
        }
    
        @future(callout=true)
        public static void callout(String url, String content) {
    
            if (Test.isRunningTest()) {
                Test.setMock(HttpCalloutMock.class, new {{className}}());
            }
    
            Http h = new Http();
    
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('User-Agent', 'fusebit/salesforce');

            // Webhooks secrets are created for webhook verification purposes only
            {{webhookSecretMetadata}} webhookSecret = [Select {{webhookSecretMetadataValue}} from {{webhookSecretMetadata}}];
            String signature = generateHmacSHA256Signature(content, webhookSecret.{{webhookSecretMetadataValue}});
            String webhookId = '{{webhookId}}';
            req.setHeader('fusebit-salesforce-signature', signature);
            req.setHeader('fusebit-salesforce-webhook-id', webhookId);
            Datetime validDate = datetime.now().addSeconds(60);
            req.setHeader('valid-until', String.valueOf(validDate));
            req.setBody(content);
    
            h.send(req);
        }

        private static String generateHmacSHA256Signature(String input, String secretKeyValue) {
            String algorithmName = 'HmacSHA256';
            Blob hmacData = Crypto.generateMac(algorithmName, Blob.valueOf(input), Blob.valueOf(secretKeyValue));
            return EncodingUtil.base64Encode(hmacData);
        }

    }