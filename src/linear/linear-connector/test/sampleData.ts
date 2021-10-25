export const sampleEvent = {
  action: 'update',
  createdAt: '2021-10-20T19:22:36.464Z',
  data: {
    id: '70030c07-1ede-455e-811d-e91a6755f681',
    createdAt: '2021-10-18T22:39:11.986Z',
    updatedAt: '2021-10-20T19:22:36.464Z',
    number: 4,
    title: 'Connect GitHub or GitLab',
    priority: 3,
    boardOrder: 0,
    sortOrder: -13850.24,
    previousIdentifiers: [],
    priorityLabel: 'Medium',
    teamId: 'ba9eaf20-d0d0-4205-ba5e-56ded559e9eb',
    stateId: 'd1b2cd8b-05cc-48a9-ae41-df5635bfc698',
    assigneeId: '798d68c1-54df-4414-9e64-fa78742f8290',
    subscriberIds: ['798d68c1-54df-4414-9e64-fa78742f8290'],
    labelIds: [],
    assignee: {
      id: '798d68c1-54df-4414-9e64-fa78742f8290',
      name: 'matthew+test@fusebit.io',
    },
    state: {
      id: 'd1b2cd8b-05cc-48a9-ae41-df5635bfc698',
      name: 'Todo',
      color: '#e2e2e2',
      type: 'unstarted',
    },
    team: {
      id: 'ba9eaf20-d0d0-4205-ba5e-56ded559e9eb',
      name: 'Fusebit-test-workspace',
      key: 'FUS',
    },
  },
  updatedFrom: {
    updatedAt: '2021-10-20T19:08:20.229Z',
    sortOrder: -60.37,
    startedAt: '2021-10-20T19:06:46.737Z',
    stateId: '264449c7-10dd-42e1-9769-15d49f5dbb00',
  },
  url: 'https://linear.app/fusebit-test-workspace/issue/FUS-4/connect-github-or-gitlab',
  type: 'Issue',
  organizationId: '6a44b897-1952-42d0-8ab8-fa95211b0fa0',
};

export const sampleConfig = {
  handler: '@fusebit-int/linear-connector',
  configuration: {
    mode: { useProduction: true },
    scope: 'read',
    clientId: 'xxxxxxxxxxxxxxxxxxx',
    clientSecret: 'xxxxxxxx',
  },
};
