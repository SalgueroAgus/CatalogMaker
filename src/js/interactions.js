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
