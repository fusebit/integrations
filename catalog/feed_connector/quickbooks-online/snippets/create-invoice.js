async function quickbooksCreateInvoice(ctx, invoice) {
  // For the QuickBooks SDK documentation, see https://github.com/mcohen01/node-quickbooks
  const quickbooksClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await quickbooksClient.createInvoice(invoice);
}

const code = `
  /**
   * Create a new Invoice in QuickBooks
   * 
   * @param ctx {FusebitContext} Fusebit Context
   * @param invoice {object} Invoice Object
   */
  ${quickbooksCreateInvoice.toString()}
  `;

module.exports = {
  name: 'Create a new Invoice in Quickbooks',
  description: 'Create a new Invoice in Quickbooks',
  code,
};
