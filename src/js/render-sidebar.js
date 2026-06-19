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
