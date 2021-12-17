import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from 'crypto';

/*
 * ASN.1 pre-canned prefix specifying that the buffer (supplied via the configuration)
 * is a valid public key in DER format.
 * This is used to create a PEM-format certificate for node v14 to use when verifying inbound messages.
 */
const ED25519_PUBLIC_KEY_PREFIX = '302a300506032b6570032100';

// DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: ACK an interaction and edit a response later, the user sees a loading state
const DEFAULT_INTERACTION_CALLBACK_TYPE = 5;

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.guild_id;
  }

  public async createWebhookResponse(ctx: Connector.Types.Context): Promise<void> {
    // See docs https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type
    ctx.body = {
      type: ctx.state.manager.config.configuration.interactionCallbackType || DEFAULT_INTERACTION_CALLBACK_TYPE,
    };
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const payload = ctx.req.body;
    const signatureHeader = ctx.req.headers['x-signature-ed25519'] as string;
    const timeStamp = ctx.req.headers['x-signature-timestamp'] as string;
    if (!payload || !signatureHeader || !timeStamp) {
      return false;
    }
    const message = Buffer.from(timeStamp + JSON.stringify(payload));
    const signatureData = Buffer.from(signatureHeader, 'hex');
    const keyDer = `${ED25519_PUBLIC_KEY_PREFIX}${ctx.state.manager.config.configuration.applicationPublicKey}`;
    const keyBase64 = Buffer.from(keyDer, 'hex').toString('base64');
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${keyBase64}\n-----END PUBLIC KEY-----`;
    const isValid = crypto.verify(null, message, publicKey, signatureData);
    return isValid;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
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

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    // If the Discord application is setup to interact with a Guild (Discord server)
    if (token.guild) {
      return token.guild.id;
    }
  }

  public getWebhookEventType(event: any): string {
    return event.type.toString();
  }
}

export { Service };
