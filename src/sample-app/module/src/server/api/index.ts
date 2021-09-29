import express from 'express';
import tenants from './tenants';
import integration from './integration';
import task from "./task";

const apiRouter = express();
apiRouter.use('/tenants', tenants);
apiRouter.use('/integration', integration);
apiRouter.use('/task', task);
apiRouter.post('/reset', (req, res) => {
    delete req.session.tenantData;
    delete req.session.taskData;
    res.sendStatus(200);
})

export default apiRouter;