import React from 'react';
import { Navigate } from 'react-router-dom';
import usePermission from '../hooks/usePermission';

const PermissionRoute = ({ permission, permissions = [], requireAll = false, fallbackPath = '/', children }) => {
  const { can, canAny, canAll } = usePermission();

  let allowed = true;

  if (permission) {
    allowed = can(permission);
  } else if (permissions.length > 0) {
    allowed = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!allowed) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default PermissionRoute;