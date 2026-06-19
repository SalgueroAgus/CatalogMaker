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
