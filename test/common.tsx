import React from 'react';
import renderer from 'react-test-renderer';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';

import { Connector, Internal } from '../src/framework/libc';
const { Manager } = Internal;

export const request = (method: string, path: string, headers?: any, query?: any, body?: any) => {
  return {
    headers,
    method,
    path,
    query,
    body,
    accountId: 'acc-123',
    subscriptionId: 'sub-123',
    boundaryId: 'connector',
    functionId: 'con-123',
    fusebit: {
      endpoint: 'http://localhost:2222',
      functionAccessToken: '',
    },
    caller: {
      permissions: {
        allow: [{ resource: '/', action: '*' }],
      },
    },

    baseUrl: 'http://localhost:3001/v1/account/acc-123/subscription/sub-123/connector/con-123',
  };
};

export const cfg = {
  handler: 'foo',
  configuration: {
    defaultEventHandler: '',
  },
  mountUrl: '',

  schedule: [],
};

export const commonConnectorTests = (connector: Connector) => {
  describe('Connector', () => {
    test('validate connector can be loaded', async () => {
      const manager = new Manager();
      manager.setup(cfg, connector.router, undefined);
      const result = await manager.handle(request('GET', '/api/health'));
      expect(result.status).toBe(200);
    });

    test('validate configure can be loaded', async () => {
      const manager = new Manager();
      manager.setup(cfg, connector.router, undefined);
      const result = await manager.handle(request('GET', '/api/configure'));
      expect(result.status).toBe(200);
    });

    test('validate configure generates valid jsonforms', async () => {
      const manager = new Manager();
      manager.setup(cfg, connector.router, undefined);
      const result = await manager.handle(request('GET', '/api/configure'));
      expect(result.status).toBe(200);

      const component = renderer.create(
        <JsonForms
          schema={result.body.schema}
          uischema={result.body.uischema}
          data={result.body.data}
          renderers={materialRenderers}
          cells={materialCells}
        />
      );
    });
  });
};
