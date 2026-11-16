import type { APIRoute } from 'astro';
import { jsonResponse, requireDeviceAccess } from '../../../../lib/auth';
import { fetchDeviceConfig, updateDeviceConfig } from '../../../../lib/backend';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const access = await requireDeviceAccess(context, context.params.deviceId ?? '');
  if ('response' in access) {
    return access.response;
  }

  const config = await fetchDeviceConfig(access.deviceId);
  return jsonResponse({ ok: true, data: config }, 200);
};

const handleUpdateConfig: APIRoute = async (context) => {
  const access = await requireDeviceAccess(context, context.params.deviceId ?? '');
  if ('response' in access) {
    return access.response;
  }

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
  const queryUnit = context.url.searchParams.get('unit');
  const bodyUnit = payload.unit;

  if (queryUnit === null && bodyUnit !== undefined && typeof bodyUnit !== 'string') {
    return jsonResponse(
      {
        ok: false,
        error: 'invalid_unit',
        message: "unit 参数仅支持 'human' 或 'raw'",
      },
      400
    );
  }

  const rawUnit =
    queryUnit !== null
      ? queryUnit
      : typeof bodyUnit === 'string'
        ? bodyUnit
        : undefined;

  let unit: 'human' | 'raw' = 'human';
  if (rawUnit !== undefined && rawUnit.trim() !== '') {
    const normalizedUnit = rawUnit.trim().toLowerCase();
    if (normalizedUnit !== 'human' && normalizedUnit !== 'raw') {
      return jsonResponse(
        {
          ok: false,
          error: 'invalid_unit',
          message: "unit 参数仅支持 'human' 或 'raw'",
        },
        400
      );
    }
    unit = normalizedUnit;
  }

  const { unit: _ignoredUnit, ...patch } = payload;
  const result = await updateDeviceConfig(access.deviceId, patch, unit);

  if (!result.ok) {
    return jsonResponse(
      {
        ok: false,
        error: result.error,
        message: result.message,
        ...(result.details ? { details: result.details } : {}),
        ...(result.reason ? { reason: result.reason } : {}),
      },
      result.status
    );
  }

  return jsonResponse(
    {
      ok: true,
      data: result.data,
      simulatedAck: result.simulatedAck,
      message: result.message,
    },
    200
  );
};

export const PATCH = handleUpdateConfig;
export const PUT = handleUpdateConfig;
export const POST = handleUpdateConfig;
