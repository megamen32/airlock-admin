export async function listServers() {
  const r = await fetch(`${process.env.GPTADMIN_HUB}/servers`);

  if (!r.ok) {
    throw new Error(`servers failed: ${r.status}`);
  }

  return await r.json();
}

export async function execOnServer(server, cmd) {
  const r = await fetch(`${process.env.GPTADMIN_HUB}/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ server, cmd }),
  });

  if (!r.ok) {
    throw new Error(`exec failed: ${r.status}`);
  }

  return await r.json();
}
