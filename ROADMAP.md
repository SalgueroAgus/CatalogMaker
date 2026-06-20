# CatalogMaker — Roadmap

## What it is today
Offline, browser-only catalog builder: upload images → edit name/price/description → customize brand colors/fonts/gradients → export via jsPDF + html2canvas. Settings auto-saved to localStorage.

---

## Client Requests — Current Sprint

| # | Feature | Notes |
|---|---|---|
| 1 | **Excel import → catalog entries** | Load an `.xlsx` file and auto-create products from it (name, description, price columns). Related to Phase 1 "Catalog excel export/import" — this is the import half. |
| 2 | **Index page ignores background image** | When a bg image is set in settings, the index/TOC page does not apply it. Bug — should match product pages. |
| 3 | **Description box: independent color control** | The description box currently inherits the page color. It needs its own color picker so it can be styled independently of the page background. (Merges requests 3 and 7.) |
| 4 | **Description box: anchor to image bottom** | The overlay/description box should sit flush at the bottom of the product image, not the bottom of the card container. |
| 5 | **Synchronized scroll: right sidebar ↔ PDF workspace** | Both the pages list and items list in the right sidebar should scroll in sync with the PDF preview — scrolling the workspace scrolls the sidebar, and vice versa. |
| 6 | **Go to top button** | A fixed button that scrolls the workspace back to the top of the catalog. |

---

## Improvements — Technical debt & architecture

### Bugs

| Issue | Detail |
|---|---|
| **Settings never persisted to IndexedDB** | `dbSaveSettings` is defined but never called. Every mutation in `useSettingsStore` (colors, fonts, sizes, store name, contact, opacity, items per page, page layouts) updates Zustand only — all lost on page refresh. Each setter needs to call `dbSaveSettings` with the updated state. |
| **PDF export corrupts product image state** | `usePDF.ts` calls `updateField(id, 'image', b64)` to swap blob URLs for base64 before capture. This mutates the store and triggers IDB writes. After export the products still hold base64 strings — the conversion is never reverted. Base64 should be computed into a local `Map` and never written to the store. |

### Library replacements

| Improvement | Why |
|---|---|
| **Replace raw HTML5 DnD with `@dnd-kit/sortable`** | Native DnD is broken on iOS/iPadOS — `dragstart` doesn't fire on touch. `@dnd-kit` is touch-aware, built for React lists, and replaces the manual `draggedIdRef` + `dragOver` state in `ArticulosTab` with `SortableContext` + `useSortable`. |
| **Replace custom accordion/tabs/popover with Radix UI primitives** | Three patterns are hand-rolled: accordion (`openSections` Set in `LeftSidebar`), tabs (`activeTab` in `RightSidebar`), and popover (`GradientPickerPopover` has 40 lines of custom viewport-clipping position logic). Radix `Accordion`, `Tabs`, and `Popover` are unstyled/headless — existing CSS stays intact, but behavior, keyboard nav, and ARIA come for free. |

### Small fixes

| Fix | Detail |
|---|---|
| **Debounce IndexedDB writes on text input** | `updateField` calls `dbSaveProducts()` on every keystroke (name, price, description). A 300ms debounce on the IDB write — while keeping in-memory state synchronous — removes the chatter. |
| **Replace `Date.now()` IDs with `crypto.randomUUID()`** | `String(Date.now() + i)` collides when multiple products are added in the same millisecond. `crypto.randomUUID()` is available in all target browsers. |

---

## Phase 1 — High Impact (Core gaps)

| Feature | Why it matters |
|---|---|
| **Catalog excel export/import** | Save the session as a `.excel` file and reload it later. Pairs with auto-save as a manual backup. |

---

## Phase 2 — Layout & UX

| Feature | Why it matters |
|---|---|
| **Image fit toggle** | `object-fit: contain` vs `cover` per product, plus `object-position`. Some photos get cropped badly. |
| **Editable "Exclusivo" tag/Hide/show fields** | The footer tag is hardcoded. Let users type their own tagline. Add ability to hide/show all possible parts (img bg, desc. box, header, footer, etc)|
| **Undo/Redo** | A simple action stack. Currently one wrong move (e.g., reset catalog) is unrecoverable. |
| **Section divider pages** | Title page between product groups (e.g., "LÍNEA COCINA"). Lets users build multi-section catalogs. |

