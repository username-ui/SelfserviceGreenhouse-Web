import type {
  AlarmItem,
  BackendHealth,
  ClearAlarmResult,
  DeviceConfig,
  ScenarioType,
  SimulateDeviceResult,
  TelemetryHistoryResponse,
  UpdateConfigResult,
  UserDeviceSnapshot,
} from '../types/greenhouse';
import {
  fetchBackendJson,
  getBackendUrl,
  normalizeDeviceId,
} from './store';
import { validateConfigPatch } from './validator';

const CONFIG_PATCH_TIMEOUT_MS = 12000;

interface BackendHealthPayload {
  ok?: boolean;
  status?: string;
  mqtt?: {
    connected?: boolean;
    available?: boolean;
    host?: string;
    port?: number;
    client_id?: string;
    reconnect_attempts?: number;
  };
  device_count?: number;
  timestamp?: string;
}

function emptyTelemetryHistory(
  deviceId: string,
  limit: number,
  offset: number,
  order: 'asc' | 'desc'
): TelemetryHistoryResponse {
  return {
    device_id: deviceId,
    total: 0,
    limit,
    offset,
    order,
    items: [],
    stats: {
      device_id: deviceId,
      count: 0,
      temperature: { min: null, max: null, avg: null },
      air_humidity: { min: null, max: null, avg: null },
      soil_humidity: { min: null, max: null, avg: null },
      lux: { min: null, max: null, avg: null },
    },
  };
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const backendUrl = getBackendUrl();
  const res = await fetchBackendJson<BackendHealthPayload>('/api/v1/health', {}, 2000);

  if (res.reachable && res.status === 200 && res.body) {
    const mqttConnected = Boolean(res.body.mqtt?.connected);
    return {
      ok: true,
      backendReachable: true,
      status: mqttConnected ? 'healthy' : 'degraded',
      mode: mqttConnected ? 'backend_mqtt' : 'backend_no_mqtt',
      mqtt: {
        connected: mqttConnected,
        available: res.body.mqtt?.available,
        host: res.body.mqtt?.host,
        port: res.body.mqtt?.port,
        client_id: res.body.mqtt?.client_id,
        reconnect_attempts: res.body.mqtt?.reconnect_attempts,
      },
      device_count: typeof res.body.device_count === 'number' ? res.body.device_count : 0,
      timestamp: res.body.timestamp || new Date().toISOString(),
      backendUrl,
      message: '系统运行正常',
    };
  }

  return {
    ok: false,
    backendReachable: false,
    status: 'local_fallback',
    mode: 'local_simulation',
    mqtt: {
      connected: false,
      available: false,
    },
    device_count: 0,
    timestamp: new Date().toISOString(),
    backendUrl,
    message: '后端服务未连接',
  };
}

export async function fetchUserDevicesSnapshots(token: string): Promise<UserDeviceSnapshot[]> {
  const cleanToken = String(token ?? '').trim();
  if (!cleanToken) return [];

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: UserDeviceSnapshot[];
  }>('/api/v1/user/devices', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (res.reachable && res.status === 200 && res.body?.ok && Array.isArray(res.body.data)) {
    return res.body.data;
  }

  return [];
}

