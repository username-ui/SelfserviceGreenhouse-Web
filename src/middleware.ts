import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME } from './lib/auth';
import { getSessionUser } from './lib/store';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (
    pathname.startsWith('/_astro/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt'
  ) {
    return next();
  }

  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const user = token ? await getSessionUser(token) : null;
  context.locals.user = user;
  context.locals.token = user ? token : null;

  if (pathname.startsWith('/api/')) {
    return next();
  }

  if ((pathname === '/login' || pathname === '/register') && user) {
    return context.redirect('/');
  }

  if ((pathname === '/' || pathname === '/devices' || pathname.startsWith('/devices/')) && !user) {
    return context.redirect('/login');
  }

  return next();
});
