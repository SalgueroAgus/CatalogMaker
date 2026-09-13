# CatalogMaker — Roadmap

**Updated against the working-tree source on September 13, 2026**, including C1/A1/D3 catalog management and backups. Implemented means present in this checkout; it does not imply deployed or validated on every device.

> **Where things stand:** the saving and editor foundations are implemented. Independent catalogs and portable backups are now implemented. The main remaining work is smoother daily use, broader recovery, and the requested appearance controls. Actual-device and parent checks remain open.

- [Delivery order](#delivery-order) — what to tackle next.
- [Completed implementation](#completed-implementation) — finished work, grouped by area.
- [Ongoing checks](#ongoing-checks-and-maintenance) — verification and maintenance.
- [Optional and deferred ideas](#optional-and-deferred-ideas) — possibilities outside the delivery priorities.
- [Evidence and review boundary](#evidence-and-review-boundary) — what the recorded results establish.

Required work, completed implementation, and optional ideas now live in this document. Existing task IDs are retained; partial items below describe the remaining work, with completed portions collected separately.

## Product direction

A friendly catalog tool for a family business, primarily used by two parents in their mid-50s who find technology difficult. **Phone and PC are equally important.**

**Daily workflow:** open the main catalog → find a product → edit price, text, or photo → preview → download/share.

- **Confirmed:** one clearly marked **Principal**, plus named independent catalogs under **Mis catálogos**, with **Hacer una copia** and **Crear catálogo vacío**.
- **Confirmed:** transfer complete catalogs between devices using backup files. Automatic sync is deferred; the current login does not sync catalog data.
- **Implemented:** open the last-used catalog with its name/save status visible and a header selector for Mis catálogos; Principal is listed first. Validate this entry flow with the family.
- **To decide:** whether the family uses web publishing and who manages it. PDF sharing is a complete core workflow; retaining one-click publishing requires the S1/S2 decisions.

Keep React, Zustand, IndexedDB, global CSS, and the browser-only app. Prioritize understandable saving, mistake recovery, and trustworthy output. Performance work should address problems observed with the family's actual catalog or devices.

## Delivery order

1. **Validate the implemented foundations** on the family's devices; fix any observed saving or essential-control failures.
2. **Finish daily editing and sharing:** navigation, help, safer imports, and useful design choices.
3. **Protect and separate catalogs:** safe migration to Principal, independent copies/blank catalogs, backups, and recovery.
4. **Finish appearance refinements:** independent information-box color, photo/text placement, and overflow safeguards.

These are priorities, not dates. Device checks can proceed alongside independent remaining work. Publishing decisions do not block local improvements. This roadmap is a plan, not authorization to implement features, install dependencies, or publish.

## Priority 1 — Saving reliability and essential usability

**Implementation complete for the current single-catalog scope; family/device acceptance remains pending.** D1, D2, A2, U2, U3, U5, L1, and the current-session portion of A3 have moved to [Completed implementation](#completed-implementation). Cross-catalog and recovery ownership remain in priority 3.

- [ ] Check save/retry/reload, photos, and the three management actions on confirmed devices using disposable data.
- [ ] Check real phone keyboards, rotation, safe areas, tablet navigation, and opening the downloaded/shared PDF. Emulated viewports do not establish these behaviors.
- [ ] Have each parent find a product, change five prices, replace a photo, reorder/undo, return from Preview, and recognize the saved state. Include the current compact editor and page thumbnails.
- [ ] Observe legibility and performance with representative phone photos and the family's actual catalog, including the planned 200-photo scenario.

Use the [device checklist](docs/priority1-device-checks.md) and [current editor checks](docs/articles-verification.md#revisión-y-comprobaciones-pendientes). The owner reported exploratory daily use without incidents on an earlier version; the documented per-person/device protocol and assessment of the newer editor are still pending.

## Priority 2 — Everyday editing, import, dependable output, and design choices

Most direct product-editing interactions already exist. Finish the surrounding workflow incrementally; deliver catalog-specific naming, copy help, and publication records with priority 3.

### Navigation and help

- [ ] **U1 · Bring routine tasks together.** Complete the add/search/edit grouping under Productos and make Preview and Download/Share easy to reach. Put detailed fonts/gradients in optional advanced controls while keeping existing customization. Product search, compact editing, expandable details, and an actionable product empty state already exist. Compare a focused editor with the family before a larger navigation redesign.
- [ ] **U4 · Finish page navigation.** Make entries in the Páginas settings list jump to their preview page. Search, “Ver catálogo,” retained editing context, and panel-specific back-to-top controls are implemented. The original synchronized-scrolling request is only partly covered by explicit navigation and visible-product highlighting; confirm the intended behavior with the family before treating it as resolved.
- [ ] **U6 · Finish feedback and optional help.** Standardize “Producto”/“Artículo,” provide clear import/export completion, and explain where files go and that login is not cloud backup. Offer brief guidance for price/photo updates and sharing; add copy/backup guidance when those features exist.
- [ ] **A6 · Finish controlled navigation.** Consolidate React tab/drawer state and body-class visibility, with predictable focus restoration and cleanup. Startup now mounts the editor after hydration, resolving the old background-tab initialization issue. Keep background selection consistent when catalog switching arrives; retain the implemented popover naming, Escape, close/focus, and viewport handling.

### Photos and Excel

- [ ] **I1 · Validate photos before replacement.** Decode selected images before adopting them, explain rejected files, and keep the old image on failure. Current intake checks image MIME types but does not prove a file can be decoded. Exercise actual phone formats/orientation and preserve print quality; resizing/compression remains an [optional optimization](#conditional-technical-ideas).
- [ ] **I2 · Finish import preview and recovery.** Add explicit missing-header/skipped-row diagnostics, sample names/prices, and unmatched/ambiguous image details. Existing import already confirms the row count, counts image matches, and enforces shared description limits with correction fields. Make appending explicit and provide recovery from an accepted import without waiting for D4's broader snapshot system. Cover decimal commas, currency text, empty cells, and duplicate names without silently changing the price format.

### Downloading and publishing

- [ ] **E1 · Finish the Download/Share experience.** Provide clear download/share choices and completion feedback, including file location guidance. Store-name filenames, supported mobile sharing, unsupported-share download fallback, cancellation handling, and capture protection already exist. Active-catalog filenames and protection against switching during export are now implemented with C1/A1; finish actual-device sharing checks.
- [ ] **S2 · Make the public version explicit — conditional on retaining publishing.** Confirm the destination and catalog before publishing, distinguish polling timeout from confirmed success, and give understandable retry/errors. With catalog management, protect the public version from experimental copies and record successful publication per catalog. All current publishes target one configured site; timeout still returns a URL without confirming readiness.


### Design choices

- [ ] **L5 · Offer a few safe presets and useful visibility controls.** Add readable presets, an editable “Exclusivo” footer tag, and price/description/index visibility. Hiding the index must update all page offsets and links. Avoid an initial toggle for every visual element.
- [ ] **L6 · Add per-product image framing.** Offer “Mostrar completa” / “Llenar espacio” plus positioning, indicate cropping when filling, and persist the choice into output. Product-page images and the current compact editor thumbnails already use `contain`; this is a new framing choice, not an established cropping defect.

The specific E2 opacity/capture fixes are [implemented](#pages-appearance-and-output). Continue checking preview/output fidelity whenever layouts, typography, or capture change.

## Priority 3 — Main catalog, copies, blank catalogs, and portable backups

**A1, C1 and D3 implementation delivered in this checkout.** Independent catalogs, migration, portable backups and recoverable catalog deletion are implemented. D4 general recovery and the remaining C2/S2 decisions stay open; cross-engine and family/device acceptance remain pending.

### A1 · Versioned catalog storage and migration

- [x] Introduce stable catalog IDs, names/timestamps, active/main references, and catalog-scoped products, settings, backgrounds, images, and layouts through the existing database module and Zustand stores.
- [x] Migrate the global keys to Principal once; preserve original records until the new catalog is fully written and verified. Handle interrupted migration and switching during pending writes. A failed copy/restore must leave the original and active selection intact.
- [x] Extend **A3 image ownership** across independent catalogs and recoverable catalog deletion. Copies have independent blob records; Eliminados retains them until explicit permanent deletion. Ownership for D4 snapshots remains part of D4.

### D3 · Portable full backup and restore

- [x] Export one versioned catalog file containing metadata, photos, background, settings, and layouts, without transient blob URLs. Clearly distinguish it from PDF and Excel.
- [x] Validate the entire file before applying it, preview its name/count, and restore exclusively as a new secondary catalog. Invalid files and failed writes must preserve existing catalogs.
- [ ] Finish cross-engine/device round-trip acceptance. Automated round trips use separate Chrome browser profiles with external requests blocked and compare metadata plus original image bytes; WebKit remains unavailable locally.

### D4 · Recovery before broad undo

- [ ] Undo a deleted product and keep a recoverable snapshot before clear, restore-overwrite, or large import. Bound retained snapshots, make them visible, and retain their images.
- [ ] Add a quiet backup reminder based on meaningful changes and show the last backup date. Explain that local copies/snapshots share browser storage and are not external backups.

The current reorder modal can undo its latest move during that session. It does not restore deleted products, survive closing the modal, or provide general editing history. Broader undo/redo remains [optional as D5](#catalog-and-editing-conveniences).

### C1 · Mis catálogos: Principal, copies, and blank catalogs

- [x] Create blank, duplicate, rename, open, and delete independent catalogs. Show name, Principal badge, product count, and last successful save; give copies useful editable names.
- [x] Include photos, order, branding, background, and layouts in a copy. Switching/reloading must preserve each catalog independently. Keep the list simple, without folders/tags or an arbitrary hard limit.

Built on A1 and the implemented D1 persistence foundation. The last-used catalog opens at startup; Mis catálogos is available from the header. Blank catalogs use app defaults, and deleted secondary catalogs remain recoverable in Eliminados without automatic expiration. Principal can be renamed but cannot be deleted or reassigned in this delivery.

### C2 · Make experiments safe

- [x] Show the active catalog name during editing and export; copies remain independent with no automatic merge back.
- [ ] Refine the proposed “Usar como principal” action so changing the designation retains the old main catalog. Deleting Principal needs a replacement or recovery path and a confirmation naming the affected catalog.
- [ ] Resolve publication from copies through S2 before enabling that workflow. Publishing currently remains available only from Principal, enforced in both UI and action.

**Automated scenarios (see [catalog verification](docs/catalogs-verification.md)):** interrupted migration; copy/restore/delete isolation; pending writes during switching; and simultaneous edits in two tabs. Detect stale edits and offer reload or retaining a copy instead of silently overwriting newer work. Automatic cross-device sync remains deferred.

## Priority 4 — Requested appearance refinements

Description auto-height and per-page quantities are implemented; these separate visual requests remain open.

- [ ] **L2 · Independent information-box background.** Add a clearly named color setting separate from page background, description text, and photo-area background. Preserve the current appearance as the migration default and match exported output. Covers original requests 3 and 7.
- [ ] **L3 · Anchor the information box beneath the rendered photo.** A contained photo can still leave space inside its flexible image area. Compare representative portrait/landscape examples with the family before choosing placement; keep text legible and avoid excessive photo shrinking or overflow. Test every supported shape and partial page. Covers original request 4.
- [ ] **L4 · Warn about overflow and explain layout changes.** Detect clipped names/prices/descriptions before export and offer practical corrections; 500-character limits and auto-height alone do not prove a dense page fits. Explain and allow recovery from shape resets: changing the general quantity clears shape overrides but retains per-page quantities; changing a page's quantity clears that page's shape override. Check the effects of reorder/delete on layouts tied to page position.

## Completed implementation

Checked entries record implemented scope, including completed portions of broader tasks. Remaining acceptance checks stay in priority 1 and the evidence records; unfinished extensions stay in their priorities above.

### Saving and data integrity

- [x] **D1 · Honest load/save states.** Startup waits for a coherent load; failed loading stays visible with retry. “Guardando…”, “Guardado en este navegador”, and actionable save failures cover metadata, order, photos, settings, backgrounds, and layouts. Serialized writes track the latest revision; failed drafts remain available for retry or PDF export while the session stays open.
- [x] **D2 · Separate management actions.** Administración separates Vaciar catálogo, Restablecer ajustes, and Restablecer todo from export. Confirmations name the catalog/action/effect; operations are serialized. Settings-only reset preserves products, order, and photos. Color/Image tabs preserve the background until explicit removal.
- [x] **A3 · Current-session image/write ownership.** One IndexedDB transaction saves metadata, settings, and changed blobs/deletions. Active drafts, durable state, queued writes, and exports retain needed image URLs; obsolete resources and failed hydration allocations are released. Cross-catalog/recovery ownership remains A1/D4 work.
- [x] **A2 · Safe IDs and mutations.** Blank/photo/Excel intake uses UUIDs; missing or invalid move/reorder/replace targets are guarded. Shared field validation enforces the 500-character description limit in manual editing and import while preserving readable legacy data.

Sources: [session coordinator](src/store/catalogSession.ts), [database](src/db/index.ts), [save status](src/components/molecules/SaveStatus.tsx), [management controls](src/components/molecules/CatalogManagement.tsx), [product store](src/store/useProductStore.ts), [validation](src/utils/products.ts).

### Product editing and navigation

- [x] **U2/U5 · Readable editor and responsive foundations.** Labeled 16px sidebar fields, primary controls sized for touch, visible photo actions, focus/selected states, and an editor outside the scaled A4 page. Mobile viewport fallback order and safe-area height are corrected; the tablet drawer has close/Escape handling. These are implemented usability targets, not whole-app accessibility certification.
- [x] **U1/U4 · Compact editing and search.** Complete 96px thumbnails sit beside editable name/price fields; Details holds secondary actions. Name search ignores case/accents, supports clear/no-results states, and retains a renamed item while editing. Search, expanded details, and scroll position survive tab/Preview/reorder transitions.
- [x] **U3 · Visual reorder with alternatives to dragging.** A modal photo grid and page thumbnails support pointer/touch dragging, Subir/Bajar, absolute-position moves, and undo of the latest move while its resulting order remains current in that session. Focus handling, cancellation, edge scrolling, and the existing save queue are integrated.
- [x] **U4 · Preview navigation and back-to-top.** “Ver catálogo” selects Preview before scrolling on mobile. Visible products highlight in the sidebar. Labeled back-to-top controls target Preview, Productos, and Páginas independently. Covers original request 6; full synchronized scrolling remains open.
- [x] **A6 · Popover and startup fixes.** Color dialogs have names, close/Escape behavior, focus return, bounded viewport sizing, and close during export/management. Editor mounting after hydration fixes the previous initial background-tab race.
- [x] **Excel import · Original request 1.** First-sheet `.xlsx`/`.xls` import appends Nombre/Descripción/Precio rows, with a header template, count confirmation, optional filename image matching, and correctable over-limit descriptions. Full preview/diagnostics/recovery remain I2.

Sources: [compact editor](src/components/organisms/ArticulosTab.tsx), [product fields](src/components/molecules/ProductListItem.tsx), [reorder modal](src/components/organisms/ReorderProducts.tsx), [navigation](src/App.tsx), [popover](src/components/atoms/GradientPickerPopover.tsx), [Excel panel](src/components/molecules/ExcelImportPanel.tsx).

### Pages, appearance, and output

- [x] **L1 · Consistent page numbers and index backgrounds.** Sidebar, index, preview, and exports use the actual index-page count and shared pagination. Index pages render the configured background image/opacity. Covers original request 2 and the 31+ product offset bug.
- [x] **Per-page quantities and shapes.** Choose 1–5 products globally or per page; later products redistribute in order. General removes a page's quantity override. Quantities persist across reload, reset with settings, and drive index/export numbering. Shared shape resolution handles partial pages.
- [x] **Description auto-height and photo-area backgrounds.** Descriptions resize with text, typography, width, and font readiness. The page background can show through a transparent photo-area color/gradient; the information box still uses page color. Replacing the page background preserves product photos. L2/L3 remain separate requests.
- [x] **E2 · Shared, faithful capture.** PDF/HTML preparation preserves current field values, intentional text/background opacity, images, and links. It waits for fonts and image decoding, keeps temporary base64 outside stores, and cleans capture wrappers after success/failure. Overflow safeguards remain L4.
- [x] **E1 · Existing PDF/share foundation.** A4 PDF, linked index, progress, store-name filenames, supported mobile sharing, download fallback, and quiet cancellation. An export lease blocks concurrent mutations and retains images during capture, including failed-save drafts. Catalog identity and completion UX remain open.
- [x] **Existing web output.** Standalone HTML capture and Netlify publishing exist; the HTML download handler has no visible sidebar button. Publication destination/readiness and credentials remain S2/S1 work.

Sources: [pagination](src/utils/chunks.ts), [page controls](src/components/organisms/PaginasTab.tsx), [index](src/components/organisms/IndexPage.tsx), [description sizing](src/hooks/useTextareaAutoHeight.ts), [product styles](src/styles/product.css), [shared capture](src/utils/capture.ts), [PDF hook](src/hooks/usePDF.ts), [publishing hook](src/hooks/usePublish.ts).

### Shared logic and verification tooling

- [x] **A5 · Shared logic already extracted.** Pagination/offsets/shapes, product validation, PDF/HTML capture, and session persistence have shared implementations. Management, save status, back-to-top, and reorder UI have dedicated components. Further extraction should follow actual feature changes.
- [x] **Q1 · Regression safety net.** Playwright tests cover storage failures/retry, image ownership, mutation guards, pagination, controls, reorder, and actual PDF/HTML artifacts. `npm run verify` builds and checks Git whitespace; GitHub Actions runs it as Catalog build. Browser tests are local/manual, and full PDF inspection requires macOS tools.

Sources: [tests](tests/), [scripts](package.json), [CI setup](docs/ci-github-setup.md). Remote branch-rule configuration was not checked in this review.

## Ongoing checks and maintenance

- **A5/Q1/E2 · Preserve shared behavior as features change.** Extend the existing helpers and focused tests for risky storage/migration/recovery, image ownership, pagination, and output work. Run `npm run verify`; a build does not validate browser interactions or PDF rendering. Avoid broad cosmetic refactors or coverage targets.
- **Q2 · Observe real family tasks.** Record each parent's independent task results, device/version, and help needed. Include copies, return to Principal, recovery, and correct-catalog sharing once implemented. Prioritize repeated confusion; no mandatory tutorial or analytics platform is needed.
- **Q3 · Keep docs and dependencies focused.** Keep README/architecture aligned with actual capabilities, and explain browser-local storage and future backup steps in Spanish. Review advisories before targeted dependency updates, particularly import/export and publishing; no blanket upgrades or new dependencies are implied.

For affected releases, exercise save/refresh failures; 0/1/30/31/60/61 products; 1–5-per-page layouts, mixed capacities and partial pages; actual phone photos; keyboard/zoom; and repeated PDF/HTML export after editing.

## Optional and deferred ideas

**Not scheduled.** Revisit these when the family expresses a need or actual use shows a worthwhile benefit. To promote an idea, agree on its smallest useful scope, move its full entry into the appropriate priority, and keep its ID. Maintain one active entry per task.

Catalog copies/blank catalogs, portable backups, basic recovery, accessible editing, and the requested visual fixes remain required work above. Touch/pointer drag and direct-position moves are already in [Completed implementation](#product-editing-and-navigation).

### Catalog and editing conveniences

- **C3 · Duplicate a product and hide it temporarily.** Consider this for similar items or seasonal/unavailable stock; whole-catalog copying is already required under C1. Give hidden products a clear label/filter and keep them editable and in backups, while excluding them consistently from preview, index, page counts, PDF, and web output. Copies must own their images safely. Deliver product duplication first if hiding would delay the core workflow.
- **D5 · Broader undo/redo.** Extend D4's basic recovery with meaningful groups of text edits and reorder/layout changes. Build on reliable storage/image ownership, keep history bounded and catalog-specific, and avoid unlimited per-keystroke history or event sourcing.
- **I3 · Excel export and updating existing products.** Consider this if the family maintains prices in spreadsheets. Export rows separately from D3's full backup, use stable product IDs, and preview update versus append; never replace products by name alone. Bulk price changes and advanced mapping remain deferred until that workflow is confirmed.

### Appearance and interaction options

L5 presets/visibility and L6 image framing remain in priority 2. The following extend that scope only when useful:

- **Section divider pages.** If the catalog needs groups such as kitchen and decoration, add explicit page types/titles and update index/export numbering. This requires catalog structure changes as well as styling.
- **More visibility controls.** Extend L5 when specific unused fields repeatedly get in the way; keep advanced controls optional instead of exposing a toggle for every element.
- **Radix Popover replacement.** Consider a primitive if maintaining the custom picker's focus, Escape, and viewport behavior becomes harder. Compare against A6 and obtain dependency authorization if selected. Accessible behavior remains required whichever implementation is used; accordions/tabs already use Radix.
- **Installable/offline app.** Consider this for a home-screen shortcut or unreliable connectivity. Define offline launch, login, fonts, and updates; browser-local storage alone does not provide a fully offline app.

### Conditional technical ideas

Revisit S1 when publishing work resumes. Prioritize performance changes only with evidence from realistic use.

- **S1 · Remove privileged publishing credentials from the browser build.** `usePublish` reads `VITE_NETLIFY_PAT`; client-bundled credentials are not protected by Identity login. If a token has shipped, remove it from builds and have the deployment owner revoke/rotate it. The recommended browser-only option is PDF or intentional HTML download/manual publishing with direct deployment removed. If one-click publishing is essential, agree on an authenticated external publishing service as a separate architecture change. Hiding the button alone is insufficient. See the [publishing hook](src/hooks/usePublish.ts) and [Vite environment-variable documentation](https://vite.dev/guide/env-and-mode); no credential values or live deployments were inspected.
- **A4 · Coalesce frequent writes safely.** Current text edits write the metadata list and settings edits save immediately. If batching is needed, retain synchronous UI updates and order writes by catalog. Flush/await before switching, backup, export, or reset; test lifecycle interruptions and announce saved only after commit. A fixed debounce alone is insufficient.
- **Photo resizing/compression.** Consider only when actual phone photos cause storage/export problems; agree on acceptable print quality first.
- **Lazy-loading large libraries.** Consider when startup is noticeably slow on the family's device/connection. A bundle-size warning alone does not justify a broad refactor.
- **Workers, virtualization, image deduplication, or a new export engine.** Require a reproducible problem with realistic catalogs that simpler fixes cannot resolve.

### Deferred scope and conditional cleanup

- **Automatic cross-device sync.** Deferred by agreement: backup-file transfer is sufficient. Revisit for frequent shared editing, with explicit storage, authentication, and conflict behavior before expanding the browser-only architecture.
- **Real-time collaboration, roles, approvals, and audit trails.** Outside the current family scope; revisit only for a new need.
- **Catalog folders/tags and complex organization.** Revisit if Principal plus a few named experiments becomes hard to manage.
- **Hidden HTML-download path.** Resolve with S1: expose/support it if selected as the publishing alternative, or remove obsolete UI plumbing while preserving shared capture code. This is not an independent feature commitment.
- **Framework rewrite or blanket dependency upgrades.** No demonstrated need. Targeted maintenance remains Q3.

## Evidence and review boundary

This cleanup compares the current source, callers, styles, tests, and existing verification records. It updates planning documentation only and preserves the prior editor work.

- [Priority 1 verification](docs/priority1-verification.md) records automated storage, usability, pagination, and export results for its source checkpoints; formal device/parent acceptance remains open.
- [Family-feedback verification](docs/family-feedback-verification.md) records back-to-top, description sizing, per-page quantity, and background work plus reported exploratory family use. It does not establish acceptance of every subsequent change.
- [Article/reorder verification](docs/articles-verification.md) records 110 distinct Chromium cases across selective runs for the current editor work. It explicitly leaves other-browser, real-phone, and parent checks open; it is not a full-suite result.
- [Architecture](docs/ARCHITECTURE.md) maps implementation details. The [optional and deferred ideas](#optional-and-deferred-ideas) above preserve the separate scope of product duplication/hiding, broader history, spreadsheet export/update, and measured performance work.

Historical test results belong to the source versions described in those records. This documentation review does not claim a fresh browser-suite run, device validation, dependency vulnerability audit, or live publishing check.
