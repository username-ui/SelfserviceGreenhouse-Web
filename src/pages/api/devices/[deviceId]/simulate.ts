import type { APIRoute } from 'astro';
import type { ScenarioType } from '../../../../types/greenhouse';
import { jsonResponse, requireDeviceAccess } from '../../../../lib/auth';
import { triggerDeviceSimulation } from '../../../../lib/backend';

export const prerender = false;

const VALID_SCENARIOS: ReadonlySet<ScenarioType> = new Set<ScenarioType>([
  'normal',
  'hot',
  'dry',
  'water_lack',
  'turntable_failed',
  'water_restored',
  'offline',
]);

export const POST: APIRoute = async (context) => {
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
  const scenarioRaw =
    typeof payload.scenario === 'string' ? payload.scenario.trim() : '';

  if (!VALID_SCENARIOS.has(scenarioRaw as ScenarioType)) {
    return jsonResponse(
      {
        ok: false,
        error: 'invalid_scenario',
        message:
          '无效的模拟工况类型，仅支持: normal, hot, dry, water_lack, turntable_failed, water_restored, offline',
      },
      400
    );
  }

  const result = await triggerDeviceSimulation(
    access.deviceId,
    scenarioRaw as ScenarioType
  );

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

  return jsonResponse({ ok: true, data: result.data }, 200);
};
