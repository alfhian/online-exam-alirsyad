import { getUserFromToken } from '../utils/jwtHelper';

export function useAuth() {
  const user = getUserFromToken();
  const isAuthenticated = !!user;

  return { user, isAuthenticated };
}
