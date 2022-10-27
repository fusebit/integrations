export async function isTokenValid(token: string, appId: string, organizationId: string) {
  return new Promise((resolve) => {
    if (!organizationId || !appId) {
      resolve(false);
    }
    resolve(true);
  });
}
