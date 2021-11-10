import { Internal } from '@fusebit-int/framework';
import { BotFrameworkAdapter, TurnContext, WebRequest, WebResponse } from 'botbuilder';

type FusebitBotFrameworkAdapter = BotFrameworkAdapter & { fusebit?: any };

export default class SlackProvider extends Internal.ProviderActivator<FusebitBotFrameworkAdapter> {
  /*
   * This function will create an authorized wrapper of the BotFrameworkAdapter client.
   */
  public async instantiate(ctx: Internal.Types.Context): Promise<FusebitBotFrameworkAdapter> {
    console.log('---------------------- iooooooo');
    console.log();
    console.log('----------------------');

    const { botFrameworkConfig } = ctx.req.body.data;

    const botFrameworkAdapter = new BotFrameworkAdapter({
      appId: botFrameworkConfig.clientId,
      appPassword: 'this-is-not-a-real-or-needed-secret-as-we-bypass-it',
    }) as FusebitBotFrameworkAdapter;

    const botFrameworkAdapterBypass = botFrameworkAdapter as any;

    botFrameworkAdapterBypass.credentials.authenticationContext._cache._entries.push({
      _clientId: botFrameworkConfig.clientId,
      accessToken: botFrameworkConfig.accessToken,
      expiresOn: new Date(2999, 11, 30),
      resource: 'https://api.botframework.com',
      _authority: 'https://login.microsoftonline.com/botframework.com',
    });

    const originalProcessActivity = botFrameworkAdapter.processActivity;
    botFrameworkAdapter.processActivity = async (
      req: WebRequest,
      res: WebResponse,
      logic: (context: TurnContext) => Promise<any>
    ): Promise<void> => {
      const fusebitBody = req.body;
      req.body = fusebitBody.event;
      await originalProcessActivity(req, res, logic);
      req.body = fusebitBody;
    };

    return botFrameworkAdapter;
  }
}
