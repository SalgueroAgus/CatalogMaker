# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Rules (non-negotiable)

- **Never commit or push** — do not run `git commit`, `git push`, or any destructive git command unless explicitly told to.
- **No comments in code** — do not add inline comments, JSDoc, or block comments. Code should be self-explanatory through naming.
- **TypeScript only** — avoid `any` unless genuinely unavoidable; prefer precise types from `src/types/index.ts`.
- **Browser-only** — never add backend dependencies, server-side code, or Node-only APIs.

---

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # tsc + vite build → dist/
npm run preview   # preview the dist/ build
```

No test suite. After any change, run `npm run build` to verify no TypeScript or build errors.

---

## Skills & Research Tools

Use these before planning or implementing — not as an afterthought.

- **context7 (skill + CLI)** — fetch up-to-date documentation whenever any library, framework, or API is involved. Never rely on training-data knowledge for API signatures, config options, or version-specific behavior. Always verify against current docs using context7.
- **exa (MCP tool)** — web research for architectural decisions, UI/UX patterns, accessibility standards, and general best practices. Use it when making non-trivial design or structural decisions to validate the approach against current community standards.
- **frontend design (skill)** — invoke for any UI/UX work: visual changes, layout refactors, component redesigns, interaction improvements, or anything that touches how the app looks or feels.

---

## Expected Workflow

1. **Investigate** — read all files relevant to the request before making changes.
2. **Research** — if any library is involved, use context7 to confirm current API patterns. For UI/UX or architecture questions, use exa to check current best practices.
3. **Clarify** — if anything is ambiguous or wasn't specified, ask before planning.
4. **Plan** — for any UI/UX work, invoke the frontend design skill to drive planning. Propose a plan and at least one alternative. Present both options with trade-offs and discuss with the user. Do not start building until the user is satisfied with the chosen plan.
5. **Solve** — implement the agreed plan.
6. **Review** — re-read written code for obvious errors, dead code, and duplication.
7. **Ask** — offer to run typecheck, lint, or manual tests. If the user says no, wait for further instructions.

---

## Architecture

**CatalogFlow Pro** is a browser-only PDF catalog generator. Users upload product images, edit names/prices/descriptions, and export a styled A4 PDF. All state is persisted in IndexedDB — there is no backend.

---

## Directory Structure

```
src/
├── App.tsx                     # Root: hydrates stores, owns pagesRef and mobile tab state
├── main.tsx
├── components/
│   ├── atoms/                  # Primitive UI: Button, Input, Select, Toggle, ColorPicker, etc.
│   ├── molecules/              # Composed UI: ProductCard, ProductListItem, FontSelector, etc.
│   ├── organisms/              # Page-level sections: Workspace, LeftSidebar, RightSidebar, IndexPage, ProductPage, etc.
│   └── templates/              # Full layouts: AppLayout
├── store/
│   ├── useProductStore.ts      # Product list state + IndexedDB write-through
│   └── useSettingsStore.ts     # Appearance settings + CSS var application
├── db/
│   └── index.ts                # All IndexedDB reads/writes (idb-keyval)
├── hooks/
│   ├── usePDF.ts               # PDF export hook — React state + orchestration only
│   └── usePageScale.ts         # --page-scale CSS var for mobile fit
├── types/
│   └── index.ts                # Product, Colors, Fonts, FontSizes, GridShape, etc.
├── utils/                      # Pure functions and constants — no React, no store imports
│   ├── image.ts                # PLACEHOLDER_IMG, blobUrlToBase64
│   ├── chunks.ts               # chunkArray for page splitting
│   ├── scroll.ts               # scrollToProduct, scrollToLastPage
│   └── pdf.ts                  # A4 constants, ExportContext, PageTransform, buildPDF, PAGE_TRANSFORMS
├── constants/
│   └── fonts.ts                # Google Fonts loading helpers (legacy location — new helpers go in utils/)
└── styles/                     # Global CSS only — no CSS modules
    ├── globals.css
    ├── layout.css
    ├── page.css
    ├── product.css
    ├── workspace.css
    ├── sidebar-left.css
    ├── sidebar-right.css
    ├── index-page.css
    ├── mobile.css
    ├── print.css
    └── grid-1.css … grid-5.css  # Per-count grid layouts
