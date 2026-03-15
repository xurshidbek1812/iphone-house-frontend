export const PERMISSIONS = {
  INVOICE_APPROVE: 'invoice.approve',
  BLACKLIST_APPROVE: 'blacklist.approve',
  USERS_MANAGE: 'users.manage',
  CASHBOX_MANAGE: 'cashbox.manage'
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
