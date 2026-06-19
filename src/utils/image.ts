export const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<rect fill="#f1f5f9" width="400" height="300" rx="8"/>' +
    '<text fill="#94a3b8" font-family="Arial" font-size="36" text-anchor="middle" x="200" y="140">📷</text>' +
    '<text fill="#94a3b8" font-family="Arial" font-size="12" text-anchor="middle" x="200" y="172">Agregar imagen</text>' +
    '</svg>'
  );

export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  try {
    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return blobUrl;
  }
}
