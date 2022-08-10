Thanks for trying out Fusebit and downloading your Google Integration code.

Use your favorite tools to make any changes to the code in this folder.


# Editing Integration code

1. Ensure you have a recent version of [Node.js](https://nodejs.org) on your system and then run

`npm i -g @fusebit/cli`

2. After the Fusebit CLI is installed, run the following command. This command will trigger an 
authentication process where you will need to log in with the same account you used for the Fusebit 
Management Portal.

`fuse init`

3. You can now download the code for an integration.

`fuse integration get google-bigquery-mp -d google-bigquery-mp`

4. You can now explore the code in the given directory and make any changes with your favorite editor or IDE. At present, the code cannot be executed locally, so running `npm install` is not necessary. 

5. After making local changes to the code, you can push the updates to Fusebit's cloud by running

`fuse integration deploy google-bigquery-mp -d google-bigquery-mp`


# Running your Integration

To run the Integration and test as you make changes, follow these steps:

1. (Development-time only) The integration needs to know the Identity of the user on whose behalf to execute. In production, this will be handled by your application, but for test purposes, you can log in as yourself manually.Open the test application for the 'google-bigquery-mp' integration in the browser with:

`fuse integration test google-bigquery-mp`

2. You will be asked to log in, and the integration will act on your behalf going forward.

3. Note the `curl` command and JavaScript example displayed by the test application in the previous step and use that to invoke the integration. If your token expires, you can always obtain a new one by opening up the test application again with `fuse integration test google-bigquery-mp`, or by generating a new access token directly with `fuse token -o raw`.


# Debugging your Integration

After you make a code change and run the Integration, you can inspect `console`
output and any errors by running:

`fuse integration log google-bigquery-mp`

