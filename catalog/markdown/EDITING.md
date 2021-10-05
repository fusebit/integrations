# Editing Integration code

1. Ensure you have a recent version of [Node.js](https://nodejs.org) on your system and then run

`npm i -g @fusebit/cli`

2. After the Fusebit CLI is installed, run the following command. This command will trigger an 
authentication process where you will need to log in with the same account you used for the Fusebit 
Management Portal.

`fuse init`

3. You can now download the code for an integration.

`fuse integration get <% global.consts.integrationId %> -d <% global.consts.integrationId %>`

4. You can now explore the code in the given directory and make any changes with your favorite editor or IDE. At present, the code cannot be executed locally, so running `npm install` is not necessary. 

5. After making local changes to the code, you can push the updates to Fusebit's cloud by running

`fuse integration deploy <% global.consts.integrationId %> -d <% global.consts.integrationId %>`
