# CatalogMaker — Roadmap

**Needed work, in recommended delivery order.** Reviewed against the working-tree source on **2026-09-12**. All work below is planned, not implemented by this documentation update.

Optional enhancements and deferred experiments live in [IDEAS.md](IDEAS.md). This file covers the agreed family workflow, existing feature requests, correctness fixes, and the supporting work needed to deliver them safely.

## Product direction

A friendly catalog tool for a family business. The primary users are two parents in their mid-50s who find technology difficult. They mostly update one existing catalog and occasionally experiment with another. **Phone and PC are equally important.**

Optimize for completing familiar tasks, knowing work is saved, recovering mistakes, and producing a trustworthy catalog. Keep React, Zustand, IndexedDB, global CSS, and the browser-only app. Performance work should solve a problem seen with the family's actual catalog or devices.

Agreed workflow: open the main catalog → find a product → edit its price, text, or photo → preview → download/share. Experiment through a named copy or a new blank catalog, without opening a separate browser or altering the main catalog. Transfer catalogs between devices using backup files for now.

### Agreed scope and remaining decisions

| Decision | Agreed scope / recommendation | Remaining detail / effect on scope |
|---|---|---|
| Catalog organization — confirmed | One clearly marked **Principal**, plus named independent catalogs under **Mis catálogos**. Support both **Hacer una copia** and **Crear catálogo vacío**. | Detailed entry-screen behavior is a design proposal: open the last-used catalog with its name/status visible and an obvious route back to Principal. Equal-status catalogs are not the selected direction. |
| Moving between phone, PC, and browsers — confirmed | Portable backup-file transfer is sufficient for now; explain that local catalogs belong to this browser. | Automatic sync is deferred. Revisit only if the family workflow changes; the current login does not sync catalog data. |
| Web publishing | Establish whether the family actively uses the web link and who manages it. PDF sharing remains a complete core workflow. | Retaining one-click publishing needs a safe credential model and clear rules for which catalog can replace the public version. See S1–S2. |

Main catalog plus copies/blank catalogs and backup-file transfer are confirmed by the owner. Detailed UI proposals and publishing scope remain to be refined. These planning documents do not authorize feature implementation, new dependencies, or external deployment.

## Delivery order

Work through priorities 1–4 below. Each table retains the UX/UI, data, architecture, and other categories so the order and type of work are both clear. IDs remain stable across both planning files; gaps mean an item moved to Ideas.

| Order | Outcome | Exit condition |
|---|---|---|
| 1 | Trust the existing editor | Confirmed saves survive reload; errors are visible; essential controls work on phone and PC; existing page inconsistencies are fixed. |
| 2 | Protect and separate catalogs | Existing data becomes Principal safely; copies and blank catalogs are independent; backup files transfer a complete catalog to another browser. |
| 3 | Make daily updates and sharing easy | Parents can find, edit, preview, and share the correct catalog without help; import and output behave consistently. |
| 4 | Finish requested appearance controls | Description-box color and placement work across layouts and match exported output; overflow is caught before sharing. |

Priorities express order, not dates. Resolve S1 immediately if a publishing token has been shipped. Publishing decisions do not block unrelated local fixes. Apply the ongoing verification requirements to every priority.

## Priority 1 — Saving reliability and essential usability

Complete persistence/error handling before showing a saved state. Deliver touch/keyboard controls and mobile sizing fixes as small independent changes.

