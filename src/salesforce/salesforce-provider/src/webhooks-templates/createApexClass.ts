const createApexClass = (className: string, entityId: string, secret: string, webhookId: string) => {
  return `
    
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
    
            String userId = JSON.serialize(UserInfo.getUserId());
            String instanceUrl = JSON.serialize(EncodingUtil.urlEncode(URL.getSalesforceBaseUrl().toExternalForm(), 'UTF-8'));
            String eventType = JSON.serialize('${entityId}');
            String content = '{"new": ' + newObjects + ', "old": ' + oldObjects + ', "type": ' + eventType +  ', "userId": ' + userId + ', "instanceUrl": ' + instanceUrl + ', "action": ' + JSON.serialize(action) + '}';
            return content;
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

            // Webhooks secrets are created for webhook verification purposes only
            String secretKey = '${secret}';
            String signature = generateHmacSHA256Signature('${entityId}', secretKey);
            String webhookId = '${webhookId}';
            req.setHeader('x-salesforce-signature', signature);
            req.setHeader('x-salesforce-webhook-id', webhookId);
            req.setBody(content);
    
            h.send(req);
        }

        private static String generateHmacSHA256Signature(String input, String secretKeyValue) {
            String algorithmName = 'HmacSHA256';
            Blob hmacData = Crypto.generateMac(algorithmName, Blob.valueOf(input), Blob.valueOf(secretKeyValue));
            return EncodingUtil.base64Encode(hmacData);
        }

    }
    `;
};

export default createApexClass;
