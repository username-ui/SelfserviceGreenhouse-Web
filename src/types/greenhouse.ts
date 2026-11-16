export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface DeviceBinding {
  deviceId: string;
  userId: string;
  name: string;
  location: string;
  cropType: string;
  notes: string;
  boundAt: string;
  updatedAt: string;
}

export interface DeviceStatus {
  device_id: string;
  online: boolean;
  up: number | null;
  offline_reason: string | null;
  updated_at: string;
  updated_at_ms: number;
}

export interface TelemetryData {
  device_id: string;
  v: number;
  seq: number;
  up: number;
  temperature: number;
  air_humidity: number;
  soil_humidity: number;
  lux: number;
  water: 0 | 1;
  water_sufficient: boolean;
  fan: 0 | 1;
  fan_on: boolean;
  light: 0 | 1;
  light_on: boolean;
  heat: 0 | 1;
  heat_on: boolean;
  received_at: string;
  received_at_ms: number;
  raw?: Record<string, number>;
}

export interface AlarmItem {
  device_id: string;
  code: string;
  active: boolean;
  v?: number | null;
  up?: number | null;
  clear_reason: string | null;
  cleared_at: string | null;
  cleared_at_ms: number | null;
  received_at: string;
  received_at_ms: number;
  updated_at: string;
  updated_at_ms: number;
}

export interface DeviceConfig {
  device_id: string;
  raw: Record<string, number>;
  human: Record<string, number>;
  updated_at: string | null;
  updated_at_ms: number | null;
}

export interface MetricStats {
  min: number | null;
  max: number | null;
  avg: number | null;
}

export interface TelemetryStats {
  device_id: string;
  count: number;
  temperature: MetricStats;
  air_humidity: MetricStats;
  soil_humidity: MetricStats;
  lux: MetricStats;
}

export interface TelemetryHistoryResponse {
  device_id: string;
  total: number;
  limit: number;
  offset: number;
  order: 'asc' | 'desc';
  items: TelemetryData[];
  stats: TelemetryStats;
}

export interface UserDeviceSnapshot {
  binding: DeviceBinding;
  device_id: string;
  simulated?: boolean;
  online: boolean;
  status: DeviceStatus | null;
  latest_telemetry: TelemetryData | null;
  active_alarms: AlarmItem[];
  active_alarm_count: number;
  all_alarms: AlarmItem[];
  config: DeviceConfig;
  last_seen_at: string | null;
  last_seen_at_ms: number | null;
  source: 'backend' | 'hybrid' | 'local';
}

export type ScenarioType =
  | 'normal'
  | 'hot'
  | 'dry'
  | 'water_lack'
  | 'turntable_failed'
  | 'water_restored'
  | 'offline';

export interface BackendMqttStatus {
  connected: boolean;
  available?: boolean;
  host?: string;
  port?: number;
  client_id?: string;
  reconnect_attempts?: number;
}

export interface BackendHealth {
  ok: boolean;
  backendReachable: boolean;
  status: 'healthy' | 'degraded' | 'local_fallback';
  mode: 'backend_mqtt' | 'backend_no_mqtt' | 'local_simulation';
  mqtt: BackendMqttStatus;
  device_count: number;
  timestamp: string;
  backendUrl: string;
  message?: string;
}

export type ConfigFieldKey =
  | 'tMin'
  | 'tMax'
  | 'tHys'
  | 'ahMin'
  | 'ahMax'
  | 'ahHys'
  | 'shMin'
  | 'shMax'
  | 'luxMin'
  | 'luxMax'
  | 'luxOnMs'
  | 'dayStartMs'
  | 'dayLenMs'
  | 'pumpMs'
  | 'pumpIntervalMs'
  | 'pumpMaxPerDay'
  | 'sampleMs'
  | 'turnPerDay'
  | 'turnMax'
  | 'turnStep'
  | 'turnIntervalMs';

export type ConfigGroupId = 'temperature' | 'humidity' | 'light' | 'irrigation' | 'turntable';

export interface ConfigFieldMeta {
  key: ConfigFieldKey;
  label: string;
  group: ConfigGroupId;
  groupLabel: string;
  unit: string;
  scaled: boolean;
  min: number;
  max: number;
  step: number;
  description: string;
}

export type UpdateConfigResult =
  | {
      ok: true;
      data: DeviceConfig;
      simulatedAck: boolean;
      message: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      message: string;
      details?: string[];
      reason?: string;
    };

export type ClearAlarmResult =
  | {
      ok: true;
      data: AlarmItem;
      source: 'backend' | 'local';
      message: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      message: string;
    };

export type SimulateDeviceResult =
  | {
      ok: true;
      data: UserDeviceSnapshot;
    }
  | {
      ok: false;
      status: number;
      error: string;
      message: string;
    };