export async function fetchUserDeviceSnapshot(
  token: string,
  deviceId: string
): Promise<UserDeviceSnapshot | null> {
  const cleanToken = String(token ?? '').trim();
  const normalized = normalizeDeviceId(deviceId);
  if (!cleanToken || !normalized) return null;

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: UserDeviceSnapshot;
  }>(`/api/v1/user/devices/${encodeURIComponent(normalized)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (res.reachable && res.status === 200 && res.body?.ok && res.body.data) {
    return res.body.data;
  }

  return null;
}

export async function fetchDeviceHistory(
  deviceId: string,
  query: {
    from?: string | number;
    to?: string | number;
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
  } = {}
): Promise<TelemetryHistoryResponse> {
  const normalized = normalizeDeviceId(deviceId) || deviceId;
  const limit =
    typeof query.limit === 'number' && Number.isFinite(query.limit) && query.limit >= 1
      ? Math.min(Math.floor(query.limit), 5000)
      : 100;
  const offset =
    typeof query.offset === 'number' && Number.isFinite(query.offset) && query.offset >= 0
      ? Math.floor(query.offset)
      : 0;
  const order: 'asc' | 'desc' = query.order === 'asc' ? 'asc' : 'desc';

  const qs = new URLSearchParams();
  if (query.from !== undefined && query.from !== null && String(query.from).trim() !== '') {
    qs.set('from', String(query.from).trim());
  }
  if (query.to !== undefined && query.to !== null && String(query.to).trim() !== '') {
    qs.set('to', String(query.to).trim());
  }
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  qs.set('order', order);

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: TelemetryHistoryResponse;
  }>(`/api/v1/devices/${encodeURIComponent(normalized)}/telemetry/history?${qs.toString()}`);

  if (res.reachable && res.status === 200 && res.body?.ok && res.body.data) {
    return res.body.data;
  }

  return emptyTelemetryHistory(normalized, limit, offset, order);
}

export async function fetchDeviceAlarms(
  deviceId: string,
  activeOnly = false
): Promise<AlarmItem[]> {
  const normalized = normalizeDeviceId(deviceId) || deviceId;
  const qs = activeOnly ? '?active_only=true' : '';
  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: AlarmItem[];
  }>(`/api/v1/devices/${encodeURIComponent(normalized)}/alarms${qs}`);

  if (res.reachable && res.status === 200 && res.body?.ok && Array.isArray(res.body.data)) {
    return res.body.data;
  }

  return [];
}

export async function clearDeviceAlarm(
  deviceId: string,
  code: string
): Promise<ClearAlarmResult> {
  const normalized = normalizeDeviceId(deviceId) || deviceId;
  const cleanCode = String(code ?? '').trim();
  if (!cleanCode) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_alarm_code',
      message: '请指定要解除的告警代码',
    };
  }

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: AlarmItem;
    error?: string;
    message?: string;
  }>(
    `/api/v1/devices/${encodeURIComponent(normalized)}/alarms/${encodeURIComponent(cleanCode)}/clear`,
    { method: 'POST' }
  );

  if (!res.reachable) {
    return {
      ok: false,
      status: 503,
      error: 'backend_unavailable',
      message: '后端服务未连接，无法解除告警',
    };
  }

  if (res.status === 200 && res.body?.ok && res.body.data) {
    return {
      ok: true,
      data: res.body.data,
      source: 'backend',
      message: '告警已解除',
    };
  }

  return {
    ok: false,
    status: res.status || 404,
    error: res.body?.error || 'not_found',
    message: res.body?.message || '未找到该设备的指定告警记录',
  };
}

export async function fetchDeviceConfig(deviceId: string): Promise<DeviceConfig> {
  const normalized = normalizeDeviceId(deviceId) || deviceId;
  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: DeviceConfig;
  }>(`/api/v1/devices/${encodeURIComponent(normalized)}/config`);

  if (res.reachable && res.status === 200 && res.body?.ok && res.body.data) {
    return res.body.data;
  }

  return {
    device_id: normalized,
    raw: {},
    human: {},
    updated_at: null,
    updated_at_ms: null,
  };
}

export async function updateDeviceConfig(
  deviceId: string,
  patch: Record<string, unknown>,
  unit: 'human' | 'raw' = 'human'
): Promise<UpdateConfigResult> {
  const normalized = normalizeDeviceId(deviceId) || deviceId;
  const currentConfig = await fetchDeviceConfig(normalized);

  const validation = validateConfigPatch(patch, currentConfig.raw ?? {}, unit);
  if (!validation.ok) {
    return {
      ok: false,
      status: 422,
      error: 'validation_failed',
      message: validation.errors.join('；'),
      details: validation.errors,
    };
  }

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: DeviceConfig;
    simulated_ack?: boolean;
    error?: string;
    message?: string;
    details?: string[];
    reason?: string;
  }>(
    `/api/v1/devices/${encodeURIComponent(normalized)}/config?unit=human&cache_fallback=true`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.humanPatch),
    },
    CONFIG_PATCH_TIMEOUT_MS
  );

  if (!res.reachable) {
    return {
      ok: false,
      status: 503,
      error: 'backend_unavailable',
      message: '后端服务未连接，无法保存参数',
    };
  }

  if (res.status === 200 && res.body?.ok && res.body.data) {
    const simulatedAck = Boolean(res.body.simulated_ack);
    return {
      ok: true,
      data: res.body.data,
      simulatedAck,
      message: simulatedAck ? '参数已保存，待设备同步' : '设备参数已生效',
    };
  }

  const errorCode = res.body?.error || 'backend_error';
  const details = res.body?.details;
  const errorMessage =
    res.body?.message ||
    (Array.isArray(details) && details.length > 0
      ? details.join('；')
      : `参数保存失败 (${res.status})`);

  return {
    ok: false,
    status: res.status || 500,
    error: errorCode,
    message: errorMessage,
    details,
    reason: res.body?.reason,
  };
}

export async function triggerDeviceSimulation(
  deviceId: string,
  scenario: ScenarioType
): Promise<SimulateDeviceResult> {
  const normalized = normalizeDeviceId(deviceId) || deviceId;
  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: UserDeviceSnapshot;
    error?: string;
    message?: string;
  }>(`/api/v1/devices/${encodeURIComponent(normalized)}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scenario }),
  });

  if (!res.reachable) {
    return {
      ok: false,
      status: 503,
      error: 'backend_unavailable',
      message: '后端服务未连接，无法触发模拟',
    };
  }

  if (res.status === 200 && res.body?.ok && res.body.data) {
    return {
      ok: true,
      data: res.body.data,
    };
  }

  return {
    ok: false,
    status: res.status || 400,
    error: res.body?.error || 'simulate_failed',
    message: res.body?.message || '触发模拟失败',
  };
}