```

---

## State

Two Zustand stores are the single source of truth:

- **`useProductStore`** — product list (`id`, `name`, `price`, `description`, `image` blob URL, `bgColor`). Every mutation writes through to IndexedDB via `src/db/index.ts`.
- **`useSettingsStore`** — catalog appearance: store name, footer, colors, fonts, font sizes, bg image, items per page, per-page grid layout. Every color/font/size change immediately sets a CSS custom property on `document.documentElement` via `applyColors` / `applyFonts` / `applyFontSizes`.

On startup, `App.tsx` calls `dbLoadProducts` and `dbLoadSettings` then hydrates both stores.

---

## Coding Conventions

- Prefer existing Zustand actions over mutating state directly.
- Reuse existing CSS custom properties (`--page-bg`, `--color-name`, `--font-heading`, etc.) instead of introducing inline styles. Full variable-to-field mappings are in `useSettingsStore.ts`.
- Keep components in the existing atomic folder structure: `atoms` → `molecules` → `organisms` → `templates`.
- Do not introduce new state management libraries.
- All CSS is global and lives in `src/styles/`. There are no CSS modules — do not create them.

### Utils convention

`src/utils/` is the home for all reusable pure logic: constants, helper functions, and domain utilities. Rules:

- **No React** — no hooks, no JSX, no component imports.
- **No store imports** — utils must not import from `src/store/`. Data is passed in as arguments.
- **No side effects on import** — a `utils/` file can be imported anywhere without triggering DOM mutations or store reads.
- Name files after their domain (`pdf.ts`, `image.ts`, `chunks.ts`). Group related constants, types, and functions in the same file rather than splitting into many small files.
- `src/constants/fonts.ts` predates this convention and stays in place; all new helpers go in `src/utils/`.

---

## Image Handling

Product images are stored as blobs in IndexedDB under `cm:img:<id>`. The product store only holds blob URLs for rendering.

When deleting or replacing an image:
- Remove the old blob from IndexedDB (`dbDeleteImage` / `dbSaveImage`).
- Revoke the obsolete blob URL with `URL.revokeObjectURL`.
- Never store base64 images in application state — base64 conversion happens only at PDF export time, in a local `Map` inside `usePDF.ts`, and is discarded after export.

---

## Page Layout

The workspace renders two A4 page types (`.page-a4`):

- **`IndexPage`** (`organisms/IndexPage.tsx`) — table-of-contents, up to 30 products each.
- **`ProductPage`** (`organisms/ProductPage.tsx`) — product grid pages. Items per page (1–5) and `GridShape` are configurable per page. Grid shapes map to CSS class names; layouts live in `src/styles/grid-1.css` through `grid-5.css`.

`Workspace.tsx` splits products into index chunks and product chunks via `chunkArray` from `src/utils/chunks.ts`. A `pagesRef` array (refs to each `.page-a4` div) is passed down from `App.tsx` and is the input to `usePDF`.

---

## PDF Export

Two-layer architecture:

- **`src/utils/pdf.ts`** — pure export engine, no React. Contains A4 constants (`A4_PX`, `A4_MM`, `CAPTURE`), the `ExportContext` type, the `PageTransform` type, the default `PAGE_TRANSFORMS` array (freeze animations, remove hover overlays, replace inputs/textareas with divs, patch image sources, restore bg opacity), and `buildPDF` which runs the html2canvas + jsPDF pipeline.
- **`src/hooks/usePDF.ts`** — thin React wrapper. Reads from stores, builds a local `Map<id, base64>` (never mutates the store), calls `buildPDF`, and handles loading state + mobile Web Share API.

To add a new element type that needs special handling during capture, add a `PageTransform` function to `PAGE_TRANSFORMS` in `src/utils/pdf.ts`.

`document.body.classList.add('pdf-exporting')` forces the workspace tab visible on mobile during capture (see `src/styles/mobile.css`).

---

## Persistence (IndexedDB via idb-keyval)

All reads/writes go through `src/db/index.ts`.

| Key | Content |
|---|---|
| `cm:products` | Array of product metadata (no images) |
| `cm:img:<id>` | Blob per product image |
| `cm:bg` | Background image blob |
| `cm:settings` | Serialized `PersistedSettings` |

---

## Styling

Theming is driven entirely by CSS custom properties set by the settings store. Never hard-code colors or fonts — always use or create a CSS variable.

`usePageScale` (`src/hooks/usePageScale.ts`) computes `--page-scale` on mobile/tablet so A4 pages fit the viewport.

Mobile layout is tab-based; the active tab is tracked in `App.tsx` state and reflected as `tab-preview / tab-settings / tab-products` body classes used by `src/styles/mobile.css`.
