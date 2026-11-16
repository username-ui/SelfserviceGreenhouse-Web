import type { APIRoute } from 'astro';
import { jsonResponse, requireDeviceAccess } from '../../../../lib/auth';
import { clearDeviceAlarm, fetchDeviceAlarms } from '../../../../lib/backend';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const access = await requireDeviceAccess(context, context.params.deviceId ?? '');
  if ('response' in access) {
    return access.response;
  }

  const activeOnlyRaw = (context.url.searchParams.get('active_only') ?? '')
    .trim()
    .toLowerCase();
  const activeOnly = activeOnlyRaw === 'true' || activeOnlyRaw === '1';

  const alarms = await fetchDeviceAlarms(access.deviceId, activeOnly);
  return jsonResponse({ ok: true, data: alarms }, 200);
};

const handleClearAlarm: APIRoute = async (context) => {
  const access = await requireDeviceAccess(context, context.params.deviceId ?? '');
  if ('response' in access) {
    return access.response;
  }

  let rawBody = '';
  try {
    rawBody = await context.request.text();
  } catch {
    return jsonResponse(
      { ok: false, error: 'invalid_json', message: '请求体读取失败' },
      400
    );
  }

  let bodyCode: string | undefined;
  if (rawBody.trim().length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return jsonResponse(
        { ok: false, error: 'invalid_json', message: '请求体必须为合法的 JSON 对象' },
        400
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonResponse(
        { ok: false, error: 'invalid_json', message: '请求体必须为 JSON 对象' },
        400
      );
    }

    const payload = parsed as Record<string, unknown>;
    if (payload.code !== undefined) {
      if (typeof payload.code !== 'string') {
        return jsonResponse(
          { ok: false, error: 'invalid_alarm_code', message: '告警代码须为字符串' },
          400
        );
      }
      bodyCode = payload.code;
    }
  }

  const queryCode = context.url.searchParams.get('code') ?? '';
  const code = (bodyCode !== undefined ? bodyCode : queryCode).trim();

  if (!code) {
    return jsonResponse(
      { ok: false, error: 'invalid_alarm_code', message: '请指定要解除的告警代码' },
      400
    );
  }

  const result = await clearDeviceAlarm(access.deviceId, code);
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

  return jsonResponse(
    {
      ok: true,
      data: result.data,
      source: result.source,
      message: result.message,
    },
    200
  );
};

export const POST = handleClearAlarm;
export const DELETE = handleClearAlarm;
