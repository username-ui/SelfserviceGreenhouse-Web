import type { APIRoute } from 'astro';
import type { DeviceBinding } from '../../../../types/greenhouse';
import { jsonResponse, requireDeviceAccess } from '../../../../lib/auth';
import { unbindDevice, updateDeviceBinding } from '../../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const access = await requireDeviceAccess(context, context.params.deviceId ?? '');
  if ('response' in access) {
    return access.response;
  }

  return jsonResponse({ ok: true, data: access.snapshot }, 200);
};

export const PATCH: APIRoute = async (context) => {
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
  const rawCropType =
    payload.cropType !== undefined ? payload.cropType : payload.crop_type;

  const patch: Partial<Pick<DeviceBinding, 'name' | 'location' | 'cropType' | 'notes'>> = {};
  const candidateFields: Array<
    ['name' | 'location' | 'cropType' | 'notes', unknown]
  > = [
    ['name', payload.name],
    ['location', payload.location],
    ['cropType', rawCropType],
    ['notes', payload.notes],
  ];

  for (const [key, val] of candidateFields) {
    if (val === undefined) continue;
    if (typeof val !== 'string') {
      return jsonResponse(
        {
          ok: false,
          error: 'invalid_payload',
          message: `字段 ${key} 须为字符串`,
        },
        400
      );
    }
    patch[key] = val;
  }

  if (Object.keys(patch).length === 0) {
    return jsonResponse(
      {
        ok: false,
        error: 'empty_patch',
        message: '请至少提供一个可更新的字段 (name, location, cropType, notes)',
      },
      400
    );
  }

  const updated = await updateDeviceBinding(
    access.token,
    access.deviceId,
    patch
  );

  if (!updated) {
    return jsonResponse(
      { ok: false, error: 'not_found', message: '设备绑定记录不存在或更新失败' },
      404
    );
  }

  return jsonResponse({ ok: true, data: updated }, 200);
};

export const DELETE: APIRoute = async (context) => {
  const access = await requireDeviceAccess(context, context.params.deviceId ?? '');
  if ('response' in access) {
    return access.response;
  }

  const removed = await unbindDevice(access.token, access.deviceId);
  if (!removed) {
    return jsonResponse(
      { ok: false, error: 'not_found', message: '设备绑定记录不存在' },
      404
    );
  }

  return jsonResponse(
    {
      ok: true,
      data: {
        deviceId: access.deviceId,
        unbound: true,
      },
    },
    200
  );
};
