import { useContext } from 'react';
import { AuthCtx } from '../context/AuthContext.jsx';

export function useAuth() {
  return useContext(AuthCtx);
}
