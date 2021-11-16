export default {
  verify: (token: string, resolvedSecret: string, config: any, cb: (error: any, verifiedToken: any) => void) => {
    cb(null, token);
  },
  decode: () => {
    return {
      header: {
        alg: 'RS256',
        kid: 'ZyGh1GbBL8xd1kOxRYchc1VPSQQ',
        typ: 'JWT',
        x5t: 'ZyGh1GbBL8xd1kOxRYchc1VPSQQ',
      },
    };
  },
};
