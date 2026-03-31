import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  userid: string;
  role: string;
  name: string;
  is_active: boolean;
  exp: number;
}

export function getUserFromToken(): DecodedToken | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      return null;
    }
    return decoded;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}
