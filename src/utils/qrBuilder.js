export const buildProductQr = (customId) => {
  return `ID:${customId}`;
};

export const buildInvoiceQr = (customId, invoiceId) => {
  return `ID:${customId}|INV:${invoiceId}`;
};

export const buildBatchQr = (customId, batchId) => {
  return `ID:${customId}|BATCH:${batchId}`;
};

export const buildUnitQr = (customId, batchId, imei) => {
  return `ID:${customId}|BATCH:${batchId}|IMEI:${imei}`;
};