export const saveAuthData = (data) => {
  if (!data?.token || !data?.user) return;

  const user = data.user;

  sessionStorage.setItem('token', data.token);
  sessionStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('userRole', String(user.role || '').toLowerCase());
  sessionStorage.setItem('userName', user.fullName || '');
  sessionStorage.setItem('currentUserLogin', user.username || '');
  sessionStorage.setItem(
    'userPermissions',
    JSON.stringify(Array.isArray(user.permissions) ? user.permissions : [])
  );
};

export const clearAuthData = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('currentUserLogin');
  sessionStorage.removeItem('userPermissions');
};

export const getToken = () => sessionStorage.getItem('token');

export const getUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};