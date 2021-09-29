import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
// @ts-ignore
import webpackConfig from '../../webpack.config.js';
const compiler = webpack(webpackConfig);
import router from './router';

const app = express();

app.use((req, res, next) => {
    res.locals.config = {
        integrationName: process.env.INTEGRATION_NAME,
        integrationUrl: process.env.INTEGRATION_URL,
        fusebitJwt: process.env.FUSEBIT_JWT,
        appUrl: process.env.APP_URL,
    };
    console.log("configs loaded:", res.locals.config)
    next();
});

app.use(
    webpackDevMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath,
    })
);
app.use(router);
app.listen(3000, function () {
    console.log('Example app listening on port 3000!\n');
});