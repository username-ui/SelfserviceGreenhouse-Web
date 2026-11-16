import type { APIRoute } from 'astro';
import {
  SESSION_COOKIE_NAME,
  jsonResponse,
  setSessionCookie,
} from '../../../lib/auth';
import { USERNAME_REGEX, deleteSession, registerUser } from '../../../lib/store';

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
  if (typeof payload.username !== 'string' || !USERNAME_REGEX.test(payload.username.trim())) {
    return jsonResponse(
      {
        ok: false,
        error: 'invalid_username',
        message: '用户名须为 3~24 位字母、数字或下划线',
      },
      400
    );
  }

  if (
    typeof payload.password !== 'string' ||
    payload.password.length < 6 ||
    payload.password.length > 128
  ) {
    return jsonResponse(
      {
        ok: false,
        error: 'invalid_password',
        message: '密码长度须为 6~128 个字符',
      },
      400
    );
  }

  let displayName: string | undefined;
  if (payload.displayName !== undefined && payload.displayName !== null) {
    if (typeof payload.displayName !== 'string') {
      return jsonResponse(
        {
          ok: false,
          error: 'invalid_display_name',
          message: '显示名称须为字符串',
        },
        400
      );
    }
    const trimmedName = payload.displayName.trim();
    if (trimmedName.length > 64) {
      return jsonResponse(
        {
          ok: false,
          error: 'invalid_display_name',
          message: '显示名称不能超过 64 个字符',
        },
        400
      );
    }
    displayName = trimmedName || undefined;
  }

  const result = await registerUser({
    username: payload.username.trim(),
    password: payload.password,
    displayName,
  });

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
  if (oldToken) {
    await deleteSession(oldToken);
  }

  setSessionCookie(context.cookies, result.token);
  if (context.locals) {
    context.locals.user = result.user;
    context.locals.token = result.token;
  }

  return jsonResponse({ ok: true, data: { user: result.user } }, 201);
};
