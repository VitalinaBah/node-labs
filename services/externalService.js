import fs from 'node:fs/promises';
import path from 'node:path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'cache', 'reference.json');
const TIMEOUT_MS = 5000;
const RETRY_ATTEMPTS = 3;
const TTL_MS = 120 * 1000;

export const fetchWithTimeout = async (url, options = {}, timeout = TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const fetchWithRetry = async (url, options = {}, attempts = RETRY_ATTEMPTS) => {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(
          `[external] attempt ${attempt + 1} failed (${err.message}), retrying in ${delay}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
};

const readCache = async () => {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeCache = async (payload) => {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
};

export const fetchCourses = async () => {
  const baseUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3001';
  const url = `${baseUrl}/courses`;

  const cache = await readCache();
  if (cache && Date.now() - cache.timestamp < TTL_MS) {
    return { data: cache.data, source: 'cache' };
  }

  try {
    const data = await fetchWithRetry(url);
    await writeCache({ timestamp: Date.now(), data });
    return { data, source: 'live' };
  } catch (err) {
    console.error('[external] fetchCourses failed:', err.message);
    if (cache) {
      console.warn('[external] returning stale cache');
      return { data: cache.data, source: 'stale-cache' };
    }
    return { data: null, source: 'unavailable' };
  }
};

export const findCourseById = async (courseId) => {
  const { data } = await fetchCourses();
  if (!data) return null;
  return data.find((c) => c.id === Number(courseId)) ?? null;
};