| ID | Category | Work and completion criteria |
|---|---|---|
| D1 | Saving and recovery | **Honest save/load states.** Await writes and show “Guardando…”, “Guardado en este navegador”, or an actionable failure with retry. Gate editing until hydration completes; distinguish an empty catalog from failed loading. A save indicator must cover metadata, photos, and settings and never report success for failed writes. Keep unsaved edits available for retry/export where possible. Test immediate refresh, slow loading, and storage failure. |
| D2 | Saving and recovery | **Separate destructive operations.** Move “Vaciar catálogo” and “Restablecer todo” away from routine export actions. Provide a settings-only reset that actually preserves products; isolate full deletion under clearly named management controls. Existing confirmations should name the action/catalog and its effect. Await completion so a reset followed by adding products cannot race pending cleanup. Do not silently erase photos when merely switching the background control between color and image; make removal explicit. |
| A3 | Architecture and code quality | **Explicit image and write ownership.** Await and handle database operations; keep storage calls in the database module. Revoke obsolete object URLs on delete/reset/switch and dispose unused hydration results. Delete blobs only when no catalog or recovery snapshot owns them. Treat metadata/image operations as one recoverable user action rather than unrelated fire-and-forget writes. |
| A2 | Architecture and code quality | **Safe product identity and mutations.** Replace timestamp-derived IDs in every add/import path with collision-resistant IDs; guard missing IDs in move/reorder/replace actions. Currently `moveProduct` and `reorderProduct` can operate on index `-1`. Define valid fields/limits centrally so import, list editing, and preview editing agree. |
| U2 | UX and accessibility | **Readable, explicit controls.** Use persistent field labels, visible “Cambiar foto” and understandable action names. Aim for 16px editor inputs and roughly 44px primary touch targets as product design targets; adjust with the parents on their devices. Preserve compact A4 typography separately from editor sizing. Associate labels with controls, replace clickable spans with buttons/links, expose selected states, and verify keyboard focus, contrast, and browser zoom. Do not rely on color or hover alone. |
| U3 | UX and accessibility | **Reorder without dragging.** First expose “Subir”/“Bajar” controls using the existing `moveProduct` action, with boundary states and keyboard access. Keep desktop drag available; optional touch drag and longer-distance movement controls live in [IDEAS.md](IDEAS.md). |
| U5 | UX and accessibility | **Mobile viewport and focused editing.** Check keyboard-open, rotation, bottom safe area, and tablet drawer behavior. The current `100vh` declarations override preceding `100dvh` declarations, and the later app-height rule drops the safe-area subtraction. Correct the fallback order and verify actions remain reachable. Offer readable product editing outside the scaled A4 page; preview zoom must not be the only way to edit small text. |
| L1 | Appearance and layout | **Consistent page numbers and backgrounds.** Page-list labels use `i + 2`, assuming one index page; use the actual index-page count so 31+ products agree with preview/export. Apply the configured background image and opacity to index pages as well as product pages (existing request 2). Verify 0/1/30/31/60/61 products and partial last pages. |
| S1 | Publishing safety | **Remove privileged publishing credentials from the browser build.** `usePublish` reads `VITE_NETLIFY_PAT`; Vite bundles `VITE_*` values into client code. Identity login does not secure that token. If a token has been shipped, remove it from builds and revoke/rotate it through the deployment owner. Recommended browser-only option: remove direct deployment and use PDF or an intentional HTML-download/manual-publish workflow. If one-click publishing is essential, agree on an authenticated external publishing service as a separate architecture change. Hiding the button alone is insufficient. |

