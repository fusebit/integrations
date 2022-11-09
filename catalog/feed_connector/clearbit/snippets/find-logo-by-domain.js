async function findLogoByDomain(ctx, domain, size = 200, format = 'png', greyscale = true) {
  // Learn more at https://dashboard.clearbit.com/docs?shell#logo-api
  const clearbitClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const logoApi = clearbitClient.makeApiClient('logo');
  return logoApi.get(`${domain}?size=${size}&format=${format}&greyscale=${greyscale}`);
}

const code = `
    /**
     * Get a logo based on company's domain
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param domain {string} The company domain to use
     * @param size {number} (optional) image size: length of longest side in pixels (default is 128)
     * @param format {string} (optional) image format, either "png" or "jpg" (defaults to png)
     * @param greyscale {boolean} (optional) Desaturates image if passed (defaults to false)
     * @returns An image in the specified format, size and color
     */
    ${findLogoByDomain.toString()}
    `;

module.exports = {
  name: "Get a logo based on company's domain",
  description:
    "Get a logo based on company's domain. Using Clearbit Logo API requires a link back to clearbit.com on any page the logo is displayed. Attribution must be legible and use at least a 12-point font.",
  code,
};
