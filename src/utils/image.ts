export const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<rect fill="#f1f5f9" width="400" height="300" rx="8"/>' +
    '<g transform="translate(176,102)" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="0" y="12" width="48" height="36" rx="4"/>' +
    '<path d="M12 12 L16 4 L32 4 L36 12"/>' +
    '<circle cx="24" cy="30" r="8"/>' +
    '</g>' +
    '<text fill="#94a3b8" font-family="Arial" font-size="12" text-anchor="middle" x="200" y="175">Agregar imagen</text>' +
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
