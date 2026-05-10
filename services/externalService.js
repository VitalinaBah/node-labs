import { REDIS_KEYS, REDIS_TTL } from '#constants/redisKeys.js';

const TIMEOUT_MS = 5000;
const RETRIES = 3;

export const fetchWithTimeout = async (url, options = {}) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
};

export const fetchWithRetry = async (url, options = {}, log) => {
  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      const delay = 1000 * 2 ** (attempt - 1);
      log?.warn?.(`[external] attempt ${attempt} failed (${err.message}), retrying in ${delay}ms`);
      if (attempt < RETRIES) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
};

export const createExternalService = ({ redis, baseUrl, log }) => {
  const findCourseById = async (id) => {
    const key = REDIS_KEYS.COURSE(id);
    try {
      const cached = await redis.get(key);
      if (cached !== null) return JSON.parse(cached);
    } catch (err) {
      log?.warn?.({ err }, '[external] redis read failed');
    }
    try {
      const res = await fetchWithRetry(`${baseUrl}/courses/${id}`, {}, log);
      const data = await res.json();
      try {
        await redis.set(key, JSON.stringify(data), 'EX', REDIS_TTL.COURSE);
      } catch (err) {
        log?.warn?.({ err }, '[external] redis write failed');
      }
      return data;
    } catch (err) {
      log?.warn?.({ err }, '[external] external API unavailable — graceful degradation');
      return null;
    }
  };

  return { findCourseById };
};
