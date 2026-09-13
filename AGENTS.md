# CatalogMaker — Repository Guide

Browser-only React/TypeScript catalog editor with IndexedDB persistence, A4 PDF export,
and optional web publishing to Netlify. See the architecture note for the actual data flow.

## Read when relevant

- [Architecture](docs/ARCHITECTURE.md): state, persistence, images, pagination, export, and integrations.
- [Roadmap](ROADMAP.md): requested work and implementation status; verify claims against code.
- [README](README.md): local development and deployment overview.
- [Catalog review](.agents/skills/catalog-review/SKILL.md): review workflow and repo-specific checks.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite at `http://localhost:5173`. |
| `npm run build` | Run TypeScript checks and build into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run verify` | Run the build plus unstaged and staged Git whitespace checks. |
| `npm test` | Run the Playwright browser and export regression suite. |

Run `npm run verify` after changes and report the result. Reuse a successful result
when the reviewed files have not changed since it ran. There is no lint command.
Playwright covers browser interactions and PDF/HTML output; the full suite requires macOS
for its Swift/PDFKit/Vision checks. The build alone does not verify those behaviors.
Git whitespace checks omit untracked files; inspect new files explicitly during review.

GitHub Actions runs only `npm run verify` as `Catalog build` for pull requests targeting
`main` or `Agustin` and pushes to either branch. Browser tests are available for manual local
runs, not CI. Merge blocking requires the separate GitHub ruleset described in
[CI setup](docs/ci-github-setup.md); require only `Catalog build` and remove any older browser
test requirements. Work on feature branches and use pull requests into these protected
branches; only `main` deploys to production.

## Code map

| Area | Entry points |
|---|---|
| Startup and layout | `src/main.tsx`, `src/App.tsx`, `src/components/templates/` |
| UI | `src/components/atoms/`, `molecules/`, `organisms/`; global CSS in `src/styles/` |
| State and storage | `src/store/`, `src/db/index.ts`, shared types in `src/types/index.ts` |
| Export and publishing | `src/hooks/usePDF.ts`, `usePublish.ts`; engines in `src/utils/` |
| Pagination and images | `src/utils/chunks.ts`, `image.ts`; layouts in `src/styles/grid-*.css` |

## Core standards

- Use TypeScript; avoid `any` unless unavoidable and prefer existing precise types.
- Keep the app browser-only: no backend dependencies, server-side code, or Node-only app APIs.
- Do not add inline comments, JSDoc, or block comments to code.
- Preserve the atoms → molecules → organisms → templates organization.
- Use existing Zustand actions and keep storage access in `src/db/index.ts`.
- Do not introduce another state management library.
- Keep CSS global in `src/styles/`; do not add CSS modules.
- Use or create CSS variables for theme colors and fonts; reuse the settings-store mappings.
- Put reusable helpers in domain-named `src/utils/` files, with no React or store imports
  and no side effects on import. Browser work belongs inside explicitly called functions.
- Keep the existing font helpers in `src/constants/fonts.ts`; new helpers belong in utils.
- Keep uploaded images as IndexedDB blobs and render through blob URLs or the placeholder.
  Release obsolete URLs and replace/delete the corresponding blobs when ownership ends.
- Keep base64 conversion local to export; never write converted images into application state.

## Working agreements

- Preserve existing working-tree changes. Record the starting diff so task changes stay identifiable.
- Do not install dependencies, skills, plugins, or tools without explicit user authorization.
  Commands that download tools implicitly, including `npx`, also need that authorization.
- Do not commit, push, run destructive Git commands, or publish externally unless explicitly asked.
- Inspect relevant implementation and callers before editing; prefer the smallest complete change.
- Verify library/API behavior when needed using Context7 if available, otherwise official docs.
  Use available research/design tools where useful; do not require tools that are absent.
- Ask about choices that materially affect scope or behavior. For UI choices needing agreement,
  discuss the recommended approach and an alternative; honor decisions already made.
- Implement → verify → review → address confirmed findings within the authorized task.
  Repeat affected checks after fixes and report any unresolved findings or unavailable checks.

## Review before handoff

Use `$catalog-review` before handing off meaningful code changes and for requested reviews.
Review the task's changes for ordinary handoff; use the full branch comparison for pre-PR review.
The skill reports findings without editing. The implementation workflow may then fix issues
within its existing authorization. Instructions request this review; no hook or CI gate enforces it.

Example: `$catalog-review review this branch before a PR against main`.
State what was reviewed, what was verified, and which browser scenarios remain untested.
