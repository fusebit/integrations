async function quickbooksSendInvoice(ctx, invoiceID, sendTo) {
  // For the QuickBooks SDK documentation, see https://github.com/mcohen01/node-quickbooks
  const quickbooksClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await quickbooksClient.sendInvoicePdf(invoiceID, sendTo);
}

const code = `
  /**
   * Emails the Invoice PDF from QuickBooks to the address supplied in Invoice.BillEmail.EmailAddress
   * or the specified 'sendTo' address
   * 
   * @param ctx {FusebitContext} Fusebit Context
   * @param invoiceID {string} ID of the invoice to send
   * @param  {string} sendTo - optional email address to send the PDF to. If not provided, address supplied in Invoice.BillEmail.EmailAddress will be used
   */
  ${quickbooksSendInvoice.toString()}
  `;

module.exports = {
  name: 'Emails the Invoice PDF from QuickBooks',
  description:
    'Emails the Invoice PDF from QuickBooks to the address supplied in Invoice.BillEmail.EmailAddress or the specified sendTo address.',
  code,
};
