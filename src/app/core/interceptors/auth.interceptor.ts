import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches the Phase 1 JWT (localStorage `nemt_jwt`) to /api requests.
 * The backend is optional — when there is no token (demo/Vercel mode) the
 * request goes out unchanged and the services fall back to localStorage.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }
  let token: string | null = null;
  try {
    token = localStorage.getItem('nemt_jwt');
  } catch {
    token = null;
  }
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
