# CatalogMaker architecture

Use this map when changing behavior across components, stores, persistence, or export.
Read the linked implementation for details; [AGENTS.md](../AGENTS.md) owns the working agreements.

## Runtime and UI

The app runs in the browser with React 18, TypeScript, Vite, and Zustand. There is no
application backend in this repo. IndexedDB holds catalog data locally; Netlify Identity,
Google Fonts, and web publishing use network services.

[main.tsx](../src/main.tsx) initializes Netlify Identity, loads global CSS and renders
React StrictMode. [App.tsx](../src/App.tsx) starts single-session hydration, owns page refs,
mobile view, active tool section and desktop panel visibility. Editing UI is mounted only after a coherent
load. A failed load remains visible with retry; existing records are never replaced with an
empty catalog to hide a failure. Development still uses the existing login bypass.

The editor uses Radix Themes for its own controls, dialogs and login screen. `EditorTheme`
wraps the header, tool panel, mobile navigation and portalled UI, not the A4 pages. UI tokens
are separate from the settings-store variables used by the catalog. `useUIThemeStore` owns
the light/dark preference, initialized before React mounts and saved through `db/index.ts`
to the separate localStorage key `cm:ui-theme`. Missing or unreadable preferences start light;
write failures retain the session choice with a header notice. Catalog resets and saves do not
change this preference. The labeled header switch changes the editor and workspace background,
including portals, while A4 pages and capture clones retain their catalog colors and light
browser-control styling. Dark UI uses black main surfaces and a high-contrast mint palette.
The existing gradient picker retains its library and dark appearance, with matching high-contrast
controls in dark mode. `EditorHeader` owns export actions, the
single main save indicator and catalog/account menus. `ToolPanel` groups Articles, Pages
and Design; all three contents remain mounted to retain editing context and scroll.
Confirmation dialogs use existing store actions and disable confirmation during busy states.
Select popups and color controls close when disabled; color controls also close when their
section becomes inactive.

## State and persistence

[useProductStore.ts](../src/store/useProductStore.ts) owns product metadata and rendering URLs.
[useSettingsStore.ts](../src/store/useSettingsStore.ts) owns branding, typography, background,
items per page and page layouts; its actions also apply the existing CSS variable mappings.
[usePersistenceStore.ts](../src/store/usePersistenceStore.ts) exposes typed loading, saving,
error, revision and busy states. There is no settings subscription writing during hydration.

[catalogSession.ts](../src/store/catalogSession.ts) coordinates the existing stores. A mutation
updates the displayed draft synchronously and queues a captured state. Writes run serially;
only the latest revision can announce saved. A later edit includes failed earlier changes,
so retry and continued editing cannot hide unsaved metadata or images. Actions return an
awaitable result (saved, ignored, invalid, failed or conflict); all database rejections reach this path.

All storage access remains in [db/index.ts](../src/db/index.ts). Native IndexedDB transactions
use the existing `keyval-store` database and `keyval` object store. The application storage
format is versioned independently of the native database version.

| Key | Stored value |
|---|---|
| `cm:catalogs` | Format version, Principal ID, last-opened ID and migration phase. |
| `cm:catalog-meta:<catalogId>` | ID, internal name, creation/save dates, persisted revision, product count and optional deletion date. |
| `cm:catalog:<catalogId>:products` | Ordered product metadata, including photo positions. |
| `cm:catalog:<catalogId>:settings` | Branding, colors, fonts, sizes, opacity, quantities and layouts. |
| `cm:catalog:<catalogId>:img:<productId>` | Product image Blob. |
| `cm:catalog:<catalogId>:bg` | Page background Blob. |
| `cm:catalog:<catalogId>:index-bg` | Independent index background Blob. |

Migration validates the former global `cm:products`, `cm:settings`, `cm:img:*`, `cm:bg`
and `cm:index-bg` records. It atomically writes one Principal candidate and a pending marker,
reads the candidate back, then marks the registry ready. Interrupted attempts resume the
same candidate; concurrent startup cannot create another Principal. Original global keys
remain intact and are no longer read after migration. Invalid records retain a visible load
error and retry; migration does not substitute empty data for an unreadable catalog.

