export const buildProductQr = (customId) => {
  return `ID:${customId}`;
};

export const buildInvoiceQr = (customId, invoiceId) => {
  return `ID:${customId}|INV:${invoiceId}`;
};

export const buildBatchQr = (customId, batchId) => {
  return `ID:${customId}|BATCH:${batchId}`;
};