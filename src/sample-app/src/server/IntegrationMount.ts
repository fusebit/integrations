import router from './router';
import express, {NextFunction, Request, Response} from 'express';
import cookieSession from "cookie-session";


const mountApp = (config: {
    integrationName: string,
    integrationUrl: string,
    fusebitJwt: string,
    appUrl: string
}) => {

    const appUrl: URL = new URL(config.appUrl);

    const mountedRouter = express();


    const logger = (req:Request, res:Response, next:NextFunction) => {
        console.log(req.method, req.url);
        next();
    }

    mountedRouter.use(
      (req, res, next) => {
          res.locals.config = config;
          next();
      },
        logger,
        express.urlencoded({ extended: false }),

    );

    mountedRouter.use(router);

    return mountedRouter;
}

module.exports = mountApp;