Hydration loads list metadata and only the selected catalog's content. Valid legacy IDs and
long descriptions are preserved; missing photos use the placeholder. URLs are allocated after
validation. `useCatalogStore` owns the list, active/main references, session epoch and management
errors. Each tab owns its active selection; the shared last-opened reference is used on startup.
Opening a catalog commits valid price drafts and waits for pending writes. Failed saving or an
invalid price prevents switching. Destination URLs are prepared before changing the selection.
The editor and preview have distinct keys per session epoch, which resets forms, search, scroll,
page refs and transient dialogs without retaining old panels.

Persistent revisions are separate from the session's local queue revisions. Every content or
metadata write checks its expected revision in the same read/write transaction. Stale writes
cannot overwrite newer content or resurrect deleted catalogs. BroadcastChannel and focus/visibility
checks refresh metadata without switching another tab's selection. Conflicts retain the local
draft and offer reloading durable content or saving an independent copy; PDF and backup export
remain available.

Each save writes metadata/settings and any changed blobs/deletions in one transaction. Blob
identity is compared with the last committed state so unchanged images are not rewritten on
every keystroke. Commit confirmation comes from transaction completion, with failures finalized
on abort. Closing/reloading during a pending transaction can lose that draft, but cannot commit
only half its metadata/image changes. This does not guarantee writes survive hardware failure.

Management uses the same queue. Empty removes products/photos; settings reset restores
settings/layout/background defaults while preserving products/photos/order; full reset does both.
Controls are disabled while management is pending, and another action can proceed after its
awaited result. Failures retain the session draft and show retry.

## Images and import

Uploaded files remain IndexedDB blobs with object URLs in rendering state. The placeholder
owns no object URL. Session ownership includes active drafts, the last durable state, queued
writes and exports. Obsolete URLs are revoked only when none of these owners retains them.
Failed replacement keeps both the old durable image and the new active draft; successful retry
releases the obsolete one. Hydration allocates only after the complete validated read, reuses
one in-flight load across StrictMode effects, and cleans allocations if adoption fails.

Export acquires a session lease before asynchronous preparation, blocks concurrent mutations,
and releases it in `finally`. Temporary base64 maps include product photos and background and
never enter stores. Catalog copies use independently owned blob records. Deleted catalogs retain those records until
explicit permanent deletion; there is no expiration or general editing history.

[ExcelImportPanel.tsx](../src/components/molecules/ExcelImportPanel.tsx) accepts `.xlsx`/`.xls`,
shows parsing errors or confirmation, and optionally accepts separate image files.
[excel.ts](../src/utils/excel.ts) reads the first sheet's `Nombre`, `Descripción`, and `Precio`
columns and skips blank names. Import rejects descriptions above the shared 500-character limit before allocating images or
appending; the panel retains invalid rows for correction. Accepted imports append products; filenames match trimmed product names
case-insensitively after removing the file extension. The downloadable template contains headers
only. There is no full-session Excel backup/restore.

## Catalog management and portable backups

`CatalogManager` opens from the named header selector. Principal is listed first and remains
protected against deletion or reassignment; its internal name can change independently of the
printed business name. Blank catalogs use application defaults. Copies preserve products, order,
original photos, branding, both backgrounds, image positions and page layouts. Creation and restore
open the destination only after successful storage; deletion of the active secondary catalog
returns to Principal. Eliminados retains complete catalogs, supports recovery with a nonconflicting
name, and requires confirmation for permanent deletion. Existing product/settings resets still
apply only to the active catalog; D4 product undo and snapshots are not implemented.

`catalogBackup.ts` encodes a versioned `.catalogmaker.json` file with metadata, ordered products,
settings and original image bytes. Base64 exists only during file export/parsing and never enters
Zustand or IndexedDB; restored images become blobs. Backup captures the current draft under an
export lease, including unsaved changes when saving failed. Parsing validates the version,
metadata, products, layouts, image references and decodability before any database writes.
The confirmation previews name/count, and restoration always creates a new secondary catalog.
UI theme, login and publication credentials are not included. Copies and Eliminados are local
browser storage; only the downloaded file is a portable external backup.

