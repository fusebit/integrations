jest.unmock('botbuilder');

import {
  BotFrameworkAdapter as OriginalBotFrameworkAdapter,
  TurnContext as OriginalTurnContext,
  WebRequest as OriginalWebRequest,
  WebResponse as OriginalWebResponse,
} from 'botbuilder';

export type WebRequest = OriginalWebRequest;
export type WebResponse = OriginalWebResponse;
export class TurnContext extends OriginalTurnContext {}

export class BotFrameworkAdapter extends OriginalBotFrameworkAdapter {
  expectedBody: any;

  setProcessActivityExpectedBody(body: any) {
    this.expectedBody = body;
  }

  public async processActivity(
    req: WebRequest,
    res: WebResponse,
    logic: (context: TurnContext) => Promise<any>
  ): Promise<void> {
    expect(req.body).toBe(this.expectedBody);
    const context = {} as TurnContext;
    return logic(context);
  }
}
