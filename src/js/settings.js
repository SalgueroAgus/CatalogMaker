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
