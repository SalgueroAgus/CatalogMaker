/* ═══════════════════════════════════════════════════════════
   CatalogFlow Pro — Application Logic v2
   3 products per page · Asymmetric grid · Interactive index
   ═══════════════════════════════════════════════════════════ */

// ─── System Fonts ───────────────────────────────────────────
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

// ─── State ──────────────────────────────────────────────────
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

// ─── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    populateFontSelectors();
    bindDropZone();
    renderAll();
});

function populateFontSelectors() {
    ['heading', 'body', 'small'].forEach(type => {
        const sel = document.getElementById('font-' + type);
        SYSTEM_FONTS.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.stack; opt.textContent = f.name; opt.style.fontFamily = f.stack;
            if (f.stack === state.fonts[type]) opt.selected = true;
            sel.appendChild(opt);
        });
    });
}

function bindDropZone() {
    const dz = document.getElementById('drop-zone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); processBulkFiles(Array.from(e.dataTransfer.files)); });
    dz.addEventListener('click', () => document.getElementById('bulk-file-input').click());
}

// ─── Helpers ────────────────────────────────────────────────
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}
function getProductPage(productIndex) { return Math.floor(productIndex / 3) + 2; }
function esc(s) { return !s ? '' : s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ─── Render All ─────────────────────────────────────────────
function renderAll() { renderCatalog(); renderRightSidebar(); }

// ═════════════════════════════════════════════════════════════
// RENDER CATALOG — Index + Product Pages (3 per page)
// ═════════════════════════════════════════════════════════════
function renderCatalog() {
    const container = document.getElementById('catalog-container');
    container.innerHTML = '';
    if (state.products.length === 0) { updatePageCount(); return; }

    // 1. Index page
    container.appendChild(createIndexPage());

    // 2. Product pages (groups of 3)
    const chunks = chunkArray(state.products, 3);
    chunks.forEach((chunk, pageIdx) => {
        container.appendChild(createProductPage(chunk, pageIdx));
    });

    updatePageCount();
    setupScrollSpy();
}

// ─── Index Page ─────────────────────────────────────────────
function createIndexPage() {
    const page = document.createElement('div');
    page.className = 'page-a4';
    page.id = 'index-page';

    let entriesHTML = '';
    state.products.forEach((p, i) => {
        entriesHTML += `
            <a class="idx-entry" href="#cell-${p.id}" onclick="event.preventDefault(); scrollToProduct('${p.id}')">
                <span class="idx-num">${String(i + 1).padStart(2, '0')}</span>
                <span class="idx-name" id="idx-name-${p.id}">${esc(p.name)}</span>
                <span class="idx-leader"></span>
                <span class="idx-page">${String(getProductPage(i)).padStart(2, '0')}</span>
            </a>`;
        if ((i + 1) % 3 === 0 && i < state.products.length - 1) entriesHTML += '<div class="idx-gap"></div>';
    });

    page.innerHTML = `
        <div class="idx-header">
            <h1 class="idx-title store-name">${state.storeName}</h1>
            <div class="idx-divider"></div>
            <h2 class="idx-subtitle">Í N D I C E</h2>
        </div>
        <div class="idx-list">${entriesHTML}</div>
        <div class="page-ftr">
            <span class="footer-contact">${state.footerContact}</span>
            <span class="footer-tag">Exclusivo</span>
        </div>`;
    return page;
}

// ─── Product Page (3 per page, asymmetric) ──────────────────
function createProductPage(products, pageIdx) {
    const page = document.createElement('div');
    page.className = 'page-a4';
    page.style.animationDelay = ((pageIdx + 1) * 0.04) + 's';

    // Determine grid class
    let gridClass = 'grid-single';
    if (products.length === 2) gridClass = 'grid-duo';
    else if (products.length === 3) gridClass = pageIdx % 2 === 0 ? 'grid-trio' : 'grid-trio-alt';

    const displayPage = pageIdx + 2; // Page 1 is index

    let cellsHTML = products.map(p => createCellHTML(p)).join('');

    page.innerHTML = `
        <div class="page-hdr">
            <span class="store-name">${state.storeName}</span>
            <span class="page-num">Pág. ${String(displayPage).padStart(2, '0')}</span>
        </div>
        <div class="product-grid ${gridClass}">${cellsHTML}</div>
        <div class="page-ftr">
            <span class="footer-contact">${state.footerContact}</span>
            <span class="footer-tag">Exclusivo</span>
        </div>`;
    return page;
}

// ─── Product Cell ───────────────────────────────────────────
function createCellHTML(product) {
    return `
        <div class="product-cell" id="cell-${product.id}" data-product-id="${product.id}">
            <div class="cell-img-area" id="cell-bg-${product.id}" style="background-color:${product.bgColor || '#ffffff'}">
                <img src="${product.image}" alt="${esc(product.name)}" id="ws-img-${product.id}" onerror="this.src=PLACEHOLDER_IMG" />
                <label class="cell-img-overlay">
                    🔄 Cambiar
                    <input type="file" accept="image/*" onchange="replaceImage('${product.id}',this)" />
                </label>
            </div>
            <div class="cell-info">
                <div class="cell-info-row">
                    <input type="text" class="cell-name" id="ws-name-${product.id}"
                        value="${esc(product.name)}" oninput="updateField('${product.id}','name',this.value,this)" placeholder="Nombre" />
                    <input type="text" class="cell-price" id="ws-price-${product.id}"
                        value="${esc(product.price)}" oninput="updateField('${product.id}','price',this.value,this)" placeholder="$0" />
                </div>
                <textarea class="cell-desc" id="ws-description-${product.id}" rows="2"
                    oninput="updateField('${product.id}','description',this.value,this)"
                    placeholder="Descripción...">${product.description}</textarea>
            </div>
        </div>`;
}

// ═════════════════════════════════════════════════════════════
// RENDER RIGHT SIDEBAR — Product Cards grouped by page
// ═════════════════════════════════════════════════════════════
function renderRightSidebar() {
    const list = document.getElementById('rs-list');
    const empty = document.getElementById('rs-empty');
    const count = document.getElementById('rs-count');
    list.innerHTML = '';

    if (state.products.length === 0) {
        empty.style.display = 'flex'; list.style.display = 'none';
    } else {
        empty.style.display = 'none'; list.style.display = 'flex';
    }
    count.textContent = state.products.length + ' artículo' + (state.products.length !== 1 ? 's' : '');

    state.products.forEach((product, index) => {
        // Page separator every 3 items
        if (index % 3 === 0) {
            const sep = document.createElement('div');
            sep.className = 'rs-page-sep';
            sep.textContent = 'Página ' + getProductPage(index);
            list.appendChild(sep);
        }

        const card = document.createElement('div');
        card.className = 'rs-card';
        card.id = 'rs-card-' + product.id;
        card.style.animationDelay = (index * 0.025) + 's';
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-id', product.id);
        card.innerHTML = createCardHTML(product, index);

        card.addEventListener('dragstart', e => handleCardDragStart(e, product.id));
        card.addEventListener('dragover', e => handleCardDragOver(e, card));
        card.addEventListener('dragleave', () => clearDragIndicators(card));
        card.addEventListener('drop', e => handleCardDrop(e, product.id));
        card.addEventListener('dragend', handleCardDragEnd);

        list.appendChild(card);
    });
}

function createCardHTML(product, index) {
    const total = state.products.length;
    const bg = product.bgColor || '#ffffff';
    return `
        <div class="rs-card-head">
            <div class="rs-card-left">
                <span class="rs-drag-handle" title="Arrastrar">⠿</span>
                <span class="rs-index" onclick="scrollToProduct('${product.id}')" title="Ir al producto">#${String(index + 1).padStart(2, '0')}</span>
            </div>
            <div class="rs-card-actions">
                ${index > 0 ? `<button class="rs-act-btn" onclick="moveProduct('${product.id}','up')" title="Subir">↑</button>` : ''}
                ${index < total - 1 ? `<button class="rs-act-btn" onclick="moveProduct('${product.id}','down')" title="Bajar">↓</button>` : ''}
                <button class="rs-act-btn rs-act-del" onclick="deleteProduct('${product.id}')" title="Eliminar">✕</button>
            </div>
        </div>
        <div class="rs-card-body">
            <div class="rs-thumb-wrap" style="background-color:${bg}">
                <img src="${product.image}" class="rs-thumb" id="rs-img-${product.id}" onerror="this.src=PLACEHOLDER_IMG" alt="" />
                <label class="rs-thumb-overlay">🔄<input type="file" accept="image/*" onchange="replaceImage('${product.id}',this)" /></label>
            </div>
            <div class="rs-fields">
                <input type="text" class="rs-input rs-input-name" id="rs-name-${product.id}"
                    value="${esc(product.name)}" oninput="updateField('${product.id}','name',this.value,this)" placeholder="Nombre" />
                <input type="text" class="rs-input rs-input-price" id="rs-price-${product.id}"
                    value="${esc(product.price)}" oninput="updateField('${product.id}','price',this.value,this)" placeholder="$0.00" />
                <div class="rs-bg-row">
                    <span class="rs-bg-label">Fondo</span>
                    <input type="color" class="rs-bg-picker" id="rs-bg-${product.id}" value="${bg}"
                        onchange="updateBgColor('${product.id}',this.value)" />
                    <span class="hex-label" id="rs-hex-bg-${product.id}">${bg}</span>
                </div>
            </div>
        </div>
        <button class="rs-desc-toggle" onclick="toggleDesc('${product.id}')">
            <span class="rs-desc-arrow" id="rs-arrow-${product.id}">▸</span> Descripción
        </button>
        <div class="rs-desc-body" id="rs-desc-body-${product.id}">
            <textarea class="rs-desc-textarea" id="rs-description-${product.id}" rows="3"
                oninput="updateField('${product.id}','description',this.value,this)"
                placeholder="Descripción...">${product.description}</textarea>
        </div>`;
}

// ═════════════════════════════════════════════════════════════
// BI-DIRECTIONAL SYNC
// ═════════════════════════════════════════════════════════════
function updateField(id, field, value, source) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    product[field] = value;

    // Sync workspace cell
    const wsEl = document.getElementById('ws-' + field + '-' + id);
    if (wsEl && wsEl !== source) wsEl.value = value;

    // Sync right sidebar
    const rsEl = document.getElementById('rs-' + field + '-' + id);
    if (rsEl && rsEl !== source) rsEl.value = value;

    // Sync index entry name
    if (field === 'name') {
        const idxEl = document.getElementById('idx-name-' + id);
        if (idxEl) idxEl.textContent = value;
    }
}

