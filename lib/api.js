/**
 * Базовый URL API. Задаётся в .env (см. .env.example).
 * Приоритет: NEXT_PUBLIC_API_BASE_URL → NEXT_PUBLIC_BASE_URL_API → NEXT_PUBLIC_API_URL.
 * Префикс NEXT_PUBLIC_ нужен, чтобы значение попало в браузерный бандл.
 *
 * Если в .env указан localhost/127.0.0.1, а страница открыта с другого хоста (телефон по Wi‑Fi:
 * http://192.168.x.x:3000), подставляем hostname страницы — иначе запросы ушли бы на устройство,
 * а не на ПК с API.
 */
function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function resolveBaseUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL_API ||
    process.env.NEXT_PUBLIC_API_URL;
  const portFallback =
    Number(process.env.NEXT_PUBLIC_API_PORT || 8000) || 8000;

  if (fromEnv && String(fromEnv).trim() !== "") {
    let base = String(fromEnv).trim().replace(/\/$/, "");
    if (typeof window !== "undefined") {
      const pageHost = window.location.hostname;
      if (!isLoopbackHost(pageHost)) {
        try {
          const u = new URL(base);
          if (isLoopbackHost(u.hostname)) {
            u.hostname = pageHost;
            base = u.toString().replace(/\/$/, "");
          }
        } catch {
          // ignore invalid URL
        }
      }
    }
    return base;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${portFallback}`;
  }
  return `http://127.0.0.1:${portFallback}`;
}

const base = resolveBaseUrl();

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
  if (typeof window !== "undefined") {
    if (authToken) {
      window.localStorage.setItem("auth_token", authToken);
    } else {
      window.localStorage.removeItem("auth_token");
    }
  }
}

export function loadAuthToken() {
  if (typeof window !== "undefined" && !authToken) {
    authToken = window.localStorage.getItem("auth_token");
  }
  return authToken;
}

function normalizeError(text, fallback) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === "string") return parsed.error;
  } catch {
    // ignore
  }
  return text || fallback;
}

async function request(method, path, body) {
  const token = loadAuthToken();
  const url = `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(normalizeError(text, res.statusText));
  }

  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
