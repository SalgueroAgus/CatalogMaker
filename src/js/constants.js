const SYSTEM_FONTS = [
    { name: 'Arial',           stack: 'Arial, Helvetica, sans-serif' },
    { name: 'Helvetica Neue',  stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
    { name: 'Verdana',         stack: 'Verdana, Geneva, sans-serif' },
    { name: 'Tahoma',          stack: 'Tahoma, Geneva, sans-serif' },
    { name: 'Trebuchet MS',    stack: '"Trebuchet MS", Helvetica, sans-serif' },
    { name: 'Georgia',         stack: 'Georgia, "Times New Roman", serif' },
    { name: 'Times New Roman', stack: '"Times New Roman", Times, serif' },
    { name: 'Palatino',        stack: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    { name: 'Garamond',        stack: 'Garamond, "Times New Roman", serif' },
    { name: 'Courier New',     stack: '"Courier New", Courier, monospace' },
    { name: 'Lucida Sans',     stack: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
    { name: 'Futura',          stack: 'Futura, "Trebuchet MS", sans-serif' },
    { name: 'System UI',       stack: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
];

const PLACEHOLDER_IMG = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<rect fill="#f1f5f9" width="400" height="300" rx="8"/>' +
    '<text fill="#94a3b8" font-family="Arial" font-size="36" text-anchor="middle" x="200" y="140">📷</text>' +
    '<text fill="#94a3b8" font-family="Arial" font-size="12" text-anchor="middle" x="200" y="172">Agregar imagen</text></svg>'
);
