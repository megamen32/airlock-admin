
const HUB_URL = process.env.HUB_URL || 'http://127.0.0.1:9001';
const HUB_CTL_TOKEN = process.env.HUB_CTL_TOKEN || process.env.CTL_TOKEN || '';

function hubHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(HUB_CTL_TOKEN
      ? { Authorization: `Bearer ${HUB_CTL_TOKEN}` }
      : {}),
  };
}

export async function listServers() {
  const r = await fetch(`${HUB_URL}/servers`, {
    headers: hubHeaders(),
  });

  if (!r.ok) {
    throw new Error(`hub /servers failed: ${r.status}`);
  }

  const data = await r.json();

  return (data.servers || []).map(s => ({
    name: s.name,
    mgts: (() => {
      try {
        return new URL(s.base_url).hostname;
      } catch {
        return s.base_url;
      }
    })(),
    beeline: s.beeline_ip || null,
    online: Boolean(s.alive),
    mode: s.mode,
    os: s.os,
    lag_s: s.lag_s,
    cores: s.cores,
    mem_mb: s.mem_mb,
    default_user: s.default_user,
  }));
}

export async function execOnServer(server, cmd, timeout=300, cwd=null) {
  const r = await fetch(`${HUB_URL}/bulk/exec`, {
    method: 'POST',
    headers: hubHeaders(),
    body: JSON.stringify({
      servers: [server],
      cmd,
      timeout,
      cwd,
    }),
  });

  if (!r.ok) {
    throw new Error(`hub /bulk/exec failed: ${r.status}`);
  }

  const data = await r.json();
  return data.results?.[server] || data;
}
