const API_BASE = process.env.RUNTIME_SMOKE_API_BASE ?? 'http://127.0.0.1:4000';
const WEB_BASE = process.env.RUNTIME_SMOKE_WEB_BASE ?? 'http://127.0.0.1:3001';

const checks = [
  `${API_BASE}/health/ready`,
  `${API_BASE}/dashboard/realtime`,
  `${API_BASE}/hardware/telemetry`,
  `${API_BASE}/overlay/public-feed`,
  `${WEB_BASE}/dashboard`,
  `${WEB_BASE}/judge`,
  `${WEB_BASE}/hardware-console`,
  `${WEB_BASE}/live`,
];

for (const url of checks) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Runtime smoke failed for ${url} with ${response.status}`);
  }
  console.log(`OK ${response.status} ${url}`);
}
