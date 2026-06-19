# CatalogFlow Pro — Roadmap

## What it is today
Offline, browser-only catalog builder: upload images → edit name/price/description → customize brand colors/fonts → export via jsPDF + html2canvas. Everything lives in memory — no persistence.

---

## Done

| Feature | Notes |
|---|---|
| **PDF on mobile** | jsPDF + html2canvas replacing `window.print()`. Works on iOS/Android. |
| **Vite + React + TS migration** | Full rewrite from vanilla JS to Vite/React/TypeScript/Zustand with atomic design structure. |
| **Page background image with opacity control** | Left sidebar "Página" section — Color/Imagen toggle, image upload, opacity slider. Applied globally to all pages. PDF export preserves correct opacity. |
| **Left sidebar accordion + reorganization** | Collapsible sections, order: Catálogo → Marca → Tipografía → Página. Catálogo open by default. Removed Modo Presentación. |

---

## Client Requests — Current Sprint

| Feature | Notes |
|---|---|
| **Images per page + grid shape** | Per-page selector for number of products (1, 2, 3, 4…) and grid layout (e.g. 1-col, 2-col, masonry). |
| **Individual image background: gradient + shape** | Per-product image background should support gradient fills (not just flat color) and different container shapes (square, rounded, circle, etc.). |
| **Typography size controls** | Add size inputs for each text role: *EMPRESA*, *Encabezado*, *Textos pequeños*, and *Párrafos*. Right now only font family is configurable. |
| **Description box auto-grow** | The description field shows a scrollbar inside the catalog view. It should expand to fit its content so the full text is visible without scrolling. |

---

## Phase 1 — High Impact (Core gaps)

| Feature | Why it matters |
|---|---|
| **Auto-save to localStorage** | All work is lost on refresh. One `beforeunload` save + restore on load. |
| **Catalog JSON export/import** | Save the session as a `.json` file and reload it later. Pairs with auto-save as a manual backup. |
| **CSV import** | Drop a CSV → name, price, description auto-fill. Big time saver for users managing inventory in Excel/Sheets. |
| **Product duplication** | "Copy" button on a product card. Common workflow: duplicate then change image/price. |

---

## Phase 2 — Layout & UX

| Feature | Why it matters |
|---|---|
| **Image fit toggle** | `object-fit: contain` vs `cover` per product, plus `object-position`. Some photos get cropped badly. |
| **Preset palettes** | 6–8 one-click color+font combos (e.g., "Minimalista", "Lujo", "Vibrante"). Removes blank-slate paralysis for new users. |
| **Editable "Exclusivo" tag** | The footer tag is hardcoded. Let users type their own tagline. |
| **Undo/Redo** | A simple action stack. Currently one wrong move (e.g., reset catalog) is unrecoverable. |

---

## Phase 3 — Growth features

| Feature | Why it matters |
|---|---|
| **Section divider pages** | Title page between product groups (e.g., "LÍNEA COCINA"). Lets users build multi-section catalogs. |
| **WhatsApp / image share** | Capture a single page as PNG and share via `navigator.share` or a WhatsApp link. Fits the Argentine small-business market. |
| **SKU / code field** | Optional 4th field per product. Many vendors need this for ordering. |
| **Google Fonts selector** | Fetch top 50 Google Fonts. The app already loads Inter from Google Fonts, so the infrastructure is there. |

---

## Suggested order of attack

1. **Client requests** — Description auto-grow, typography sizes, grid options, gradient backgrounds
2. **Auto-save + JSON export/import** — Prevents data loss, builds trust
5. **CSV import** — Biggest workflow accelerator
6. **Product duplication + image fit toggle** — High-frequency editing improvements
7. **Preset palettes + editable footer tag** — Polish
8. **Layout options + section dividers** — Unlocks more catalog types
9. **WhatsApp share** — Distribution/growth
