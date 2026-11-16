import type { ConfigFieldKey, ConfigFieldMeta } from '../types/greenhouse';

export const KNOWN_CONFIG_KEYS: readonly ConfigFieldKey[] = [
  'tMin',
  'tMax',
  'tHys',
  'ahMin',
  'ahMax',
  'ahHys',
  'shMin',
  'shMax',
  'luxMin',
  'luxMax',
  'luxOnMs',
  'dayStartMs',
  'dayLenMs',
  'pumpMs',
  'pumpIntervalMs',
  'pumpMaxPerDay',
  'sampleMs',
  'turnPerDay',
  'turnMax',
  'turnStep',
  'turnIntervalMs',
] as const;

export const SCALED_CONFIG_KEYS: ReadonlySet<ConfigFieldKey> = new Set([
  'tMin',
  'tMax',
  'tHys',
  'ahMin',
  'ahMax',
  'ahHys',
  'shMin',
  'shMax',
]);

export const DEFAULT_RAW_CONFIG: Record<ConfigFieldKey, number> = {
  tMin: 1800,
  tMax: 2800,
  tHys: 150,
  ahMin: 5000,
  ahMax: 7800,
  ahHys: 300,
  shMin: 3500,
  shMax: 6500,
  luxMin: 300,
  luxMax: 15000,
  luxOnMs: 1800000,
  dayStartMs: 21600000,
  dayLenMs: 43200000,
  pumpMs: 5000,
  pumpIntervalMs: 300000,
  pumpMaxPerDay: 4,
  sampleMs: 5000,
  turnPerDay: 30,
  turnMax: 180,
  turnStep: 15,
  turnIntervalMs: 30000,
};

