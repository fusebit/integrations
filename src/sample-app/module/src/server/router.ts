import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import apiRouter from './api';
import fs from 'fs';
import cors from 'cors';
// @ts-ignore
import cookieSession from 'cookie-session';

declare module 'express-session' {
  interface SessionData {
    tenantData: {
      tenants: [
        {
          tenantId: number;
          name: string;
          integrationInstalled: boolean;
          integrationActivated: boolean;
          index: number;
        }
      ];
      currentTenantId: number;
    };
    taskData: {
      [key: number]: // Tenant Id
      {
        name: string;
        description: string;
      }[];
    };
  }
}

const router = express.Router();

router.use('/api', apiRouter);

router.get('/static/:filename', async (req, res) => {
  let data = fs.readFileSync(path.resolve(__dirname, '../public', req.params.filename), 'utf8');
  res.send(data);
});

router.get('/client/:filename', async (req, res) => {
  let data = getFile(res.locals.config, req.params.filename);
  res.send(data);
});
router.get('/*', (req, res) => {
  let data = getFile(res.locals.config);
  res.send(data);
});

const getFile = (config: any, filename: string = 'index.html') => {
  let data = fs.readFileSync(path.resolve(__dirname, '../../dist', filename), 'utf8');
  data = data.replace(/{{APP_URL}}/g, config.appUrl);
  return data;
};

export default router;
