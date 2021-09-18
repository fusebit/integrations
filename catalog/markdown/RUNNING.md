# Running your Integration

To run the Integration and test as you make changes, follow these steps:

1. (Development-time only) The integration needs to know the Identity of the user on whose behalf to execute. In production, this will be handled by your application, but for test purposes, you can log in as yourself manually.

Open the test application for the '<% global.consts.integrationId %>' integration in the browser with:

`fuse integration test <% global.consts.integrationId %>`

You will be asked to log in, and the integration will act on your behalf
going forward.

2. Note the `curl` command and JavaScript example displayed by the test application in the previous step and use that to invoke the integration. If your token expires, you can always obtain a new one by opening up the test application again with `fuse integration test <% global.consts.integrationId %>`, or by generating a new access token directly with `fuse token -o raw`.