function replaceImage(id, input) {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    product.image = url;
    const wsImg = document.getElementById('ws-img-' + id);
    const rsImg = document.getElementById('rs-img-' + id);
    if (wsImg) wsImg.src = url;
    if (rsImg) rsImg.src = url;
}

function updateBgColor(id, color) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    product.bgColor = color;
    // Update cell background
    const cellBg = document.getElementById('cell-bg-' + id);
    if (cellBg) cellBg.style.backgroundColor = color;
    // Update hex label
    const hexLabel = document.getElementById('rs-hex-bg-' + id);
    if (hexLabel) hexLabel.textContent = color;
    // Update thumbnail wrap bg
    const thumbWrap = document.querySelector('#rs-card-' + id + ' .rs-thumb-wrap');
    if (thumbWrap) thumbWrap.style.backgroundColor = color;
}

// ═════════════════════════════════════════════════════════════
// PRODUCT OPERATIONS
// ═════════════════════════════════════════════════════════════
function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto del catálogo?')) return;
    state.products = state.products.filter(p => p.id !== id);
    renderAll();
}

function moveProduct(id, direction) {
    const idx = state.products.findIndex(p => p.id === id);
    if (direction === 'up' && idx > 0)
        [state.products[idx], state.products[idx - 1]] = [state.products[idx - 1], state.products[idx]];
    else if (direction === 'down' && idx < state.products.length - 1)
        [state.products[idx], state.products[idx + 1]] = [state.products[idx + 1], state.products[idx]];
    renderAll();
}

