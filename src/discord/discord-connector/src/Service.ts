import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';
import nacl from 'tweetnacl';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [{ data: ctx.req.body, type: ctx.req.body.type.toString() }];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.data.guild_id;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const payload = ctx.req.body;
    const signatureHeader = ctx.req.headers['x-signature-ed25519'] as string;
    const timeStamp = ctx.req.headers['x-signature-timestamp'] as string;
    if (payload && signatureHeader && timeStamp) {
      const message = Buffer.from(timeStamp + JSON.stringify(payload));
      const signatureData = Buffer.from(signatureHeader, 'hex');
      const publicKeyData = Buffer.from(ctx.state.manager.config.configuration.applicationPublicKey, 'hex');
      // The webhook validation is using Discord recommended library for Node.js
      const isValid = nacl.sign.detached.verify(message, signatureData, publicKeyData);
      return isValid;
    }
    return false;
  }

  protected async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    const interactionType = ctx.req.body?.type;
    // Override Webhook response to support Ping request from Discord.
    if (interactionType === 1) {
      ctx.body = {
        type: 1,
      };
      return true;
    }

    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    return token.guild.id;
  }

  protected getWebhookEventType(event: any): string {
    return event.type.toString();
  }
}

export { Service };
