import express, {Response} from "express";
import fetch from 'node-fetch';
const router = express.Router();

const getHeaders = (res: Response) => ({
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${res.locals.config.fusebitJwt}`
})

router.get('/install', async (req, res, next) => {
    try {
        const tenantId = req.session.tenantData.currentTenantId;
        const body = JSON.stringify({
            redirectUrl: `${res.locals.config.appUrl}/api/integration/callback`,
            tags: {
                "fusebit.tenantId": tenantId.toString()
            }
        });
        const createSessionResponse = await fetch(
            `${res.locals.config.integrationUrl}/session`,
            {body, headers: getHeaders(res), method: 'POST'});
        const session = await createSessionResponse.json();
        if (session.status > 299) {
            res.status(session.status);
            res.send({});
            return;
        }
        const sessionId = session.id;
        res.redirect(`${res.locals.config.integrationUrl}/session/${sessionId}/start`);
        res.end();
    } catch (e) {
        console.log('Error starting fusebit session', e);
        res.sendStatus(500);
    }
});

router.post('/status', async (req, res, next) => {
    const newStatus = req.body.status;
    const currentTenant = req.session.tenantData.tenants.find(tenant => tenant.tenantId === req.session.tenantData.currentTenantId);
    currentTenant.integrationActivated = !!newStatus;
    res.send(req.session.tenantData);
})

router.get('/callback', async (req, res, next) => {
    const sessionId = req.query.session;
    const integrationUrl = res.locals.config.integrationUrl;

    try {
        const sessionPersistResponse = await fetch(
            `${integrationUrl}/session/${sessionId}/commit`,
            {headers:getHeaders(res), method: 'POST'}
        );
        if (sessionPersistResponse.status > 299) {
            throw 'ERROR: fusebit session did not persist';
        }
        const currentTenant = req.session.tenantData.tenants.find(tenant => tenant.tenantId === req.session.tenantData.currentTenantId);
        currentTenant.integrationInstalled = true;
        currentTenant.integrationActivated = true;
        next();

        // const sessionStatusResponse = await fetch(
        //     `${integrationUrl}/session/${sessionId}`,
        //     {headers:getHeaders()}
        // );
        // const sessionStatus = await sessionStatusResponse.json();
        //
        // const instanceId = sessionStatus.output.entityId;
    } catch (e) {
        console.log('Error committing fusebit session', e);
        res.sendStatus(500);
    }
});

export default router;
