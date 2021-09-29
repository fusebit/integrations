export interface Tenant {
  tenantId: number;
  name: string;
  integrationInstalled: boolean;
  integrationActivated: boolean;
  tasks: Task[];
  index: number;
}

export interface Task {
  name: string;
  description: string;
  index?: number;
}

export interface TenantData {
  currentTenantId: number;
  tenants: Tenant[];
}

export enum IntegrationType {
  slack = 'slack',
  hubspot = 'hubspot',
}
