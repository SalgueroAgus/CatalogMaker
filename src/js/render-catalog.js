function renderCatalog() {
    const container = document.getElementById('catalog-container');
    container.innerHTML = '';
    if (state.products.length === 0) { updatePageCount(); return; }

    container.appendChild(createIndexPage());

    const chunks = chunkArray(state.products, 3);
    chunks.forEach((chunk, pageIdx) => {
        container.appendChild(createProductPage(chunk, pageIdx));
    });

    updatePageCount();
    setupScrollSpy();
}

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

function createProductPage(products, pageIdx) {
    const page = document.createElement('div');
    page.className = 'page-a4';
    page.style.animationDelay = ((pageIdx + 1) * 0.04) + 's';

    let gridClass = 'grid-single';
    if (products.length === 2) gridClass = 'grid-duo';
    else if (products.length === 3) gridClass = pageIdx % 2 === 0 ? 'grid-trio' : 'grid-trio-alt';

    const displayPage = pageIdx + 2;
    const cellsHTML = products.map(p => createCellHTML(p)).join('');

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
