# CatalogFlow Pro — Roadmap

## What it is today
Offline, browser-only catalog builder: upload images → edit name/price/description → customize brand colors/fonts → export via `window.print()`. Everything lives in memory — no persistence.

---

## Phase 0 — Bug fix first
**PDF on mobile** — `window.print()` is broken or heavily restricted on iOS/Android browsers. The fix is to integrate **jsPDF + html2canvas** to capture the pages as a real PDF client-side instead of relying on the browser's print dialog.

---

## Phase 1 — High Impact (Core gaps)

| Feature | Why it matters |
|---|---|
| **Auto-save to localStorage** | Right now all work is lost on refresh. This is the single biggest risk for users. One `beforeunload` save + restore on load. |
| **Catalog JSON export/import** | Let users save their session as a `.json` file and reload it later. Pairs naturally with auto-save as a "manual backup." |
| **CSV import** | Users managing inventory in Excel/Google Sheets can drop a CSV → name, price, description auto-fill. Huge time saver. |
| **Product duplication** | "Copy" button on a product card. Common workflow: duplicate a product then change the image/price. |

---

## Phase 2 — Layout & UX

| Feature | Why it matters |
|---|---|
| **Layout options per page** | Currently hard-locked at 3/page. A 1-per-page "featured" layout and a 2-per-page option would let users highlight key products. |
| **Image fit toggle** | `object-fit: contain` vs `cover` per product, plus `object-position` (top/center/bottom). Some product photos get cropped badly. |
| **Preset palettes** | 6–8 one-click color+font combos (e.g., "Minimalista", "Lujo", "Vibrante"). Removes the blank-slate paralysis for new users. |
| **Editable "Exclusivo" tag** | The footer tag is hardcoded. Let users type their own tagline there. |
| **Undo/Redo** | A simple action stack. Currently one wrong move (e.g., reset catalog) is unrecoverable. |

---

## Phase 3 — Growth features

| Feature | Why it matters |
|---|---|
| **Section divider pages** | Add a title page between product groups (e.g., "LÍNEA COCINA"). Lets users build multi-section catalogs. |
| **WhatsApp / image share** | Capture a single page as a PNG (html2canvas) and share via `navigator.share` or a WhatsApp link. Fits the Argentine small-business market natively. |
| **SKU / code field** | Optional 4th field per product. Many vendors need this for ordering. |
| **Google Fonts selector** | Fetch the top 50 Google Fonts to replace the system-font-only picker. The app already loads Inter from Google Fonts, so the infrastructure is there. |

---

## Suggested order of attack

1. **Phase 0** — Fix PDF on mobile (jsPDF/html2canvas)
2. **Auto-save + JSON export/import** — Prevents data loss, builds trust
3. **CSV import** — Biggest workflow accelerator
4. **Product duplication + image fit toggle** — High-frequency editing improvements
5. **Preset palettes + editable footer tag** — Polish that makes the app feel complete
6. **Layout options + section dividers** — Unlocks more catalog types
7. **WhatsApp share** — Distribution/growth
