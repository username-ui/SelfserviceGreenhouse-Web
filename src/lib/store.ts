import type {
  DeviceBinding,
  PublicUser,
  UserDeviceSnapshot,
} from '../types/greenhouse';

export const DEVICE_ID_REGEX = /^[A-Z0-9_-]{2,32}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

const DEFAULT_TIMEOUT_MS = 3000;

export function getBackendUrl(): string {
  return (process.env.BACKEND_URL || 'http://127.0.0.1:4000').replace(/\/+$/, '');
}

export interface FetchJsonResult<T = unknown> {
  reachable: boolean;
  status: number;
  body: T | null;
}

export async function fetchBackendJson<T = unknown>(
  pathname: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<FetchJsonResult<T>> {
  const url = `${getBackendUrl()}${pathname}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    let parsed: T | null = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as T;
      } catch {
        parsed = null;
      }
    }

    return {
      reachable: true,
      status: response.status,
      body: parsed,
    };
  } catch {
    return {
      reachable: false,
      status: 0,
      body: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function isValidDeviceId(deviceId: string): boolean {
  return DEVICE_ID_REGEX.test(deviceId);
}

/**
 * Normalizes a device ID (trim + uppercase) and validates against `^[A-Z0-9_-]{2,32}$`.
 * Returns an empty string if invalid so callers never throw on untrusted URL params.
 */
export function normalizeDeviceId(rawId: string): string {
  const normalized = String(rawId ?? '').trim().toUpperCase();
  return DEVICE_ID_REGEX.test(normalized) ? normalized : '';
}

function authHeaders(token: string, extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    ...(extra ?? {}),
  };
}

export type AuthSessionResult =
  | { ok: true; user: PublicUser; token: string }
  | { ok: false; status: number; error: string; message: string };

export async function loginWithBackend(
  username: string,
  password: string
): Promise<AuthSessionResult> {
  const cleanUsername = String(username ?? '').trim();
  const pwd = String(password ?? '');

  if (!cleanUsername || !pwd) {
    return {
      ok: false,
      status: 400,
      error: 'missing_credentials',
      message: '请输入用户名和密码',
    };
  }

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: { user?: PublicUser; token?: string };
    error?: string;
    message?: string;
  }>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cleanUsername, password: pwd }),
  });

  if (!res.reachable) {
    return {
      ok: false,
      status: 503,
      error: 'backend_unavailable',
      message: '后端服务未连接，请稍后重试',
    };
  }

  if (res.status === 200 && res.body?.ok && res.body.data?.user && res.body.data?.token) {
    return {
      ok: true,
      user: res.body.data.user,
      token: res.body.data.token,
    };
  }

  return {
    ok: false,
    status: res.status || 401,
    error: res.body?.error || 'invalid_credentials',
    message: res.body?.message || '用户名或密码错误',
  };
}

export const loginBackend = loginWithBackend;

export async function registerUser(input: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<AuthSessionResult> {
  const username = String(input.username ?? '').trim();
  const password = String(input.password ?? '');
  const displayName = input.displayName !== undefined ? String(input.displayName).trim() : undefined;

  if (!USERNAME_REGEX.test(username)) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_username',
      message: '用户名须为 3~24 位字母、数字或下划线',
    };
  }

  if (password.length < 6 || password.length > 128) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_password',
      message: '密码长度须为 6~128 个字符',
    };
  }

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: { user?: PublicUser; token?: string };
    error?: string;
    message?: string;
  }>('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      ...(displayName ? { displayName } : {}),
    }),
  });

  if (!res.reachable) {
    return {
      ok: false,
      status: 503,
      error: 'backend_unavailable',
      message: '后端服务未连接，请稍后重试',
    };
  }

  if (
    (res.status === 201 || res.status === 200) &&
    res.body?.ok &&
    res.body.data?.user &&
    res.body.data?.token
  ) {
    return {
      ok: true,
      user: res.body.data.user,
      token: res.body.data.token,
    };
  }

  return {
    ok: false,
    status: res.status || 400,
    error: res.body?.error || 'register_failed',
    message: res.body?.message || '注册失败',
  };
}

export async function getSessionUser(token: string): Promise<PublicUser | null> {
  const cleanToken = String(token ?? '').trim();
  if (!cleanToken) return null;

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: { user?: PublicUser };
  }>('/api/v1/auth/me', {
    method: 'GET',
    headers: authHeaders(cleanToken),
  });

  if (res.reachable && res.status === 200 && res.body?.ok && res.body.data?.user) {
    return res.body.data.user;
  }

  return null;
}

export async function deleteSession(token: string): Promise<void> {
  const cleanToken = String(token ?? '').trim();
  if (!cleanToken) return;

  await fetchBackendJson('/api/v1/auth/logout', {
    method: 'POST',
    headers: authHeaders(cleanToken),
  });
}

export async function listUserBindings(token: string): Promise<DeviceBinding[]> {
  const cleanToken = String(token ?? '').trim();
  if (!cleanToken) return [];

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: UserDeviceSnapshot[];
  }>('/api/v1/user/devices', {
    method: 'GET',
    headers: authHeaders(cleanToken),
  });

  if (res.reachable && res.status === 200 && res.body?.ok && Array.isArray(res.body.data)) {
    return res.body.data.map((snap) => snap.binding);
  }

  return [];
}

export async function getUserBinding(
  token: string,
  deviceId: string
): Promise<DeviceBinding | null> {
  const cleanToken = String(token ?? '').trim();
  const normalized = normalizeDeviceId(deviceId);
  if (!cleanToken || !normalized) return null;

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: UserDeviceSnapshot;
  }>(`/api/v1/user/devices/${encodeURIComponent(normalized)}`, {
    method: 'GET',
    headers: authHeaders(cleanToken),
  });

  if (res.reachable && res.status === 200 && res.body?.ok && res.body.data?.binding) {
    return res.body.data.binding;
  }

  return null;
}

export async function bindDevice(
  token: string,
  input: {
    deviceId: string;
    name?: string;
    location?: string;
    cropType?: string;
    notes?: string;
  }
): Promise<
  | { ok: true; binding: DeviceBinding; snapshot: UserDeviceSnapshot }
  | { ok: false; status: number; error: string; message: string }
> {
  const cleanToken = String(token ?? '').trim();
  if (!cleanToken) {
    return {
      ok: false,
      status: 401,
      error: 'unauthorized',
      message: '请先登录',
    };
  }

  const normalized = normalizeDeviceId(input.deviceId);
  if (!normalized) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_device_id',
      message: '设备 ID 格式无效，须为 2~32 位字母、数字、连字符(-)或下划线(_)',
    };
  }

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: UserDeviceSnapshot;
    error?: string;
    message?: string;
  }>('/api/v1/user/devices', {
    method: 'POST',
    headers: authHeaders(cleanToken, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      deviceId: normalized,
      name: input.name,
      location: input.location,
      cropType: input.cropType,
      notes: input.notes,
    }),
  });

  if (!res.reachable) {
    return {
      ok: false,
      status: 503,
      error: 'backend_unavailable',
      message: '后端服务未连接，无法添加设备',
    };
  }

  if ((res.status === 201 || res.status === 200) && res.body?.ok && res.body.data) {
    return {
      ok: true,
      binding: res.body.data.binding,
      snapshot: res.body.data,
    };
  }

  return {
    ok: false,
    status: res.status || 400,
    error: res.body?.error || 'bind_failed',
    message: res.body?.message || '添加设备失败',
  };
}

export async function updateDeviceBinding(
  token: string,
  deviceId: string,
  patch: Partial<Pick<DeviceBinding, 'name' | 'location' | 'cropType' | 'notes'>>
): Promise<DeviceBinding | null> {
  const cleanToken = String(token ?? '').trim();
  const normalized = normalizeDeviceId(deviceId);
  if (!cleanToken || !normalized) return null;

  const res = await fetchBackendJson<{
    ok?: boolean;
    data?: DeviceBinding;
  }>(`/api/v1/user/devices/${encodeURIComponent(normalized)}`, {
    method: 'PATCH',
    headers: authHeaders(cleanToken, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(patch),
  });

  if (res.reachable && res.status === 200 && res.body?.ok && res.body.data) {
    return res.body.data;
  }

  return null;
}

export async function unbindDevice(token: string, deviceId: string): Promise<boolean> {
  const cleanToken = String(token ?? '').trim();
  const normalized = normalizeDeviceId(deviceId);
  if (!cleanToken || !normalized) return false;

  const res = await fetchBackendJson<{ ok?: boolean }>(
    `/api/v1/user/devices/${encodeURIComponent(normalized)}`,
    {
      method: 'DELETE',
      headers: authHeaders(cleanToken),
    }
  );

  return Boolean(res.reachable && res.status === 200 && res.body?.ok);
}
