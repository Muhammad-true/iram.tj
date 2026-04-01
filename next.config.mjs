/** @type {import('next').NextConfig} */

/**
 * Разрешённые хосты Origin в dev (без порта), если заходите не с localhost, а по IP в LAN.
 * Убирает предупреждение Next: «Cross origin request detected from … to /_next/*».
 * Задаётся в .env.local: NEXT_DEV_ALLOWED_ORIGINS=192.168.1.100,192.168.1.5
 * (те же IP, что в URL http://IP:3000, через запятую).
 */
const fromEnv =
  process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) ?? [];

const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");

const nextConfig = {
  ...(fromEnv.length > 0 ? { allowedDevOrigins: fromEnv } : {}),
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
