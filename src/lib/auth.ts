import type { AstroCookies } from 'astro';
import type {
  DeviceBinding,
  PublicUser,
  UserDeviceSnapshot,
} from '../types/greenhouse';
import { fetchUserDeviceSnapshot } from './backend';
import { getSessionUser, normalizeDeviceId } from './store';

export const SESSION_COOKIE_NAME = 'gh_session';

export interface AuthContext {
  cookies: AstroCookies;
  locals?: App.Locals;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function setSessionCookie(cookies: AstroCookies, token: string): void {
  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, {
    path: '/',
  });
}

export async function getUserFromContext(context: AuthContext): Promise<PublicUser | null> {
  if (context.locals?.user) {
    return context.locals.user;
  }

  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (context.locals) {
      context.locals.user = null;
      context.locals.token = null;
    }
    return null;
  }

  const user = await getSessionUser(token);
  if (context.locals) {
    context.locals.user = user;
    context.locals.token = user ? token : null;
  }
  return user;
}

export async function requireAuth(
  context: AuthContext
): Promise<{ user: PublicUser; token: string } | { response: Response }> {
  const user = await getUserFromContext(context);
  const token =
    context.locals?.token || context.cookies.get(SESSION_COOKIE_NAME)?.value || '';

  if (!user || !token) {
    return {
      response: jsonResponse(
        {
          ok: false,
          error: 'unauthorized',
          message: '请先登录',
        },
        401
      ),
    };
  }

  return { user, token };
}

export async function requireDeviceAccess(
  context: AuthContext,
  rawDeviceId: string
): Promise<
  | {
      user: PublicUser;
      token: string;
      deviceId: string;
      binding: DeviceBinding;
      snapshot: UserDeviceSnapshot;
    }
  | { response: Response }
> {
  const auth = await requireAuth(context);
  if ('response' in auth) {
    return auth;
  }

  const deviceId = normalizeDeviceId(rawDeviceId);
  if (!deviceId) {
    return {
      response: jsonResponse(
        {
          ok: false,
          error: 'forbidden',
          message: '无权访问或操作该设备',
        },
        403
      ),
    };
  }

  const snapshot = await fetchUserDeviceSnapshot(auth.token, deviceId);
  if (!snapshot) {
    return {
      response: jsonResponse(
        {
          ok: false,
          error: 'forbidden',
          message: '无权访问或操作该设备',
        },
        403
      ),
    };
  }

  return {
    user: auth.user,
    token: auth.token,
    deviceId,
    binding: snapshot.binding,
    snapshot,
  };
}
