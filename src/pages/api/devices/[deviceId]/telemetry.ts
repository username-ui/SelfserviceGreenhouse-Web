import type { APIRoute } from 'astro';
import { jsonResponse, requireDeviceAccess } from '../../../../lib/auth';
import { fetchDeviceHistory } from '../../../../lib/backend';

export const prerender = false;

function parseOptionalInt(raw: string | null, min: number): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : undefined;
}

export const GET: APIRoute = async (context) => {
  const access = await requireDeviceAccess(context, context.params.deviceId ?? '');
  if ('response' in access) {
    return access.response;
  }

  const sp = context.url.searchParams;
  const from = sp.get('from')?.trim() || undefined;
  const to = sp.get('to')?.trim() || undefined;
  const limit = parseOptionalInt(sp.get('limit'), 1);
  const offset = parseOptionalInt(sp.get('offset'), 0);

  const rawOrder = sp.get('order')?.trim().toLowerCase();
  const order: 'asc' | 'desc' | undefined =
    rawOrder === 'asc' ? 'asc' : rawOrder === 'desc' ? 'desc' : undefined;

  const history = await fetchDeviceHistory(access.deviceId, {
    from,
    to,
    limit,
    offset,
    order,
  });

  return jsonResponse({ ok: true, data: history }, 200);
};