// ═════════════════════════════════════════════════════════════
// FILE HANDLING
// ═════════════════════════════════════════════════════════════
function handleBulkUpload(e) { processBulkFiles(Array.from(e.target.files)); e.target.value = ''; }

function processBulkFiles(files) {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (images.length === 0) return;
    images.forEach((file, i) => {
        state.products.push({
            id: String(Date.now() + i),
            name: file.name.substring(0, file.name.lastIndexOf('.')).toUpperCase() || 'NUEVO PRODUCTO',
            price: '$0.00',
            description: 'Descripción del producto.',
            image: URL.createObjectURL(file),
            bgColor: '#ffffff'
        });
    });
    renderAll();
    scrollToLastPage();
}

function addBlankPage() {
    state.products.push({
        id: String(Date.now()),
        name: 'NUEVO ARTÍCULO',
        price: '$0.00',
        description: 'Descripción del producto.',
        image: PLACEHOLDER_IMG,
        bgColor: '#ffffff'
    });
    renderAll();
    scrollToLastPage();
}

function scrollToLastPage() {
    setTimeout(() => {
        const pages = document.querySelectorAll('.page-a4');
        if (pages.length) pages[pages.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
}

// ═════════════════════════════════════════════════════════════
// GLOBAL SETTINGS
// ═════════════════════════════════════════════════════════════
function updateFont(type, stack) {
    state.fonts[type] = stack;
    document.documentElement.style.setProperty('--font-' + type, stack);
}

function updateColor(type, value) {
    state.colors[type] = value;
    document.documentElement.style.setProperty('--page-' + type, value);
    document.getElementById('hex-' + type).textContent = value;
}

function updateGlobalTexts() {
    state.storeName = document.getElementById('input-store-name').value.toUpperCase();
    state.footerContact = document.getElementById('input-contact').value;
    document.querySelectorAll('.store-name').forEach(el => el.textContent = state.storeName);
    document.querySelectorAll('.footer-contact').forEach(el => el.textContent = state.footerContact);
}

function togglePresentation() {
    state.presentationMode = !state.presentationMode;
    document.body.classList.toggle('presentation-mode', state.presentationMode);
    document.getElementById('toggle-presentation').classList.toggle('active', state.presentationMode);
}

// ═════════════════════════════════════════════════════════════
// PDF EXPORT
// ═════════════════════════════════════════════════════════════

function blobUrlToBase64(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = () => resolve(url);
        img.src = url;
    });
}

async function exportToPDF() {
    if (state.products.length === 0) { alert('El catálogo está vacío.'); return; }

    const btn = document.getElementById('btn-export');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Preparando…';
    btn.disabled = true;

    // Blob URLs are session-only and inaccessible to the print renderer.
    // Convert them to base64 directly in the live DOM before printing.
    await Promise.all(state.products.map(async (p) => {
        if (!p.image || p.image.startsWith('data:')) return;
        const b64 = await blobUrlToBase64(p.image);
        p.image = b64;
        const wsImg = document.getElementById('ws-img-' + p.id);
        const rsImg = document.getElementById('rs-img-' + p.id);
        if (wsImg) wsImg.src = b64;
        if (rsImg) rsImg.src = b64;
    }));

    window.print();

    btn.innerHTML = originalHTML;
    btn.disabled = false;
}

// ═════════════════════════════════════════════════════════════
// RIGHT SIDEBAR INTERACTIONS
// ═════════════════════════════════════════════════════════════
function toggleDesc(id) {
    const body = document.getElementById('rs-desc-body-' + id);
    const arrow = document.getElementById('rs-arrow-' + id);
    if (!body || !arrow) return;
    const isOpen = arrow.classList.contains('open');
    body.style.maxHeight = isOpen ? '0' : body.scrollHeight + 'px';
    arrow.classList.toggle('open', !isOpen);
}

function scrollToProduct(id) {
    const cell = document.getElementById('cell-' + id);
    if (cell) cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── Drag & Drop ────────────────────────────────────────────
function handleCardDragStart(e, id) {
    draggedId = id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { const c = document.getElementById('rs-card-' + id); if (c) c.classList.add('dragging'); }, 0);
}
function handleCardDragOver(e, card) {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    clearAllDragIndicators();
    const rect = card.getBoundingClientRect();
    card.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
}
function handleCardDrop(e, targetId) {
    e.preventDefault(); clearAllDragIndicators();
    if (!draggedId || draggedId === targetId) return;
    const fromIdx = state.products.findIndex(p => p.id === draggedId);
    const toCard = document.getElementById('rs-card-' + targetId);
    const rect = toCard.getBoundingClientRect();
    const above = e.clientY < rect.top + rect.height / 2;
    const [moved] = state.products.splice(fromIdx, 1);
    let toIdx = state.products.findIndex(p => p.id === targetId);
    if (!above) toIdx++;
    state.products.splice(toIdx, 0, moved);
    draggedId = null;
    renderAll();
}
function handleCardDragEnd() {
    clearAllDragIndicators();
    document.querySelectorAll('.rs-card.dragging').forEach(el => el.classList.remove('dragging'));
    draggedId = null;
}
function clearDragIndicators(card) { card.classList.remove('drag-over-top', 'drag-over-bottom'); }
function clearAllDragIndicators() { document.querySelectorAll('.drag-over-top,.drag-over-bottom').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom')); }

// ─── Scroll Spy ─────────────────────────────────────────────
function setupScrollSpy() {
    if (scrollObserver) scrollObserver.disconnect();
    const ws = document.getElementById('workspace');
    scrollObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('data-product-id');
            if (!id) return;
            const card = document.getElementById('rs-card-' + id);
            if (card) card.classList.toggle('rs-card-visible', entry.isIntersecting);
        });
    }, { root: ws, threshold: 0.2 });
    document.querySelectorAll('.product-cell[data-product-id]').forEach(cell => scrollObserver.observe(cell));
}

// ─── Utilities ──────────────────────────────────────────────
function resetCatalog() {
    if (state.products.length === 0) return;
    if (!confirm('Se eliminarán todos los productos. ¿Continuar?')) return;
    state.products = [];
    renderAll();
}

function updatePageCount() {
    const badge = document.getElementById('badge-pages');
    const totalPages = state.products.length === 0 ? 0 : Math.ceil(state.products.length / 3) + 1;
    if (badge) badge.textContent = totalPages + ' Página' + (totalPages !== 1 ? 's' : '');
}
