document.addEventListener('DOMContentLoaded', () => {
    populateFontSelectors();
    bindDropZone();
    renderAll();
    initMobileNav();
    updatePageScale();
    window.addEventListener('resize', updatePageScale);
});

function initMobileNav() {
    switchTab('preview');
}

function switchTab(tab) {
    document.body.classList.remove('tab-preview', 'tab-settings', 'tab-products');
    document.body.classList.add('tab-' + tab);
    document.querySelectorAll('.mnav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    if (tab === 'preview') updatePageScale();
}

function toggleRightSidebar() {
    document.body.classList.toggle('sidebar-right-open');
    const btn = document.getElementById('btn-toggle-right');
    if (btn) btn.textContent = document.body.classList.contains('sidebar-right-open')
        ? '✕ Cerrar'
        : '📋 Productos';
}

function updatePageScale() {
    const w = window.innerWidth;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1200;

    if (!isMobile && !isTablet) {
        document.documentElement.style.removeProperty('--page-scale');
        return;
    }

    const leftSidebarWidth = isMobile ? 0 : 260;
    const workspacePadding = isMobile ? 24 : 40;
    const availableWidth = w - leftSidebarWidth - workspacePadding;
    const A4_PX = 793.7; // 210mm at 96 dpi
    const scale = Math.min(1, availableWidth / A4_PX);

    document.documentElement.style.setProperty('--page-scale', scale.toFixed(4));
}

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
