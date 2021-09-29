import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import SampleApp from '@fusebit-int/sample-app';
const router = express.Router();

const SampleAppMiddleware = SampleApp({
  IntegrationName: process.env.INTEGRATION_NAME,
  integrationUrl: process.env.INTEGRATION_URL,
  fusebitJwt: process.env.FUSEBIT_JWT,
  appUrl: process.env.APP_URL,
});

router.use(SampleAppMiddleware);

export default router;


const router = express.Router();

router.use((req, res, next) => {
  const integrationData = req.query.integrationData;
  const sampleAppRouter = SampleAppMiddleware(integrationData);
  return sampleAppRouter(req, res, next);
});

export default router;
