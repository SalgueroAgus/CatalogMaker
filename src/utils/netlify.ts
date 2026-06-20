async function sha1Hex(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const buffer = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function deployToNetlify(
  pat: string,
  siteId: string,
  html: string,
  onProgress: (msg: string) => void,
): Promise<string> {
  const authHeader = { Authorization: `Bearer ${pat}` };

  onProgress('Calculando…');
  const hash = await sha1Hex(html);

  onProgress('Creando deploy…');
  const createRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
    {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: { '/index.html': hash } }),
    },
  );
  if (!createRes.ok) {
    const msg = await createRes.text().catch(() => '');
    throw new Error(`Netlify ${createRes.status}: ${msg}`);
  }
  const deploy = await createRes.json();

  if (deploy.required?.length) {
    onProgress('Subiendo catálogo…');
    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`,
      {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/octet-stream' },
        body: new TextEncoder().encode(html),
      },
    );
    if (!uploadRes.ok) throw new Error(`Upload ${uploadRes.status}`);
  }

  onProgress('Publicando…');
  for (let i = 0; i < 15; i++) {
    await new Promise<void>((r) => setTimeout(r, 2000));
    const statusRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}`,
      { headers: authHeader },
    );
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    if (status.state === 'ready') return status.ssl_url || status.url;
    if (status.state === 'error') throw new Error('Deploy falló en Netlify');
  }

  return deploy.ssl_url || deploy.url || '';
}
