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
