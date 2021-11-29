export interface IApiClient {
  get: (url: string) => Promise<any>;
  put: (url: string) => Promise<any>;
  post: (url: string) => Promise<any>;
  delete: (url: string) => Promise<any>;
  head: (url: string) => Promise<any>;
  patch: (url: string) => Promise<any>;
}

export interface IFusebitCredentials {
  credentials: { access_token: string };
  lookupKey: string;
  connectorId: string;
}

export type IDiscordApplicationOwner = Pick<IDiscordUser, 'id' | 'username' | 'discriminator' | 'avatar'>;

export interface IDiscordUser {
  id: string;
  username: string; // The user's username, not unique across the platform
  discriminator: string; // The user's 4-digit discord-tag
  avatar?: string;
  bot: boolean;
  mfa_enabled: boolean;
  banner?: string;
  accent_color?: number;
  locale: string;
  verified: boolean;
  email?: string;
  flags?: number;
  premium_type: number;
  public_flags: number;
}

export interface IDiscordApplication {
  id: string;
  name: string;
  icon?: string;
  description: string;
  bot_public: boolean;
  bot_require_code_grant: boolean;
  terms_of_service_url: string;
  privacy_policy_url: string;
  owner: IDiscordApplicationOwner;
}

export interface IDiscordAuthorizationInfo {
  application: IDiscordApplication;
  scopes: string[];
  expires: string; // ISO8601 timestamp
  user?: string;
}

// https://discord.com/developers/docs/resources/channel#channel-object-channel-types
export enum ChannelType {
  GUILD_TEXT = 0,
  DM,
  GUILD_VOICE,
  GROUP_DM,
  GUILD_CATEGORY,
  GUILD_NEWS,
  GUILD_STORE,
  GUILD_NEWS_THREAD = 10, // Silly enum ¯\_(ツ)_/¯
  GUILD_PUBLIC_THREAD,
  GUILD_PRIVATE_THREAD,
  GUILD_STAGE_VOICE,
}

export interface IDiscordChannel {
  id: string; // Snowflake format
  type: ChannelType;
  guild_id: string;
  position: number;
  permission_overwrites: unknown;
  name: string;
  topic?: string;
  nsfw: boolean;
  last_message_id?: string;
  bitrate: number;
  user_limit: number;
  rate_limit_per_user: number;
  recipients: unknown;
  icon?: string;
  owner_id: string;
  application_id: string;
  parent_id: string;
  last_pin_timestamp: string;
  rtc_region?: string;
  video_quality_mode: number;
  message_count: number;
  member_count: number;
  thread_metadata: unknown;
  member: unknown;
  default_auto_archive_duration: number;
  permissions: string;
}

export enum HttpMethodType {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  HEAD = 'head',
  DELETE = 'delete',
  OPTIONS = 'options',
}

export interface IBotCheck {
  hasBotScope: boolean;
  botToken: string;
}
export interface IDiscordMethods {
  get(resource: string, body: any): Promise<any>;
  post(resource: string, body: any): Promise<any>;
  patch(resource: string, body: any): Promise<any>;
  delete(resource: string, body: any): Promise<any>;
  put?(resource: string, body: any): Promise<any>;
  head?(resource: string, body: any): Promise<any>;
  options?(resource: string, body: any): Promise<any>;
}

export enum AuthorizationType {
  Bearer = 'Bearer',
  Bot = 'Bot',
}
