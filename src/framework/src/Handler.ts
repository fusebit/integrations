import { Manager, IRequestResponse } from './Manager';

export const Handler = (handler: string, config: any) => {
  const manager = new Manager();

  let router;
  let routerError;
  let componentClass;
  do {
    try {
      // Try exported via `module.exports = integration;`
      componentClass = require(handler);
      router = componentClass.router;
      if (router) {
        break;
      }

      // Try exported via `export default connector;`
      router = componentClass.default.router;
      if (router) {
        break;
      }

      throw new Error(`No Router found on handler ${handler}; try 'export default connector;'.`);
    } catch (e) {
      routerError = e;
    }
  } while (false);

  manager.setup(config, router, routerError); // Configure the system.

  return async (ctx: any): Promise<IRequestResponse> => {
    let result;
    try {
      result = await manager.handle(ctx);
    } catch (error) {
      console.log('ERROR: ', error);
      return { body: { config, error, result, ctx }, headers: {} };
    }

    return result;
  };
};
