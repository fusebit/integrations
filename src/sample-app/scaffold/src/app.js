import express from 'express';
import logger from 'morgan';
import cookieSession from 'cookie-session';

import router from './routes/index.js';

const app = express();

app.use(cookieSession({
    keys: ['Fusebit Example'],
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(router);
app.listen(3000, function () {
    console.log('Example app listening on port 3000!\n');
});