## Pages, styling, and navigation

[Workspace.tsx](../src/components/organisms/Workspace.tsx) renders index pages followed by product
pages and registers their `.page-a4` elements in `pagesRef`. Empty catalogs render no pages.
[chunks.ts](../src/utils/chunks.ts) defines the 30-entry index limit and page-number helpers.
Items per page has a global default from 1–5 and optional `pageItemCounts` overrides by
zero-based product-page position. `paginateProducts` accumulates those capacities, preserving
product order, and supplies the page boundaries to preview and editing panels. Index references
use the same capacity rules. Changing the default retains quantity overrides and clears shape
overrides; choosing General on an individual page removes its quantity override. Settings reset
clears both kinds of customization. Legacy settings without `pageItemCounts` use an empty map.
The shared shape resolver validates stored shapes against actual item count and selects a
compatible partial-page default. Zero products means zero index/product pages; all numbering
uses ceil(productCount / 30) index pages.

Theme mappings live in the settings store; global styles and `grid-1.css` through `grid-5.css`
define the A4 layouts. Index pages default to the global background, with optional image/color overrides shared across all index pages. The index image has its own opacity and blob ownership; switching modes retains it, while removal selects color-only mode.
Background Color/Image tabs only change the shown controls; removal is explicit. Product
cells have a transparent base, allowing the page background to show through the photo area's
color or gradient according to its opacity. The text area uses the independent `productInfoBg` color (initialized from the page color for legacy catalogs), and new products start with an opaque white photo-area background. Description textareas resize on content, typography,
available-width and font-loading changes through `useTextareaAutoHeight`.
`usePageScale` measures the actual workspace with ResizeObserver and sets `--page-scale`
up to 1 at every viewport size. Pages retain their A4 dimensions; capture resets zoom to 1.
A 360px tool panel (320px on tablets) sits beside the preview and can be collapsed. Below
768px, bottom navigation selects one full-width view: Preview, Articles, Pages or Design.
React state and shell data attributes control visibility; navigation no longer changes body
classes. Export actions remain available through the header menu on smaller screens. Workspace visibility highlights sidebar items; “Ver catálogo” navigates
to products. On desktop with Articles and preview visible, scrolling either panel reveals the matching article in the other without moving focus. Synchronization respects search filters and pauses during export, management and reordering; mobile and the other tabs retain independent scroll. Back-to-top buttons scroll and
focus the active preview, product list or page-settings list; they remain outside captured A4 pages.

Prices use integer Argentine pesos (`$ 1.234`) in both editors and Excel imports. Editing validates locally and commits on blur or Enter; invalid drafts never enter exports. Hydration rounds unambiguous legacy decimal prices, preserves nonnumeric or ambiguous text and does not write until a subsequent save.

The product editor keeps 96px photos beside labeled name/price fields, with secondary actions
under Details. Name search ignores accents/case and retains a renamed active article until the
query changes or another article is activated. Product-tab content stays mounted but hidden
when inactive, preserving search, expanded details and scroll position; its color popovers close.
Filtering never changes product order or catalog page numbering.

Product photos can be dragged vertically with a mouse in the desktop preview, within the
available space and without cropping or resizing. The position belongs to the article and is
saved on release; Escape, pointer cancellation and focus loss discard an unfinished drag.
Focused photo controls also accept arrow keys and Home/End; a reset button centers the photo.
Existing records default to centered, and replacing a photo centers its replacement. Touch
gestures retain normal preview scrolling. Preview, printing, PDF/HTML capture and page thumbnails
retain the saved position; capture ignores unfinished drag positions and editor controls.

