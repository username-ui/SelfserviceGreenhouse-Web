import type { APIRoute } from 'astro';
import { jsonResponse, requireAuth } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if ('response' in auth) {
    return auth.response;
  }

  return jsonResponse({ ok: true, data: { user: auth.user } }, 200);
};
