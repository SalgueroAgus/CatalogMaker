async function blobUrlToBase64(blobUrl) {
    try {
        const resp = await fetch(blobUrl);
        const blob = await resp.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return blobUrl;
    }
}

// Inject a <style> that disables every animation/transition in a given container.
// Done via stylesheet so it applies even to elements added after injection.
function freezeAnimations(container) {
    const style = document.createElement('style');
    style.textContent = '* { animation: none !important; transition: none !important; opacity: 1 !important; }';
    container.prepend(style);
}

async function exportToPDF() {
    if (state.products.length === 0) { alert('El catálogo está vacío.'); return; }

    const btn = document.getElementById('btn-export');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Preparando…';


    // Convert all blob URLs to base64 via FileReader (reliable, no canvas-taint risk)
    await Promise.all(state.products.map(async (p) => {
        if (!p.image || p.image.startsWith('data:')) return;
        const b64 = await blobUrlToBase64(p.image);
        p.image = b64;
        const wsImg = document.getElementById('ws-img-' + p.id);
        const rsImg = document.getElementById('rs-img-' + p.id);
        if (wsImg) wsImg.src = b64;
        if (rsImg) rsImg.src = b64;
    }));

    // On mobile the workspace tab may be hidden — temporarily force it visible
    // so .page-a4 elements have proper computed layout when cloned.
    const workspace = document.getElementById('workspace');
    const workspacePrevDisplay = workspace ? workspace.style.display : '';
    if (workspace) workspace.style.display = 'flex';

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const A4W = 793.7, A4H = 1122.5;
        const pages = Array.from(document.querySelectorAll('.page-a4'));

        for (let i = 0; i < pages.length; i++) {
            btn.innerHTML = `<span class="spinner"></span> Pág. ${i + 1} / ${pages.length}…`;

            // Sync live input/textarea values → attributes before cloning
            pages[i].querySelectorAll('input').forEach(inp => inp.setAttribute('value', inp.value));
            pages[i].querySelectorAll('textarea').forEach(ta => { ta.textContent = ta.value; });

            // Off-screen container — position:absolute so it doesn't affect the layout
            const wrap = document.createElement('div');
            wrap.style.cssText = [
                'position:absolute', 'top:0', 'left:-9999px',
                `width:${A4W}px`, `height:${A4H}px`,
                'overflow:visible', 'z-index:0',
                'pointer-events:none'
            ].join(';');

            // Inject animation-freeze stylesheet BEFORE the clone is added,
            // so the browser never starts the fadeIn from opacity:0
            freezeAnimations(wrap);

            const clone = pages[i].cloneNode(true);
            clone.style.cssText = [
                `width:${A4W}px`, `height:${A4H}px`,
                'position:relative', 'top:0', 'left:0',
                'margin:0', 'box-shadow:none', 'border-radius:0',
                'zoom:1', 'transform:none',
                'animation:none', 'transition:none', 'opacity:1'
            ].join(';');

            // Patch image sources in the clone
            clone.querySelectorAll('img[id^="ws-img-"]').forEach(img => {
                const pid = img.id.replace('ws-img-', '');
                const product = state.products.find(p => p.id === pid);
                if (product && product.image) img.src = product.image;
            });

            // Remove overlays (position:absolute over images, would tint them)
            clone.querySelectorAll('.cell-img-overlay').forEach(el => el.remove());

            // Replace <input> and <textarea> with <div> — html2canvas clips input text
            // at the element's overflow boundary, chopping letters in half vertically.
            clone.querySelectorAll('input.cell-name, input.cell-price').forEach(input => {
                const div = document.createElement('div');
                div.className = input.className;
                div.textContent = input.getAttribute('value') || '';
                div.style.cssText = 'border:none;outline:none;background:transparent;white-space:nowrap;overflow:hidden;';
                input.parentNode.replaceChild(div, input);
            });
            clone.querySelectorAll('textarea.cell-desc').forEach(ta => {
                const div = document.createElement('div');
                div.className = ta.className;
                div.textContent = ta.textContent || '';
                div.style.cssText = 'border:none;outline:none;background:transparent;overflow:hidden;';
                ta.parentNode.replaceChild(div, ta);
            });

            wrap.appendChild(clone);
            document.body.appendChild(wrap);

            // Let the browser flush layout and decode images
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await Promise.all(
                Array.from(clone.querySelectorAll('img')).map(img =>
                    img.decode ? img.decode().catch(() => {}) : Promise.resolve()
                )
            );

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: state.colors.bg || '#fafafa',
                width: A4W,
                height: A4H,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
            });

            document.body.removeChild(wrap);

            if (i > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);

            // Overlay clickable link annotations on top of the rasterised page
            const pageEl = pages[i];
            const pageRect = pageEl.getBoundingClientRect();
            pageEl.querySelectorAll('a[href]').forEach(anchor => {
                const attrHref = anchor.getAttribute('href');
                if (!attrHref) return;
                const rect = anchor.getBoundingClientRect();
                const x = (rect.left - pageRect.left) / pageRect.width * 210;
                const y = (rect.top  - pageRect.top)  / pageRect.height * 297;
                const w = rect.width  / pageRect.width  * 210;
                const h = rect.height / pageRect.height * 297;
                if (attrHref.startsWith('#')) {
                    const targetEl = document.getElementById(attrHref.slice(1));
                    if (targetEl) {
                        const targetPageIndex = pages.indexOf(targetEl.closest('.page-a4'));
                        if (targetPageIndex !== -1) pdf.link(x, y, w, h, { pageNumber: targetPageIndex + 1 });
                    }
                } else if (anchor.href && anchor.href !== 'javascript:void(0)') {
                    pdf.link(x, y, w, h, { url: anchor.href });
                }
            });
        }

        const filename = (state.storeName || 'catalogo').toLowerCase().replace(/\s+/g, '-') + '.pdf';
        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            // iOS Safari + Chrome, Android Chrome: native share sheet (save to Files, AirDrop, etc.)
            await navigator.share({ files: [file], title: state.storeName || 'Catálogo' });
        } else {
            // Desktop and Android fallback
            pdf.save(filename);
        }
    } catch (err) {
        if (err.name === 'AbortError') return; // user cancelled the share sheet — not an error
        console.error('PDF export error:', err);
        alert('Error al generar el PDF. Intente de nuevo.');
    } finally {
        // Restore workspace visibility (mobile tabs)
        if (workspace) workspace.style.display = workspacePrevDisplay;
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}