[ReorderProducts.tsx](../src/components/organisms/ReorderProducts.tsx) opens a Radix dialog with a photo grid
with navigation-only page thumbnails on the right, or above the grid below 768px. The dialog skips scale animation so its initial scroll calculations use final coordinates. Thumbnails
reuse pagination, shape resolution and the shared `.grid-item` placement rules, without mounting
editable product cards or `.page-a4` export targets. Pointer dragging uses dedicated handles,
capture, cancellation and edge scrolling; keyboard/touch controls also support adjacent and
absolute-position moves. Each completed move uses the existing reorder action and save queue.
The latest move can be undone during that modal session while its resulting order remains current;
this is not general editing history. The grid and thumbnails scroll within their own containers.
See [article verification](articles-verification.md) for automated checks and device limitations.

## Export and publishing

[usePDF.ts](../src/hooks/usePDF.ts) orchestrates image conversion, progress, errors, and file
download or mobile file sharing. Filenames and share titles use the active catalog name;
the printed business name remains a design setting. [pdf.ts](../src/utils/pdf.ts) builds jsPDF output and link
annotations. Footer labels accept an optional HTTP/HTTPS URL. Preview and exported HTML open external links in a new tab; PDF navigation is controlled by the viewer. The module re-exports capture constants and types for existing callers.

[capture.ts](../src/utils/capture.ts) shares preparation, clone transforms, image/font readiness
and canvas capture between PDF and HTML. It copies current field values into clones, removes
editor actions, preserves intentional opacity and replaces product/background URLs with temporary
base64. It cleans capture wrappers in `finally`. Extend transforms for new page elements. The export utilities have no React/store imports;
they perform DOM work when called and remove temporary capture wrappers in `finally`.
The editor shell has `data-html2canvas-ignore`; capture clones are appended outside it.
This keeps the editor and original preview pages out of html2canvas's document copy.

Export-hook errors are exposed as state and displayed in a shared Radix alert dialog.
Both export hooks add `pdf-exporting` to the body and remove it in `finally`.
The visibility override is in `mobile.css`; it keeps the workspace measurable from mobile
settings/products tabs. Check preview, captured output, and link coordinates when changing layout.

[usePublish.ts](../src/hooks/usePublish.ts) shares those transforms through
[htmlExport.ts](../src/utils/htmlExport.ts), which embeds page images and clickable link overlays
in standalone HTML. A standalone HTML download handler exists, but the editor does not expose its button.
[netlify.ts](../src/utils/netlify.ts) creates a deploy, uploads HTML when required, and polls its
status. It currently falls back to a URL on polling timeout without proving the deploy is ready.

[useIdentity.ts](../src/hooks/useIdentity.ts) listens for initialization, login, and logout.
`App.tsx` gates production UI on identity state; Vite development mode bypasses that gate.
Only Principal can invoke publishing; copies, blanks and restored catalogs are blocked in the
header and action. The session publication link belongs to its originating catalog.
Publishing uses `VITE_NETLIFY_PAT` and `VITE_NETLIFY_SITE_ID` from the browser build, independently
of the Identity user's credentials. Treat the client-side publishing credential as exposed;
the login screen is not server-side authorization for that token. Do not print credential values
or test by deploying to a live site during a review.

## Verification

`npm run verify` compiles TypeScript, builds production assets and checks staged/unstaged
whitespace. `npm run test` runs the focused Playwright suite against a local Vite server with
external requests blocked. Each test uses and deletes a disposable persistent browser profile;
WebKit private contexts reject IndexedDB blobs on the tested macOS environment. Native failure
injection exercises transactions rather than mocking successful store updates.

The artifact checks generate real PDF/HTML files and use the system's macOS PDFKit/Vision tools
for page dimensions, links, raster text and background checks. See
[priority1-verification.md](priority1-verification.md) for current evidence and limitations and
[priority1-device-checks.md](priority1-device-checks.md) for required actual-device/parent tasks.
Build and emulation results do not establish real mobile keyboard/share behavior or family usability.

For an occupied development port, set `CATALOG_TEST_PORT` when running tests.
`CATALOG_TEST_CHROME=1` uses an already installed Google Chrome for the Chromium project.
