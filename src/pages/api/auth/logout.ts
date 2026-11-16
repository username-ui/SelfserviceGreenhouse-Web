import type { APIRoute } from 'astro';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  jsonResponse,
} from '../../../lib/auth';
import { deleteSession } from '../../../lib/store';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  let rawBody = '';
  try {
    rawBody = await context.request.text();
  } catch {
    return jsonResponse(
      { ok: false, error: 'invalid_json', message: '请求体读取失败' },
      400
    );
  }

  if (rawBody.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return jsonResponse(
          { ok: false, error: 'invalid_json', message: '请求体必须为 JSON 对象' },
          400
        );
      }
    } catch {
      return jsonResponse(
        { ok: false, error: 'invalid_json', message: 'JSON 格式无效' },
        400
      );
    }
  }

  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSession(token);
  }

  clearSessionCookie(context.cookies);
  if (context.locals) {
    context.locals.user = null;
    context.locals.token = null;
  }

  return jsonResponse({ ok: true }, 200);
};
