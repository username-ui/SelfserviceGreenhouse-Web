import type { APIRoute } from 'astro';
import {
  SESSION_COOKIE_NAME,
  jsonResponse,
  setSessionCookie,
} from '../../../lib/auth';
import { deleteSession, loginWithBackend } from '../../../lib/store';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(
      { ok: false, error: 'invalid_json', message: '请求体必须为合法的 JSON 对象' },
      400
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse(
      { ok: false, error: 'invalid_json', message: '请求体必须为 JSON 对象' },
      400
    );
  }

  const payload = body as Record<string, unknown>;
  const username = typeof payload.username === 'string' ? payload.username.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!username || !password) {
    return jsonResponse(
      {
        ok: false,
        error: 'missing_credentials',
        message: '请输入用户名和密码',
      },
      400
    );
  }

  const result = await loginWithBackend(username, password);
  if (!result.ok) {
    return jsonResponse(
      {
        ok: false,
        error: result.error,
        message: result.message,
      },
      result.status
    );
  }

  const oldToken = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (oldToken && oldToken !== result.token) {
    await deleteSession(oldToken);
  }

  setSessionCookie(context.cookies, result.token);
  if (context.locals) {
    context.locals.user = result.user;
    context.locals.token = result.token;
  }

  return jsonResponse({ ok: true, data: { user: result.user } }, 200);
};
