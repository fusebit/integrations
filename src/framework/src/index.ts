import {
  FusebitRouter as Router_,
  CronRouter as CronRouter_,
  EventRouter as EventRouter_,
  FusebitContext as Context_,
  CronContext as CronContext_,
  EventContext as EventContext_,
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
import ProviderActivator_, { WebhookClient } from './ProviderActivator';
import { Connector, Integration } from './client/index';

// Objects
const Internal = {
  Handler: Handler_,
  Router: Router_,
  Form: Form_,
  ConnectorManager: ConnectorManager_,
  Manager: Manager_,
  Middleware: Middleware_,
  Storage: Storage_,
  ProviderActivator: ProviderActivator_,
  WebhookClient: WebhookClient,
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
  export namespace Types {
    export type Context = Context_;
    export type CronContext = CronContext_;
    export type EventContext = EventContext_;
    export type Next = NextType;
    export interface IConfig extends IConfig_ {}
    export interface IOnStartup extends IOnStartup_ {}
    export type WebhookClient = Integration.Types.WebhookClient;
    export type IInstanceConnectorConfig = IInstanceConnectorConfig_;
  }
}

export { Connector, Integration, Internal };
