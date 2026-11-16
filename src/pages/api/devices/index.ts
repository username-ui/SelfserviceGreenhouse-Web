import type { APIRoute } from 'astro';
import { jsonResponse, requireAuth } from '../../../lib/auth';
import { fetchUserDevicesSnapshots } from '../../../lib/backend';
import { bindDevice } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if ('response' in auth) {
    return auth.response;
  }

  const snapshots = await fetchUserDevicesSnapshots(auth.token);
  return jsonResponse({ ok: true, data: snapshots }, 200);
};

export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if ('response' in auth) {
    return auth.response;
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
  const rawDeviceId =
    payload.deviceId !== undefined ? payload.deviceId : payload.device_id;

  if (typeof rawDeviceId !== 'string' || !rawDeviceId.trim()) {
    return jsonResponse(
      {
        ok: false,
        error: 'invalid_device_id',
        message: '设备 ID 不能为空，须为 2~32 位字母、数字、连字符(-)或下划线(_)',
      },
      400
    );
  }

  const rawCropType =
    payload.cropType !== undefined ? payload.cropType : payload.crop_type;

  const optionalFields: Array<[string, unknown]> = [
    ['name', payload.name],
    ['location', payload.location],
    ['cropType', rawCropType],
    ['notes', payload.notes],
  ];

  for (const [field, val] of optionalFields) {
    if (val !== undefined && val !== null && typeof val !== 'string') {
      return jsonResponse(
        {
          ok: false,
          error: 'invalid_payload',
          message: `字段 ${field} 须为字符串`,
        },
        400
      );
    }
  }

  const bindResult = await bindDevice(auth.token, {
    deviceId: rawDeviceId,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    location: typeof payload.location === 'string' ? payload.location : undefined,
    cropType: typeof rawCropType === 'string' ? rawCropType : undefined,
    notes: typeof payload.notes === 'string' ? payload.notes : undefined,
  });

  if (!bindResult.ok) {
    return jsonResponse(
      {
        ok: false,
        error: bindResult.error,
        message: bindResult.message,
      },
      bindResult.status
    );
  }

  return jsonResponse({ ok: true, data: bindResult.snapshot }, 201);
};
