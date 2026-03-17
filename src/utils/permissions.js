export const PERMISSIONS = {
  CASHBOX_VIEW: 'cashbox.view',
  CASHBOX_MANAGE: 'cashbox.manage',
  PRODUCT_MANAGE: 'product.manage',
  CATEGORY_MANAGE: 'category.manage',
  SUPPLIER_MANAGE: 'supplier.manage',
  INVENTORY_VIEW_AMOUNTS: 'inventory.view_amounts',
  INVOICE_APPROVE: 'invoice.approve',
  EXPENSE_CREATE: 'expense.create',
  EXPENSE_APPROVE: 'expense.approve',
};

export const hasPermission = (permission) => {
  const role = String(sessionStorage.getItem('userRole') || '').toLowerCase();

  if (role === 'director') return true;

  try {
    const permissions = JSON.parse(sessionStorage.getItem('userPermissions') || '[]');
    return Array.isArray(permissions) && permissions.includes(permission);
  } catch {
    return false;
  }
};
