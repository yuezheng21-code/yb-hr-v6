const ROLE_PERMISSIONS = {
  admin: ['*'],
  hr: ['employees.read', 'employees.write', 'employees.export', 'personnel.read', 'personnel.request', 'personnel.approve', 'changes.read', 'changes.export'],
  mgr: ['employees.read', 'personnel.request', 'personnel.approve', 'changes.read', 'changes.export'],
  wh: ['employees.read', 'changes.read'],
  sup: ['employees.read', 'employees.export', 'changes.read', 'changes.export'],
  fin: ['employees.read'],
  worker: [],
  client: [],
};

export function hasPermission(user, permission) {
  if (!user) return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions : (ROLE_PERMISSIONS[user.role] || []);
  return permissions.includes('*') || permissions.includes(permission);
}

export function canApprove(user, approvalType) {
  return hasPermission(user, 'personnel.approve') || hasPermission(user, `personnel.approve.${approvalType}`);
}
