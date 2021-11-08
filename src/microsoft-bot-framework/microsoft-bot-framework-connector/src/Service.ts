import { Connector } from '@fusebit-int/framework';
import { JwtTokenExtractor } from 'botframework-connector/lib/auth/jwtTokenExtractor';

class Service extends Connector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.recipient.id;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const tokenValidationParams = {
      issuer: ['https://api.botframework.com'],
      clockTolerance: 300,
      ignoreExpiration: false,
    };

    const metadataUrl = 'https://login.botframework.com/v1/.well-known/openidconfiguration';
    const allowedAlgorithms = ['RS256', 'RS384', 'RS512'];
    const tokenValidator = new JwtTokenExtractor(tokenValidationParams, metadataUrl, allowedAlgorithms);

    const token = ctx.req.headers?.authorization?.split(' ')[1];
    const channelId = ctx.req.body.channelId;
    const requiredEndorsements: string[] = []; // empty array intended
    await tokenValidator['validateToken'](token, channelId, requiredEndorsements);

    return true;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    return false;
  }

  protected getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
