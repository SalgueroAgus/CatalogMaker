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