export const CONFIG_META: readonly ConfigFieldMeta[] = [
  {
    key: 'tMin',
    label: '温度下限',
    group: 'temperature',
    groupLabel: '温度控制',
    unit: '℃',
    scaled: true,
    min: -10,
    max: 50,
    step: 0.1,
    description: '低于下限（含回滞）启动加热',
  },
  {
    key: 'tMax',
    label: '温度上限',
    group: 'temperature',
    groupLabel: '温度控制',
    unit: '℃',
    scaled: true,
    min: -10,
    max: 50,
    step: 0.1,
    description: '高于上限启动风扇通风降温，须高于温度下限',
  },
  {
    key: 'tHys',
    label: '控温回滞带宽',
    group: 'temperature',
    groupLabel: '温度控制',
    unit: '℃',
    scaled: true,
    min: 0.01,
    max: 60,
    step: 0.1,
    description: '防止温控频繁启停，须大于 0 且小于 (tMax - tMin)',
  },
  {
    key: 'ahMin',
    label: '空气湿度下限',
    group: 'humidity',
    groupLabel: '湿度控制',
    unit: '%RH',
    scaled: true,
    min: 0,
    max: 100,
    step: 0.5,
    description: '空气相对湿度最低阈值',
  },
  {
    key: 'ahMax',
    label: '空气湿度上限',
    group: 'humidity',
    groupLabel: '湿度控制',
    unit: '%RH',
    scaled: true,
    min: 0,
    max: 100,
    step: 0.5,
    description: '高于上限加强换气除湿，须高于空气湿度下限',
  },
  {
    key: 'ahHys',
    label: '湿度回滞带宽',
    group: 'humidity',
    groupLabel: '湿度控制',
    unit: '%RH',
    scaled: true,
    min: 0.01,
    max: 100,
    step: 0.1,
    description: '防止湿控频繁动作，须大于 0 且小于 (ahMax - ahMin)',
  },
  {
    key: 'shMin',
    label: '土壤湿度下限',
    group: 'humidity',
    groupLabel: '湿度控制',
    unit: '%RH',
    scaled: true,
    min: 0,
    max: 100,
    step: 0.5,
    description: '低于此湿度触发自动滴灌条件',
  },
  {
    key: 'shMax',
    label: '土壤湿度上限',
    group: 'humidity',
    groupLabel: '湿度控制',
    unit: '%RH',
    scaled: true,
    min: 0,
    max: 100,
    step: 0.5,
    description: '高于上限停止灌溉，须高于土壤湿度下限',
  },
  {
    key: 'luxMin',
    label: '光照下限',
    group: 'light',
    groupLabel: '光照与昼夜窗口',
    unit: 'lx',
    scaled: false,
    min: 0,
    max: 200000,
    step: 50,
    description: '昼间窗口内低于此值开启补光灯',
  },
  {
    key: 'luxMax',
    label: '光照上限',
    group: 'light',
    groupLabel: '光照与昼夜窗口',
    unit: 'lx',
    scaled: false,
    min: 0,
    max: 200000,
    step: 100,
    description: '高于上限停止补光，须高于光照下限',
  },
  {
    key: 'luxOnMs',
    label: '补光最短点亮时间',
    group: 'light',
    groupLabel: '光照与昼夜窗口',
    unit: 'ms',
    scaled: false,
    min: 0,
    max: 86400000,
    step: 1000,
    description: '每次开启补光灯的最短持续时间（0 ~ 24 小时）',
  },
  {
    key: 'dayStartMs',
    label: '昼夜窗口起点',
    group: 'light',
    groupLabel: '光照与昼夜窗口',
    unit: 'ms',
    scaled: false,
    min: 0,
    max: 86399999,
    step: 60000,
    description: '当天 0 点起算的光周期开始时刻（< 24 小时）',
  },
  {
    key: 'dayLenMs',
    label: '昼夜窗口长度',
    group: 'light',
    groupLabel: '光照与昼夜窗口',
    unit: 'ms',
    scaled: false,
    min: 60000,
    max: 86400000,
    step: 60000,
    description: '每日允许补光的白天时长（1 分钟 ~ 24 小时）',
  },
  {
    key: 'pumpMs',
    label: '单次浇水时长',
    group: 'irrigation',
    groupLabel: '自动灌溉控制',
    unit: 'ms',
    scaled: false,
    min: 1,
    max: 600000,
    step: 500,
    description: '水泵单次开启持续时间（1 ms ~ 10 分钟）',
  },
  {
    key: 'pumpIntervalMs',
    label: '两次浇水最小间隔',
    group: 'irrigation',
    groupLabel: '自动灌溉控制',
    unit: 'ms',
    scaled: false,
    min: 1,
    max: 86400000,
    step: 1000,
    description: '灌溉冷却时间，须 >= 1 且 >= 单次浇水时长',
  },
  {
    key: 'pumpMaxPerDay',
    label: '每日浇水次数上限',
    group: 'irrigation',
    groupLabel: '自动灌溉控制',
    unit: '次',
    scaled: false,
    min: 1,
    max: 12,
    step: 1,
    description: '每日最多自动浇水次数（1 ~ 12 次）',
  },
  {
    key: 'sampleMs',
    label: '传感器采样周期',
    group: 'turntable',
    groupLabel: '转盘与采样',
    unit: 'ms',
    scaled: false,
    min: 10,
    max: 60000,
    step: 100,
    description: '固件采集传感器周期（10 ms ~ 1 分钟）',
  },
  {
    key: 'turnPerDay',
    label: '每日转动角度',
    group: 'turntable',
    groupLabel: '转盘与采样',
    unit: '°',
    scaled: false,
    min: 1,
    max: 180,
    step: 1,
    description: '必须大于 0 且为 180° 的因数（如 15/30/45/60/90/180）',
  },
  {
    key: 'turnMax',
    label: '转盘最大角度',
    group: 'turntable',
    groupLabel: '转盘与采样',
    unit: '°',
    scaled: false,
    min: 0,
    max: 180,
    step: 1,
    description: '转盘允许转动的最大总角度（0 ~ 180°）',
  },
  {
    key: 'turnStep',
    label: '转盘单步角度',
    group: 'turntable',
    groupLabel: '转盘与采样',
    unit: '°',
    scaled: false,
    min: 1,
    max: 180,
    step: 1,
    description: '每次步进角度（1 ~ 180°，且 <= 转盘最大角度）',
  },
  {
    key: 'turnIntervalMs',
    label: '转盘转动间隔',
    group: 'turntable',
    groupLabel: '转盘与采样',
    unit: 'ms',
    scaled: false,
    min: 1000,
    max: 86400000,
    step: 1000,
    description: '两次步进转动之间的最小间隔（>= 1000 ms）',
  },
] as const;

