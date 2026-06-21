export const parseQrCode = (code) => {
  const raw = String(code || '').trim();

  if (!raw) {
    return {
      raw,
      id: '',
      invoiceId: '',
      batchId: '',
      type: 'UNKNOWN',
      isValid: false
    };
  }

  let id = raw;
  let invoiceId = '';
  let batchId = '';
  let imei = '';

  if (raw.includes('|')) {
    const parts = raw.split('|').map((p) => p.trim());

    id = parts.find((p) => p.startsWith('ID:'))?.replace('ID:', '').trim() || '';
    invoiceId =
      parts.find((p) => p.startsWith('INV:'))?.replace('INV:', '').trim() || '';
    batchId =
      parts.find((p) => p.startsWith('BATCH:'))?.replace('BATCH:', '').trim() || '';
    imei = parts.find((p) => p.startsWith('IMEI:'))?.replace('IMEI:', '').trim() || '';
  } else if (raw.startsWith('ID:')) {
    id = raw.replace('ID:', '').trim();
  }

  let type = 'PRODUCT';

  if (imei) {
    type = 'UNIT';
  } else if (invoiceId) {
    type = 'INVOICE';
  } else if (batchId) {
    type = 'BATCH';
  } else if (!id) {
    type = 'UNKNOWN';
  }

  return {
    raw,
    id,
    invoiceId,
    batchId,
    imei,
    type,
    isValid: Boolean(id)
  };
};