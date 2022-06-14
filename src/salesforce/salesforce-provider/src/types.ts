import jsforce from 'jsforce';

export type FusebitClient = jsforce.Connection & { fusebit?: { credentials: any; identity?: any } };