const KNOWN_KEY_SET: ReadonlySet<string> = new Set<string>(KNOWN_CONFIG_KEYS);

const RAW_RANGE_RULES: Record<string, [number, number]> = {
  tMin: [-1000, 5000],
  tMax: [-1000, 5000],
  ahMin: [0, 10000],
  ahMax: [0, 10000],
  shMin: [0, 10000],
  shMax: [0, 10000],
  luxMin: [0, 200000],
  luxMax: [0, 200000],
  luxOnMs: [0, 86400000],
  dayStartMs: [0, 86399999],
  dayLenMs: [60000, 86400000],
  pumpMs: [1, 600000],
  pumpMaxPerDay: [1, 12],
  sampleMs: [10, 60000],
  turnMax: [0, 180],
  turnStep: [1, 180],
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Converts raw wire configuration values (where temperature/humidity are 0.01 scaled integers)
 * to human-readable units.
 */
export function toHumanConfig(raw: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    if (SCALED_CONFIG_KEYS.has(key as ConfigFieldKey)) {
      result[key] = Number((value / 100).toFixed(2));
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Converts human-readable configuration values back to wire integers (0.01 scaled values
 * multiplied by 100 and rounded). Non-numeric values are preserved so validation can report
 * clear errors.
 */
export function fromHumanConfig(human: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(human)) {
    if (SCALED_CONFIG_KEYS.has(key as ConfigFieldKey) && typeof value === 'number' && Number.isFinite(value)) {
      result[key] = Math.round(value * 100);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function normalizeKnownKeys(input: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (KNOWN_KEY_SET.has(key)) {
      normalized[key] = value;
    }
  }
  return normalized;
}

function validateSingleField(key: ConfigFieldKey, val: unknown): string[] {
  if (typeof val !== 'number' || !Number.isInteger(val)) {
    return [`${key} must be an integer (协议整数校验失败)`];
  }

  switch (key) {
    case 'tHys':
      return val > 0 && val <= 6000
        ? []
        : ['tHys must be > 0 and <= 6000 (控温回滞须在 0.01 ~ 60.00 ℃ 之间)'];
    case 'ahHys':
      return val > 0 && val <= 10000
        ? []
        : ['ahHys must be > 0 and <= 10000 (湿度回滞须在 0.01 ~ 100.00 %RH 之间)'];
    case 'pumpIntervalMs':
      return val >= 1 ? [] : ['pumpIntervalMs must be >= 1'];
    case 'turnPerDay':
      return val > 0 && 180 % val === 0
        ? []
        : ['turnPerDay must be > 0 and a divisor of 180 (每日转动角度须为 180° 的正因数)'];
    case 'turnIntervalMs':
      return val >= 1000
        ? []
        : ['turnIntervalMs must be >= 1000 (转盘转动间隔不能小于 1000 ms)'];
    default: {
      const range = RAW_RANGE_RULES[key];
      if (!range) return [];
      const [minVal, maxVal] = range;
      if (val >= minVal && val <= maxVal) {
        return [];
      }
      if (SCALED_CONFIG_KEYS.has(key)) {
        return [
          `${key} must be between ${minVal} and ${maxVal} (即 ${minVal / 100} ~ ${maxVal / 100})`,
        ];
      }
      return [`${key} must be between ${minVal} and ${maxVal}`];
    }
  }
}

function validateCrossFieldRules(merged: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const minMaxPairs: Array<[ConfigFieldKey, ConfigFieldKey]> = [
    ['tMin', 'tMax'],
    ['ahMin', 'ahMax'],
    ['shMin', 'shMax'],
    ['luxMin', 'luxMax'],
  ];

  for (const [minKey, maxKey] of minMaxPairs) {
    const minVal = merged[minKey];
    const maxVal = merged[maxKey];
    if (
      typeof minVal === 'number' &&
      Number.isInteger(minVal) &&
      typeof maxVal === 'number' &&
      Number.isInteger(maxVal) &&
      minVal >= maxVal
    ) {
      errors.push(`${minKey} must be less than ${maxKey} (${minKey} 必须小于 ${maxKey})`);
    }
  }

  const hysTriples: Array<[ConfigFieldKey, ConfigFieldKey, ConfigFieldKey]> = [
    ['tHys', 'tMin', 'tMax'],
    ['ahHys', 'ahMin', 'ahMax'],
  ];

  for (const [hysKey, minKey, maxKey] of hysTriples) {
    const hysVal = merged[hysKey];
    const minVal = merged[minKey];
    const maxVal = merged[maxKey];
    if (
      typeof hysVal === 'number' &&
      Number.isInteger(hysVal) &&
      typeof minVal === 'number' &&
      Number.isInteger(minVal) &&
      typeof maxVal === 'number' &&
      Number.isInteger(maxVal) &&
      hysVal >= maxVal - minVal
    ) {
      errors.push(
        `${hysKey} must be less than (${maxKey} - ${minKey}) (回滞带宽须小于上下限差值)`
      );
    }
  }

  const pumpMs = merged.pumpMs;
  const pumpIntervalMs = merged.pumpIntervalMs;
  if (
    typeof pumpMs === 'number' &&
    Number.isInteger(pumpMs) &&
    typeof pumpIntervalMs === 'number' &&
    Number.isInteger(pumpIntervalMs) &&
    pumpIntervalMs < pumpMs
  ) {
    errors.push('pumpIntervalMs must be >= pumpMs (浇水间隔须大于等于单次浇水时长)');
  }

  const turnStep = merged.turnStep;
  const turnMax = merged.turnMax;
  if (
    typeof turnStep === 'number' &&
    Number.isInteger(turnStep) &&
    typeof turnMax === 'number' &&
    Number.isInteger(turnMax) &&
    turnStep > turnMax
  ) {
    errors.push('turnStep must be <= turnMax (单步转动角度不能超过转盘最大角度)');
  }

  return errors;
}

/**
 * Validates a partial configuration patch using the exact same rules as
 * Elixir's `Greenhouse.ConfigValidator.validate_patch/2`.
 */
export function validateConfigPatch(
  patch: unknown,
  existingRaw: Record<string, number> = {},
  unit: 'raw' | 'human' = 'raw'
): { ok: true; rawPatch: Record<string, number>; humanPatch: Record<string, number> } | { ok: false; errors: string[] } {
  if (!isPlainObject(patch)) {
    return { ok: false, errors: ['Configuration payload must be a JSON object'] };
  }

  const withoutUnitMeta: Record<string, unknown> = { ...patch };
  delete withoutUnitMeta.unit;

  const convertedInput = unit === 'human' ? fromHumanConfig(withoutUnitMeta) : withoutUnitMeta;
  const normalizedPatch = normalizeKnownKeys(convertedInput);

  const patchKeys = Object.keys(normalizedPatch);
  if (patchKeys.length === 0) {
    return { ok: false, errors: ['No valid configuration fields provided'] };
  }

  const normalizedExisting = normalizeKnownKeys(existingRaw);
  const merged: Record<string, unknown> = {
    ...normalizedExisting,
    ...normalizedPatch,
  };

  const fieldErrors: string[] = [];
  for (const key of KNOWN_CONFIG_KEYS) {
    if (Object.prototype.hasOwnProperty.call(normalizedPatch, key)) {
      fieldErrors.push(...validateSingleField(key, normalizedPatch[key]));
    }
  }

  const crossErrors = validateCrossFieldRules(merged);
  const allErrors = [...fieldErrors, ...crossErrors];

  if (allErrors.length > 0) {
    return { ok: false, errors: allErrors };
  }

  const rawPatch: Record<string, number> = {};
  for (const key of patchKeys) {
    rawPatch[key] = normalizedPatch[key] as number;
  }

  return {
    ok: true,
    rawPatch,
    humanPatch: toHumanConfig(rawPatch),
  };
}
