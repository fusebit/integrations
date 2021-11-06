type FusebitClient = import('jsforce').Connection & { fusebit?: { credentials: any; identity?: any } };
