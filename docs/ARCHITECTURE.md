# CatalogMaker architecture

Use this map when changing behavior across components, stores, persistence, or export.
Read the linked implementation for details; [AGENTS.md](../AGENTS.md) owns the working agreements.

## Runtime and UI

The app runs in the browser with React 18, TypeScript, Vite, and Zustand. There is no
application backend in this repo. IndexedDB holds catalog data locally; Netlify Identity,
Google Fonts, and web publishing use network services.

[main.tsx](../src/main.tsx) initializes Netlify Identity, loads global CSS, registers settings
auto-save, and renders React StrictMode. [App.tsx](../src/App.tsx) owns startup hydration,
the ordered page refs used by export, mobile tab state, and the tablet sidebar toggle.
The UI is organized as atoms, molecules, organisms, and templates.

## State and persistence

[useProductStore.ts](../src/store/useProductStore.ts) owns product metadata and image URLs.
Product metadata mutations call database helpers; image uploads/replacements write blobs separately.
[useSettingsStore.ts](../src/store/useSettingsStore.ts) owns branding, typography, background,
items per page, and per-page grid choices. Setters update state and the applicable CSS variables.

Settings auto-save is a store subscription in `main.tsx`, not a call in each setter.
It serializes settings on changes while excluding the background URL. On startup, `App.tsx`
loads products independently and loads settings/background together. Settings hydration applies
colors, fonts, sizes, and stored Google Fonts. It currently runs only when a settings record exists.
UI state such as active tabs, import confirmation, export progress, and the last published URL is transient.

All storage access belongs in [db/index.ts](../src/db/index.ts), using `idb-keyval`:

| Key | Stored value |
|---|---|
| `cm:products` | Product metadata array: id, name, price, description, bgColor. |
| `cm:img:<id>` | Uploaded product image blob. |
| `cm:bg` | Background image blob. |
| `cm:settings` | `PersistedSettings`: branding, colors, fonts, sizes, opacity, counts, layouts. |

Database write helpers currently return `void`; a store update is not proof that an asynchronous
write has completed. Changes to persistence must consider refresh, hydration races, failed writes,
and compatibility with existing records. Catalog reset clears products; settings reset calls
`dbClearAll`, which also clears products and the background.

## Images and import

Uploaded files become IndexedDB blobs plus object URLs for rendering. Missing images use the
encoded SVG `PLACEHOLDER_IMG` from [image.ts](../src/utils/image.ts). Replacements revoke the old URL;
deletion and reset currently clear stored data without revoking every product URL. Treat that as
existing behavior to investigate when relevant, not a cleanup pattern to copy.

Export builds temporary base64 maps; product state must keep its rendering URLs. Both PDF and
HTML export use this approach. The placeholder is a data URL and does not own an object URL.

[ExcelImportPanel.tsx](../src/components/molecules/ExcelImportPanel.tsx) accepts `.xlsx`/`.xls`,
shows parsing errors or confirmation, and optionally accepts separate image files.
[excel.ts](../src/utils/excel.ts) reads the first sheet's `Nombre`, `Descripción`, and `Precio`
columns and skips blank names. Import appends products; filenames match trimmed product names
case-insensitively after removing the file extension. The downloadable template contains headers
only. There is no full-session Excel backup/restore.

## Pages, styling, and navigation

[Workspace.tsx](../src/components/organisms/Workspace.tsx) renders index pages followed by product
pages and registers their `.page-a4` elements in `pagesRef`. Empty catalogs render no pages.
[chunks.ts](../src/utils/chunks.ts) defines the 30-entry index limit and page-number helpers.
Items per page is a global setting from 1–5; grid shapes can vary by product-page index.
Changing the global count clears layout overrides. Product pages validate a stored shape against
their actual item count and choose a default for partial pages.

Theme mappings live in the settings store; global styles and `grid-1.css` through `grid-5.css`
define the A4 layouts. Product pages render a background-image layer; index pages currently do not.
`usePageScale` sets `--page-scale` for tablet/mobile. Body classes select mobile tabs and toggle
the tablet sidebar. Workspace visibility highlights sidebar items; item-number clicks navigate
to products. This is not bidirectional synchronized scrolling.

## Export and publishing

[usePDF.ts](../src/hooks/usePDF.ts) orchestrates image conversion, progress, errors, and file
download or mobile file sharing. [pdf.ts](../src/utils/pdf.ts) owns A4/capture constants,
`ExportContext`, page transforms, canvas capture, and jsPDF output with link annotations.

`PAGE_TRANSFORMS` freezes animation, removes image hover controls, restores background opacity,
replaces editable fields, and patches cloned images from the local map. Extend transforms when
new page elements require capture handling. The export utilities have no React/store imports;
they perform DOM work when called and remove temporary capture wrappers in `finally`.

Both export hooks add `pdf-exporting` to the body and remove it in `finally`.
The visibility override is in `globals.css`; it keeps the workspace measurable from mobile
settings/products tabs. Check preview, captured output, and link coordinates when changing layout.

[usePublish.ts](../src/hooks/usePublish.ts) shares those transforms through
[htmlExport.ts](../src/utils/htmlExport.ts), which embeds page images and clickable link overlays
in standalone HTML. A download handler exists, but the sidebar intentionally hides its button.
[netlify.ts](../src/utils/netlify.ts) creates a deploy, uploads HTML when required, and polls its
status. It currently falls back to a URL on polling timeout without proving the deploy is ready.

[useIdentity.ts](../src/hooks/useIdentity.ts) listens for initialization, login, and logout.
`App.tsx` gates production UI on identity state; Vite development mode bypasses that gate.
Publishing uses `VITE_NETLIFY_PAT` and `VITE_NETLIFY_SITE_ID` from the browser build, independently
of the Identity user's credentials. Treat the client-side publishing credential as exposed;
the login screen is not server-side authorization for that token. Do not print credential values
or test by deploying to a live site during a review.

## Verification

`npm run verify` compiles TypeScript, builds production assets, and checks staged/unstaged
whitespace. There is no configured linter or automated behavior suite. Use relevant browser
checks for refresh persistence, import, 30/31-product pagination, partial grids, mobile navigation,
and repeated exports. Record checks not performed; a passing build is not a browser test.
