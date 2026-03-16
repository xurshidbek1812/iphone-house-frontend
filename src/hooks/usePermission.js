import { hasPermission } from '../utils/permissions';

const usePermission = () => {
  const can = (permission) => hasPermission(permission);

  const canAny = (permissions = []) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some((permission) => hasPermission(permission));
  };

  const canAll = (permissions = []) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every((permission) => hasPermission(permission));
  };

  return {
    can,
    canAny,
    canAll
  };
};

export default usePermission;