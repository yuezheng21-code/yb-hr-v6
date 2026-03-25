import { useContext } from 'react';
import { AuthCtx } from '../context/AuthContext.jsx';

const ROLE_HIERARCHY = ['worker', 'wh', 'sup', 'mgr', 'fin', 'hr', 'admin'];

export function usePermission() {
  const { user } = useContext(AuthCtx);

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
  };

  const hasMinRole = (minRole) => {
    if (!user) return false;
    const userIdx = ROLE_HIERARCHY.indexOf(user.role);
    const minIdx = ROLE_HIERARCHY.indexOf(minRole);
    return userIdx >= minIdx;
  };

  const isAdmin = () => user?.role === 'admin';
  const isHR = () => ['admin', 'hr'].includes(user?.role);
  const isFinance = () => ['admin', 'fin'].includes(user?.role);
  const isWarehouse = () => ['admin', 'hr', 'wh'].includes(user?.role);
  const isManager = () => ['admin', 'hr', 'mgr'].includes(user?.role);
  const isSupplier = () => user?.role === 'sup';
  const isWorker = () => user?.role === 'worker';

  return { user, hasRole, hasMinRole, isAdmin, isHR, isFinance, isWarehouse, isManager, isSupplier, isWorker };
}
