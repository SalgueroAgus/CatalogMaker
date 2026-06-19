function updateField(id, field, value, source) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    product[field] = value;

    const wsEl = document.getElementById('ws-' + field + '-' + id);
    if (wsEl && wsEl !== source) wsEl.value = value;

    const rsEl = document.getElementById('rs-' + field + '-' + id);
    if (rsEl && rsEl !== source) rsEl.value = value;

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
    const cellBg = document.getElementById('cell-bg-' + id);
    if (cellBg) cellBg.style.backgroundColor = color;
    const hexLabel = document.getElementById('rs-hex-bg-' + id);
    if (hexLabel) hexLabel.textContent = color;
    const thumbWrap = document.querySelector('#rs-card-' + id + ' .rs-thumb-wrap');
    if (thumbWrap) thumbWrap.style.backgroundColor = color;
}
