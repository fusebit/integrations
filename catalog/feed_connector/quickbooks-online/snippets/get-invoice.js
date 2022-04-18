async function quickbooksGetInvoice(ctx, invoiceID) {
  // For the QuickBooks SDK documentation, see https://github.com/mcohen01/node-quickbooks
  const quickbooksClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await quickbooksClient.getInvoice(invoiceID);
}

const code = `
  /**
   * Get an invoice from QuickBooks
   *
   * @param ctx {FusebitContext} Fusebit Context
   * @param invoiceID {string} The Id of the Invoice
   */
  ${quickbooksGetInvoice.toString()}
  `;

module.exports = {
  name: 'Get an invoice from QuickBooks',
  description: 'Get an invoice from QuickBooks',
  code,
};
