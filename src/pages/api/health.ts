import type { APIRoute } from 'astro';
import { jsonResponse } from '../../lib/auth';
import { fetchBackendHealth } from '../../lib/backend';

export const prerender = false;

export const GET: APIRoute = async () => {
  const health = await fetchBackendHealth();
  return jsonResponse(health, 200);
};