A3 starts with current save/delete/reset behavior and continues through catalog migration and recovery in priority 2. The publishing credential concern follows the browser implementation and [Vite's environment-variable documentation](https://vite.dev/guide/env-and-mode); no credential values or live deployments were inspected.

The editor sizing in U2 is a usability target, not a compliance claim. Check actual controls, spacing, focus, and labels using the [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Priority 2 — Main catalog, copies, blank catalogs, and portable backups

Design A1 and D3 together. Deliver backup/restore and recovery before enabling destructive catalog-management actions. Keep product images, settings, and page layouts isolated between catalogs.

| ID | Category | Work and completion criteria |
|---|---|---|
| A1 | Architecture and code quality | **Versioned catalog storage and migration.** Introduce stable catalog identity, names/timestamps, active/main references, and catalog-scoped products/settings/background/images through `src/db/index.ts`. Keep existing Zustand stores. Migrate the existing global keys into Principal once, preserving the original records until the new catalog is fully written and verified. Handle interrupted migration and switching during pending writes. A failed copy/restore must not become the active catalog or damage the original. Prefer independent image copies initially; shared-blob deduplication is unnecessary complexity here. |
| D3 | Saving and recovery | **Portable full backup and restore.** One versioned catalog file containing metadata, product images, background, settings, and layouts; no transient blob URLs. Clearly distinguish it from PDF and Excel. Validate the whole file before applying changes; preview catalog name/count and restore as a new catalog by default. Invalid/unsupported files and failed writes leave existing catalogs intact. Verify a full round trip in another browser with no network dependency for the catalog data. |
| D4 | Saving and recovery | **Recovery before broad undo.** Offer undo for a deleted product and a recoverable snapshot before clear, restore-overwrite, or large import. Keep retained snapshots bounded and visible; retain image blobs needed for recovery. Local copies/snapshots share the browser's storage and are not external backups. Add a quiet backup reminder based on meaningful changes and show the last backup date. |
| C1 | Catalog management | **Mis catálogos: Principal + copies.** Create blank, duplicate, rename, open, and delete a catalog. Show name, Principal badge, product count, and last successful save. Keep the list small and plain; no folders, tags, or arbitrary hard limit yet. New copies get a useful editable name. A duplicated catalog includes photos, ordering, branding, background, and layouts. Switching and reloading must preserve each catalog independently. Depends on A1 and D1. |
| C2 | Catalog management | **Make experiments safe.** Show the active catalog name in editing and export. A copy is independent, with no automatic merging back. Recommend an explicit “Usar como principal” action that changes the designation while retaining the previous main catalog. Protect deletion of Principal by requiring a replacement or recovery path; name the affected catalog in confirmation. Publishing from copies requires the S2 decision. |

Verify migration interruption, copy/restore/delete isolation, and edits to the same catalog in two tabs. For simultaneous tabs, detect stale edits and let the user reload or retain a copy; avoid silently overwriting newer work. Automatic cross-device syncing remains deferred by agreement.

## Priority 3 — Everyday editing, import, and dependable output

With storage and catalog identity in place, simplify the existing panels and make routine tasks predictable. S2 applies only if web publishing is retained; its safety requirements are required for that path.

| ID | Category | Work and completion criteria |
|---|---|---|
| U1 | UX and accessibility | **Organize around common tasks.** Put add/search/edit together under Productos, make Preview and Download/Share easy to reach, and move detailed fonts/gradients into optional advanced design controls. Keep existing customization available. Recommend improving the current panels/tabs incrementally; compare a single focused editor with the family before a larger navigation redesign. Empty states offer an action, not just an instruction to upload photos. |
| U4 | UX and accessibility | **Find and navigate predictably.** Search products by name, clear search easily, and show a friendly no-results state. “Ver en catálogo” selects Preview on mobile before scrolling; page-list clicks jump to the correct page. Keep the active item visible when helpful without stealing focus while typing. Preserve position when returning to editing. Add a labeled “Volver al inicio” control that does not cover content. |
| U6 | UX and accessibility | **Friendly feedback and help.** Consistent Spanish terminology (“Producto” rather than alternating with “Artículo”), brief inline errors, and clear import/export completion. Explain where downloaded files go and that login is not cloud backup. Provide a short optional guide for updating a price, replacing a photo, making a copy, and sharing. Prefer observing the parents over adding a mandatory tutorial. |
| A6 | Architecture and code quality | **Controlled navigation and popovers.** Make tab/drawer state drive visibility and cross-panel navigation consistently, with focus restoration and cleanup. Background tabs currently derive their initial selection before async hydration; keep selection consistent with loaded/switched catalogs. Address Escape, focus, naming, and viewport behavior in the color popover. A possible library replacement is tracked in [IDEAS.md](IDEAS.md); accessible behavior is required regardless of implementation. |
| I1 | Photos and Excel | **Safer photo intake.** Check that selected images can be decoded before replacing the existing photo; explain rejected files and preserve the old image on failure. Test actual phone photos, including orientation and formats the family uses. Optional image-size optimization lives in [IDEAS.md](IDEAS.md); preserve print quality. |
| I2 | Photos and Excel | **Clear Excel preview and validation.** Report missing headers, skipped rows, and unmatched/ambiguous images; show sample names/prices before appending. Make “add N products” explicit and retain a recovery path. Test decimal-comma prices, currency text, empty cells, and duplicate names without silently imposing a new price format. Use the same text limits and validation in import and manual editing. |
| E1 | PDF and sharing | **A dependable Download/Share flow.** Identify the active catalog in the filename and completion feedback. Offer clear download/share actions with fallback when file sharing is unavailable; cancellation is not failure. Check output from every mobile tab, current edited values, fonts/background readiness, and repeated export. Protect capture from concurrent edits/catalog switches so one file cannot mix states. |
| E2 | PDF and sharing | **Preview/output fidelity.** Verify text opacity, gradients, photos, long fields, links, and page dimensions against exported output. The capture transform forces opacity to 1 for all elements and then restores only background-image opacity, while preview descriptions use 0.6; narrow that behavior so intentional styling survives. Keep temporary base64 outside state and clean capture resources after success/failure. |
| S2 | Publishing safety | **Make the public version explicit.** All current publishes target one configured site. Show the destination and catalog name, protect the main public version from experimental copies, and record successful publication per catalog. The deploy helper currently returns a URL after polling times out; distinguish “still publishing” from confirmed success and handle retry/errors honestly. Do not expose technical environment-variable errors to parents. |

## Priority 4 — Requested appearance refinements

Retain the earlier visual requests. Confirm the image/description placement with representative photos before implementing L3; check all supported shapes and exported output.

| ID | Category | Work and completion criteria |
|---|---|---|
| L2 | Appearance and layout | **Independent description-box background.** Add a clearly named color setting for the information box, separate from page background, description text, and image background. Preserve old appearance as the migration default. Persist and export it consistently (existing requests 3 and 7). |
| L3 | Appearance and layout | **Description placement beneath the photo.** The information box currently follows a flexible image area, so visible space can remain between a contained image and the box. Preserve the request to align it to the rendered image bottom (request 4); compare a representative portrait and landscape example before implementation. Keep text legible without shrinking the photo excessively or overflowing the page. Test all supported shapes and partial pages. |
| L4 | Appearance and layout | **Overflow and layout-change safeguards.** Long names/prices and 500-character descriptions need checks in dense grids and large font settings; character limits alone do not prove content fits. Warn about clipped content before export and offer a practical correction. Explain that changing products-per-page clears layout overrides; allow recovery. Verify reordering/deleting products has understandable effects on page-based layouts. |

## Supporting architecture, verification, and maintenance — every priority

These requirements accompany the affected work above; they are not a fifth feature phase. Refactor only where needed to keep behavior consistent, and test changes in proportion to their risk.

| ID | Category | Work and completion criteria |
|---|---|---|
| A5 | Architecture and code quality | **Share logic that already diverges.** Centralize page offsets/shape resolution, product validation, and the duplicated PDF/HTML capture setup. Extract UI sections from the large sidebar only as they change. Keep pure domain helpers in `src/utils/`, UI in the existing component layers, and colors/fonts mapped through settings variables. Avoid broad cosmetic cleanup. |
| Q1 | Verification and maintenance | **A small regression safety net.** Keep `npm run verify`. Add focused automated coverage when implementing risky storage migration/restore, image ownership, and pagination changes; choose tooling separately before any dependency installation. No broad coverage target. A successful build does not validate browser interactions or PDF rendering. |
| Q2 | Verification and maintenance | **Test real family tasks on both devices.** Ask each parent to change a price, replace a photo, move a product, make an experiment, return to Principal, recover a mistake, and share the correct catalog. Record where help is needed; prioritize repeated confusion. Use their actual devices and realistic catalog size, plus keyboard-only/zoom checks on PC. No analytics platform needed. |
| Q3 | Verification and maintenance | **Accurate docs and focused dependency upkeep.** Keep README/architecture aligned with shipped capabilities; explain browser-local storage and backup steps in Spanish. Review dependency/security advisories before targeted updates, especially import/export and publishing libraries. Update for a demonstrated fix or maintenance need; no blanket latest-version migration. No dependency vulnerability audit was performed for this roadmap. |

For relevant releases, check refresh/save failures; 0/1/30/31/60/61 products; 1–5-per-page layouts and partial pages; actual phone photos; keyboard-open mobile navigation; and repeated PDF/HTML output after editing. Build checks do not replace these browser scenarios.

## Implementation references

| Area | Source reviewed |
|---|---|
| State, saving, and image ownership | [App](src/App.tsx), [settings subscription](src/main.tsx), [database](src/db/index.ts), [product store](src/store/useProductStore.ts), [settings store](src/store/useSettingsStore.ts) |
| Editing and accessibility | [Sidebar](src/components/organisms/LeftSidebar.tsx), [product list](src/components/molecules/ProductListItem.tsx), [FormField](src/components/molecules/FormField.tsx), [mobile CSS](src/styles/mobile.css), [popover](src/components/atoms/GradientPickerPopover.tsx) |
| Pagination and appearance | [IndexPage](src/components/organisms/IndexPage.tsx), [ProductPage](src/components/organisms/ProductPage.tsx), [page controls](src/components/organisms/PaginasTab.tsx), [product CSS](src/styles/product.css), [pagination helpers](src/utils/chunks.ts) |
| Import and output | [Excel parser](src/utils/excel.ts), [import panel](src/components/molecules/ExcelImportPanel.tsx), [PDF hook](src/hooks/usePDF.ts), [PDF capture](src/utils/pdf.ts), [HTML capture](src/utils/htmlExport.ts), [publishing hook](src/hooks/usePublish.ts), [Netlify requests](src/utils/netlify.ts) |

## Current capabilities — retain and build on

“Implemented” means a code path exists; it does not mean every device or failure case has been validated.

| Capability | Actual behavior and remaining boundary | Source |
|---|---|---|
| Local catalog editing | Photo upload, blank products, inline/list editing, image replacement, delete confirmation, and desktop drag reorder. One global catalog; no catalog manager, search, or undo. | [Product store](src/store/useProductStore.ts), [product list](src/components/molecules/ProductListItem.tsx) |
| Excel row import | First worksheet of `.xlsx`/`.xls`; `Nombre`, `Descripción`, `Precio`; confirmation/errors, header template, optional filename-based image matching. Appends rows; does not update existing products or restore a session. | [Import panel](src/components/molecules/ExcelImportPanel.tsx), [Excel utilities](src/utils/excel.ts) |
| Persistent settings and images | Products, blobs, and settings use IndexedDB. Settings auto-save is wired up. Saving has no completion/error indicator; startup failures go to the console. | [Startup](src/App.tsx), [settings subscription](src/main.tsx), [database](src/db/index.ts) |
| Branding and layouts | Colors, gradients, fonts, sizes, page background, 1–5 products per page, per-page shapes, and a paginated index. | [Settings](src/store/useSettingsStore.ts), [page controls](src/components/organisms/PaginasTab.tsx) |
| PDF and optional web output | A4 image-based PDF with index links, progress, and mobile share support. Export uses temporary base64 maps without changing product image state. HTML publishing exists; its download handler has no visible button. | [PDF hook](src/hooks/usePDF.ts), [publishing hook](src/hooks/usePublish.ts), [capture engine](src/utils/pdf.ts) |
| Responsive navigation and UI primitives | Desktop sidebars, tablet drawer, mobile Preview/Settings/Products tabs. Sidebar accordions/tabs already use Radix; color popover remains custom. | [App](src/App.tsx), [mobile styles](src/styles/mobile.css), [popover](src/components/atoms/GradientPickerPopover.tsx) |

## Previous requests and planning changes

| Previous item | Current home / decision |
|---|---|
| Excel import (request 1) | Implemented; I2 covers remaining validation. Row export/update is optional in Ideas (I3); full backup/restore is required here (D3). |
| Index background (request 2) | L1, priority 1. |
| Description-box color (requests 3 and 7) | L2, priority 4. |
| Description anchored to photo bottom (request 4) | L3, priority 4. |
| Synchronized scrolling (request 5) | U4, priority 3. Recommend explicit navigation and selective active-item visibility; confirm with the family before replacing the original request. |
| Go-to-top (request 6) | U4, priority 3. |
| Settings persistence and PDF image-state fixes | Already implemented; retain that status. Reliability/output items above address separate remaining issues. |
| Required library swaps and blanket performance work | Implementation choices and measured improvements are in Ideas; usable reorder and accessible popovers remain required here. |
| Product duplication/hiding, broader undo, design presets, image framing, spreadsheet export, write batching | Moved to Ideas with original IDs C3, D5, L5, L6, I3, and A4. |
| “Current sprint” | Replaced with priority order; no sprint dates were agreed. |

## Review boundary

This plan is based on the source review described above. The documentation update changes ROADMAP.md and adds IDEAS.md; no application behavior is changed. Browser automation was unavailable: visual appearance, touch behavior, storage failure scenarios, and exported files were not exercised. Validate proposed features when delivering their priority.
