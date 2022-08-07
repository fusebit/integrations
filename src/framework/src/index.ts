import {
  FusebitRouter as Router_,
  CronRouter as CronRouter_,
  EventRouter as EventRouter_,
  FusebitContext as Context_,
  CronContext as CronContext_,
  EventContext as EventContext_,
  TaskContext as TaskContext_,
  Next as NextType,
} from './router';
import { Manager as Manager_, IOnStartup as IOnStartup_, IConfig as IConfig_ } from './Manager';
import {
  ConnectorManager as ConnectorManager_,
  IInstanceConnectorConfig as IInstanceConnectorConfig_,
} from './ConnectorManager';
import * as Storage_ from './Storage';
import { Form as Form_ } from './Form';
import { Handler as Handler_ } from './Handler';
import * as Middleware_ from './middleware';
import {
  ProviderActivator as ProviderActivator_,
  WebhookClient as WebhookClient_,
  ApiClient as ApiClient_,
  IncomingWebhookClient as IncomingWebhookClient_,
  IncomingWebhookClient,
} from './provider';
import {
  Connector,
  Integration,
  TokenIdentityClient as TokenIdentityClient_,
  TokenSessionClient as TokenSessionClient_,
  BaseTokenClient as BaseTokenClient_,
} from './client/index';

// Objects
const Internal = {
  Handler: Handler_,
  Router: Router_,
  Form: Form_,
  ConnectorManager: ConnectorManager_,
  Manager: Manager_,
  Middleware: Middleware_,
  Storage: Storage_,
  Provider: {
    Activator: ProviderActivator_,
    WebhookClient: WebhookClient_,
    ApiClient: ApiClient_,
    TokenSessionClient: TokenSessionClient_,
    TokenIdentityClient: TokenIdentityClient_,
    BaseTokenClient: BaseTokenClient_,
    IncomingWebhookClient: IncomingWebhookClient_,
  },
};
// tslint:disable: ignore no-namespace no-internal-module no-empty-interface
module Internal {
  export type Router = Router_;
  export type CronRouter = CronRouter_;
  export type EventRouter = EventRouter_;
  export type Handler = typeof Handler_;
  export type Form = typeof Form_;
  export type ConnectorManager = typeof ConnectorManager_;
  export type Manager = typeof Manager_;
  export type Middleware = typeof Middleware_;
  export type Storage = typeof Storage_;
  export type ProviderActivator = typeof ProviderActivator_;
  export namespace Provider {
    export type Activator = typeof ProviderActivator_;
    export type WebhookClient = typeof WebhookClient_;
    export type ApiClient = ApiClient_;
    export type IFusebitCredentials = Integration.Types.IFusebitCredentials;
    export type IncomingWebhookClient = typeof IncomingWebhookClient_;
    export type TokenSessionClient = TokenSessionClient_<any>;
    export type TokenIdentityClient = TokenIdentityClient_<any>;
    export type BaseTokenClient = BaseTokenClient_<any>;
  }
  export namespace Types {
    export type Context = Context_;
    export type CronContext = CronContext_;
    export type EventContext = EventContext_;
    export type TaskContext = TaskContext_;
    export type Next = NextType;
    export interface IConfig extends IConfig_ {}
    export interface IOnStartup extends IOnStartup_ {}
    export type WebhookClient = Integration.Types.WebhookClient;
    export type IInstanceConnectorConfig = IInstanceConnectorConfig_;
    export type IFusebitCredentials = Integration.Types.IFusebitCredentials;
    export type IncomingWebhookClient = typeof IncomingWebhookClient_;
    export type BaseTokenClient = typeof BaseTokenClient_;
  }
}

export { Connector, Integration, Internal };
