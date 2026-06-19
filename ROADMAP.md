# CatalogFlow Pro — Roadmap

## What it is today
Offline, browser-only catalog builder: upload images → edit name/price/description → customize brand colors/fonts/gradients → export via jsPDF + html2canvas. Settings auto-saved to localStorage.

---

## Done

| Feature | Notes |
|---|---|
| **PDF on mobile** | jsPDF + html2canvas replacing `window.print()`. Works on iOS/Android. |
| **Vite + React + TS migration** | Full rewrite from vanilla JS to Vite/React/TypeScript/Zustand with atomic design structure. |
| **Page background image with opacity control** | Left sidebar "Página" section — Color/Imagen toggle, image upload, opacity slider. Applied globally to all pages. PDF export preserves correct opacity. |
| **Left sidebar accordion + reorganization** | Collapsible sections, order: Catálogo → Marca → Tipografía → Página. Catálogo open by default. Removed Modo Presentación. |
| **Images per page + grid shape** | Right sidebar "Páginas" tab — pill selector for items per page (1–5) + `GridShapePicker` with layout variants per count. Per-page layout overrides stored in settings. CSS grid definitions in `grid-{1-5}.css`. |
| **Auto-save to localStorage** | Zustand `persist` middleware saves settings (store name, contact, colors, fonts, opacity, items per page, page layouts) under `catalogmaker-settings`. CSS vars re-applied on rehydration. Note: products and bg image (object URL) are not persisted. |
| **Gradient color picker (all pickers)** | Replaced all `<input type="color">` with `react-best-gradient-color-picker` via a `GradientPickerPopover` atom. Per-product bg supports full solid + gradient (linear/radial, multi-stop, angle). Page bg also supports gradients. Brand accent/text colors are solid-only. All color values normalized to `rgba()`. Portal-based popover bypasses overflow/transform clipping. Mobile: 36px touch target, `visualViewport` positioning, 70px bottom clearance for nav bar. |
| **Artículos tab card redesign** | 64px thumbnail, SVG 6-dot grip handle with hover pill + "Arrastrar para reordenar" tooltip, removed ↑↓ buttons (drag-only), gradient swatch replaces flat color picker. |
| **Full typography system** | 10 independently configurable text roles across 3 groups — Página (Nombre empresa, Pie de página, Numeración), Artículos (Nombre, Precio, Descripción), Índice (Título, Subtítulo, Entradas, Numeración). Each role has its own font family + size control. Font family and size stored in settings and re-applied on rehydration. Precio split from Encabezados as its own independent role. |
| **Full color system** | 11 independently configurable color roles across 3 collapsible groups — Página (Nombre empresa, Numeración, Separadores, Pie de página), Artículos (Nombre, Precio, Descripción), Índice (Título, Entradas, Números/acentos). Replaces the old 4-key system; previously hardcoded colors (header text, price, footer) are now user-controlled. CSS vars updated throughout. Store migrated to v5. |
| **Description box auto-grow** | Both the catalog card (`cell-desc`) and the sidebar edit field (`rs-desc-textarea`) expand to fit content via `scrollHeight`. 500-char limit enforced on both. Sidebar shows a `{n}/500` counter turning amber at 400+ and red at the limit. PDF export swaps the textarea for a div with `overflow:visible` so html2canvas renders the full text. |
| **Google Fonts** | 39 curated Google Fonts across sans-serif, display serif, bold display, script, and monospace categories. Fonts load on demand via dynamic `<link>` injection when selected. Previously selected Google Fonts are re-loaded on page reload via `loadStoredGoogleFonts` in the rehydration callback. |
| **Typography UI — collapsible roles + grouped sections** | Each typography role is a collapsible card showing font name · size when collapsed. Roles grouped into labeled sub-sections (Página / Artículos / Índice) within the Tipografía accordion. |
| **Left sidebar overflow scroll fix** | Sidebar content area is a dedicated scroll container (`flex: 1; overflow-y: auto; min-height: 0`) with `flex-shrink: 0` on all children to prevent flex compression. Export button is a sticky footer outside the scroll area, always visible. |

---

## Client Requests — Current Sprint

| Feature | Notes |
|---|---|
| **Persistence on images, settings, names, descriptions, etc** | Products (images, names, prices, descriptions) are lost on page reload. Needs IndexedDB or similar since object URLs can't be serialized. |

---

## Phase 1 — High Impact (Core gaps)

| Feature | Why it matters |
|---|---|
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

---

## Suggested order of attack

1. **Client requests** — Description auto-grow, product persistence
2. **JSON export/import** — Prevents data loss, builds trust
3. **CSV import** — Biggest workflow accelerator
4. **Product duplication + image fit toggle** — High-frequency editing improvements
5. **Preset palettes + editable footer tag** — Polish
6. **Layout options + section dividers** — Unlocks more catalog types
7. **WhatsApp share** — Distribution/growth
