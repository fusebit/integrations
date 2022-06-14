public class ${className} implements HttpCalloutMock {

        public static HttpRequest request;
        public static HttpResponse response;
    
        public HTTPResponse respond(HTTPRequest req) {
            request = req;
            response = new HttpResponse();
            response.setStatusCode(200);
            return response;
        }
    
        public static String jsonContent(List<Object> triggerNew, List<Object> triggerOld, String action) {
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
            String eventType = '${entityId}';
            JSONGenerator gen = JSON.createGenerator(true);
            gen.writeStartObject();
            gen.writeStringField('old', oldObjects);
            gen.writeStringField('new', newObjects);
            gen.writeStringField('type', eventType);
            gen.writeStringField('userId', userId);
            gen.writeStringField('instanceUrl', instanceUrl);
            gen.writeStringField('action',  action);
            gen.writeEndObject();

            return gen.getAsString();
        }
    
        @future(callout=true)
        public static void callout(String url, String content) {
    
            if (Test.isRunningTest()) {
                Test.setMock(HttpCalloutMock.class, new ${className}());
            }
    
            Http h = new Http();
    
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('User-Agent', 'fusebit/salesforce');

            // Webhooks secrets are created for webhook verification purposes only
            String secretKey = '${secret}';
            String signature = generateHmacSHA256Signature('${entityId}', secretKey);
            String webhookId = '${webhookId}';
            req.setHeader('x-fusebit-salesforce-signature', signature);
            req.setHeader('x-fusebit-salesforce-webhook-id', webhookId);
            req.setBody(content);
    
            h.send(req);
        }

        private static String generateHmacSHA256Signature(String input, String secretKeyValue) {
            String algorithmName = 'HmacSHA256';
            Blob hmacData = Crypto.generateMac(algorithmName, Blob.valueOf(input), Blob.valueOf(secretKeyValue));
            return EncodingUtil.base64Encode(hmacData);
        }

    }