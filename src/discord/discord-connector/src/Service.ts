import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from 'crypto';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.guild_id;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const payload = ctx.req.body;
    const signatureHeader = ctx.req.headers['x-signature-ed25519'] as string;
    const timeStamp = ctx.req.headers['x-signature-timestamp'] as string;
    if (!payload || !signatureHeader || !timeStamp) {
      return false;
    }
    const message = Buffer.from(timeStamp + JSON.stringify(payload));
    const signatureData = Buffer.from(signatureHeader, 'hex');
    const keyDer = `302a300506032b6570032100${ctx.state.manager.config.configuration.applicationPublicKey}`;
    const keyBase64 = Buffer.from(keyDer, 'hex').toString('base64');
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${keyBase64}\n-----END PUBLIC KEY-----`;
    const isValid = crypto.verify(null, message, publicKey, signatureData);
    return isValid;
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
