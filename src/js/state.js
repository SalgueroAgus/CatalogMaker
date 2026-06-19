let state = {
    products: [],
    storeName: 'CATÁLOGO HOGAR & DECO',
    footerContact: 'Contacto: ventas@tutienda.com | WhatsApp: +54 9 11 2345-6789',
    colors: { bg: '#fafafa', primary: '#4f5e4f', secondary: '#d9c3b0', text: '#374151' },
    fonts: { heading: 'Arial, Helvetica, sans-serif', body: 'Arial, Helvetica, sans-serif', small: 'Arial, Helvetica, sans-serif' },
    presentationMode: false
};
let draggedId = null;
let scrollObserver = null;

function renderAll() { renderCatalog(); renderRightSidebar(); }

function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}
function getProductPage(productIndex) { return Math.floor(productIndex / 3) + 2; }
function esc(s) { return !s ? '' : s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
