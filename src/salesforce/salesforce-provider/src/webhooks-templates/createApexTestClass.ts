export interface IApexTestClass {
  testClassName: string;
  webhookClassName: string;
  entityId: string;
  webhookEndpoint: string;
}

const createApexTestClass = (options: IApexTestClass) => {
  return `
  @isTest
  public class ${options.testClassName} {

      static SObject mock(String sobjectName) {
          SObjectType t = Schema.getGlobalDescribe().get(sobjectName);

          SObject o = t.newSobject();

          Map<String, Schema.SObjectField> m = t.getDescribe().fields.getMap();

          for (String fieldName : m.keySet()) {
              DescribeFieldResult f = m.get(fieldName).getDescribe();
              if (!f.isNillable() && f.isCreateable() && !f.isDefaultedOnCreate()) {
                  if (f.getType() == DisplayType.Boolean) {
                      o.put(f.getName(), false);
                  }
                  else if (f.getType() == DisplayType.Currency) {
                      o.put(f.getName(), 0);
                  }
                  else if (f.getType() == DisplayType.Date) {
                      o.put(f.getName(), Date.today());
                  }
                  else if (f.getType() == DisplayType.DateTime) {
                      o.put(f.getName(), System.now());
                  }
                  else if (f.getType() == DisplayType.Double) {
                      o.put(f.getName(), 0.0);
                  }
                  else if (f.getType() == DisplayType.Email) {
                      o.put(f.getName(), 'foo@foo.com');
                  }
                  else if (f.getType() == DisplayType.Integer) {
                      o.put(f.getName(), 0);
                  }
                  else if (f.getType() == DisplayType.Percent) {
                      o.put(f.getName(), 0);
                  }
                  else if (f.getType() == DisplayType.Phone) {
                      o.put(f.getName(), '555-555-1212');
                  }
                  else if (f.getType() == DisplayType.String) {
                      o.put(f.getName(), 'TEST');
                  }
                  else if (f.getType() == DisplayType.TextArea) {
                      o.put(f.getName(), 'TEST');
                  }
                  else if (f.getType() == DisplayType.Time) {
                      o.put(f.getName(), System.now().time());
                  }
                  else if (f.getType() == DisplayType.URL) {
                      o.put(f.getName(), 'http://foo.com');
                  }
                  else if (f.getType() == DisplayType.PickList) {
                      o.put(f.getName(), f.getPicklistValues()[0].getValue());
                  }
              }
          }
          return o;
      }

      @isTest static void testTrigger() {
          SObject o = mock('${options.entityId}');

          Test.startTest();
          insert o;
          update o;
          delete o;
          Test.stopTest();

          System.assertEquals(200, ${options.webhookClassName}.response.getStatusCode());
          System.assertEquals('${options.webhookEndpoint}', ${options.webhookClassName}.request.getEndpoint());

          if (${options.webhookClassName}.request != null) {
              Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(${options.webhookClassName}.request.getBody());
              System.assertNotEquals(null, jsonResponse.get('userId'));
          }
      }

  }
`;
};

export default createApexTestClass;
