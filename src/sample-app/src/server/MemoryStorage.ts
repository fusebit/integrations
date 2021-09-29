// interface Session {
//     id: string;
//     [key: string]: any
// }
//
// interface Tenant {
//     id: number;
//     name: string;
//     sessions: Record<string, Session>;
//     instanceId: string;
//     isSlackEnabled: boolean;
// }
//
// interface Task {
//     name: string,
//     description: string;
// }
//
// interface Store {
//     tenants: Record<string, Tenant>,
//     tasks: Task[]
// }
//
// const Store: Store = {
//     tenants: {},
//     tasks: []
// }
//
// const MemoryManager = {
//     setTenant: (tenant: Tenant) => {
//         Store.tenants[tenant.id] = {sessions: {}, ...Store.tenants[tenant.id], ...tenant};
//     },
//     getTenant: (tenantId: string) => {
//         return Store.tenants[tenantId];
//     },
//     setTenantInstanceId: (tenantId: string, instanceId: string) => {
//         Store.tenants[tenantId].instanceId = instanceId;
//     },
//     getTenantInstanceId: (tenantId: string) => {
//         return Store.tenants[tenantId].instanceId;
//     },
//     setTenantSessionId: (tenantId: string, session: Session) => {
//         Store.tenants[tenantId].sessions[session.id] = session;
//     },
//     getTenantSession: (tenantId: string, sessionId: string) => {
//         return Store.tenants[tenantId].sessions[sessionId];
//     },
//     getTenantBySessionId: (sessionId: string) => {
//         return Object.values(Store.tenants)
//             .find(tenant =>
//                 Object.values(tenant.sessions)
//                     .some(session =>
//                         session.id === sessionId));
//     },
//     isSlackEnabled: (tenantId: string) => {
//         return MemoryManager.getTenant(tenantId).isSlackEnabled;
//     },
//     slackEnabled: (tenantId: string, enabled: boolean = true) => {
//         Store.tenants[tenantId].isSlackEnabled = enabled;
//     },
//     addTask: (task: Task) => Store.tasks.push(task),
//     getTasks: () => Store.tasks
//
// }
//
// export default MemoryManager;