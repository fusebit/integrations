import { Router as RouterType, Context as ContextType, Next as NextType } from './Router';
import { Manager as Manager_, IOnStartup as IOnStartupInterface } from './Manager';
import { ConnectorManager as ConnectorManager_ } from './ConnectorManager';
import * as Storage_ from './Storage';
import { Form as Form_ } from './Form';
import { Handler as Handler_ } from './Handler';
import * as Middleware_ from './middleware';
import ProviderActivator_ from './ProviderActivator';
import { Connector, Integration } from './client/index';

// Objects
const Internal = {
  Handler: Handler_,
  Router: RouterType,
  Form: Form_,
  ConnectorManager: ConnectorManager_,
  Manager: Manager_,
  Middleware: Middleware_,
  Storage: Storage_,
  ProviderActivator: ProviderActivator_,
};
// tslint:disable: ignore no-namespace no-internal-module no-empty-interface
module Internal {
  export type Router = RouterType;
  export type Handler = typeof Handler_;
  export type Form = typeof Form_;
  export type ConnectorManager = typeof ConnectorManager_;
  export type Manager = typeof Manager_;
  export type Middleware = typeof Middleware_;
  export type Storage = typeof Storage_;
  export type ProviderActivator = typeof ProviderActivator_;
  export namespace Types {
    export type Context = ContextType;
    export type Next = NextType;
    export interface IOnStartup extends IOnStartupInterface {}
  }
}

export { Connector, Integration, Internal };
