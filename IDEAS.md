# CatalogMaker — Ideas and nice-to-haves

**Optional improvements, not scheduled work.** Updated **2026-09-12** from the repository review. The required work and its delivery order are in [ROADMAP.md](ROADMAP.md).

Keep an idea here until the family expresses a need or actual use shows a worthwhile benefit. To promote one, agree on its smallest useful scope, move its full entry to the appropriate roadmap priority, keep its ID, and leave only a short pointer here. Do not maintain two active copies of the same task.

Main catalog management (including copies and creation from blank), portable backup/restore, basic mistake recovery, accessible editing, and existing requested visual fixes are already needed roadmap work. They are not optional ideas.

## Catalog and editing conveniences

| ID | Category | Work and completion criteria |
|---|---|---|
| C3 | Catalog management | **Duplicate a product and hide it temporarily.** Useful for similar items and seasonal/unavailable stock. Label hidden products clearly and offer a simple filter. Hidden items stay editable and in backups but are excluded consistently from preview, index, page counts, PDF, and web output. Copies own their images safely. Deliver duplication first if hiding would delay the core workflow. |
| D5 | Saving and recovery | **Broader undo/redo.** After storage/ownership is reliable, group text editing into meaningful actions and cover reorder/layout changes. Keep history catalog-specific and bounded. Do not begin with an unlimited history of every keystroke or an event-sourcing architecture. |

C3 is distinct from duplicating a whole catalog, which is already agreed and required. Consider it when similar or seasonal products make repeated editing tedious. D5 extends the basic delete/destructive-action recovery required by D4; it should wait for reliable storage and image ownership.

## Appearance and catalog structure

L5 (design presets and visibility controls) and L6 (image framing) are covered in [Roadmap priority 2](ROADMAP.md#priority-2--everyday-editing-import-dependable-output-and-design-choices).

| Idea | When it would help | Scope to consider |
|---|---|---|
| Section divider pages | The family needs named product groups, such as kitchen and decoration. | Explicit page types, section titles, and updated index/export numbering. This requires more than a styling change. |
| More visibility controls | Specific unused fields repeatedly get in the way. | Extend L5 only for demonstrated needs; avoid a toggle for every visual element. Keep advanced controls optional. |

## Spreadsheet workflows

| ID | Category | Work and completion criteria |
|---|---|---|
| I3 | Photos and Excel | **Excel export and updating existing products.** Export product rows separately from D3's full backup. If the family edits prices in spreadsheets, add a stable identifier and an explicit update-vs-append preview; never replace products by name alone. Keep bulk price changes and advanced spreadsheet mapping deferred until that workflow is confirmed. |

A spreadsheet export is not a full backup. Backup-file transfer between devices is already agreed and remains D3 in the roadmap. Consider spreadsheet updates only if the family actually maintains prices in Excel.

## Interaction enhancements and implementation options

| Idea | When it would help | Scope to consider |
|---|---|---|
| Touch drag and “Mover a…” | Accessible Subir/Bajar controls from U3 work, but moving through a long list still takes too many taps. | Evaluate touch drag or direct destination selection on actual devices. Retain keyboard/button alternatives. `@dnd-kit/sortable` is a possible implementation choice, not a required migration. |
| Radix Popover replacement | Maintaining focus, Escape, and viewport behavior in the custom picker becomes harder than adopting a primitive. | Compare against the A6 requirements and request dependency approval if selected. Accessibility fixes do not depend on choosing a new library. Accordions/tabs already use Radix. |
| Installable/offline app | Parents want a home-screen shortcut or reliable use with poor connectivity. | Define offline launch, login behavior, fonts, and updates. Existing browser storage does not establish a fully offline experience. |

## Conditional technical ideas

Revisit S1 when publishing work is resumed. Performance refinements below are conditional on demonstrated need.

| ID | Category | Work and completion criteria |
|---|---|---|
| S1 | Publishing safety | **Remove privileged publishing credentials from the browser build.** `usePublish` reads `VITE_NETLIFY_PAT`; Vite bundles `VITE_*` values into client code. Identity login does not secure that token. If a token has been shipped, remove it from builds and revoke/rotate it through the deployment owner. Recommended browser-only option: remove direct deployment and use PDF or an intentional HTML-download/manual-publish workflow. If one-click publishing is essential, agree on an authenticated external publishing service as a separate architecture change. Hiding the button alone is insufficient. |
| A4 | Architecture and code quality | **Coalesce frequent writes safely.** Text edits currently write the full metadata list and settings updates trigger saves immediately. If batching is needed, retain synchronous UI updates and order pending writes by catalog. Flush/await before switching, backing up, exporting, or resetting; test lifecycle interruptions and never equate a queued write with “saved.” A fixed 300ms debounce alone is not a complete persistence design. |

The S1 credential concern follows the browser implementation and [Vite's environment-variable documentation](https://vite.dev/guide/env-and-mode); no credential values or live deployments were inspected.

| Idea | Evidence needed before prioritizing |
|---|---|
| Photo resizing/compression | Actual phone photos cause storage or export problems; agree on acceptable print quality before modifying images. |
| Lazy-loading large libraries | Startup on the family's connection/device is noticeably slow; a bundle-size warning alone is not a reason for a broad refactor. |
| Workers, virtualization, image deduplication, or a new export engine | A reproducible problem with realistic catalogs that simpler fixes cannot resolve. Avoid these as default architecture work. |

## Deferred scope and conditional cleanup

These are decisions to revisit, not recommendations to build next.

| Topic | Current position / trigger |
|---|---|
| Automatic cross-device sync | Deferred by agreement: backup-file transfer is enough for now. Revisit if the family needs frequent shared editing; define storage, authentication, and conflict behavior before expanding the browser-only architecture. |
| Real-time collaboration, roles, approvals, and audit trails | Outside the current family scope. Do not add enterprise workflows without a new need. |
| Catalog folders/tags and complex organization | A main catalog and a few named experiments should suffice. Revisit only if the catalog list becomes hard to use. |
| Hidden HTML-download path | Revisit with deferred publishing decision S1: expose/support it if selected as the publishing alternative, or remove unused UI plumbing when obsolete. It is not an independent feature commitment. Preserve shared capture code still in use. |
| Framework rewrite or blanket dependency upgrades | No demonstrated need. Targeted maintenance and fixes remain Q3 in the roadmap. |

## Review boundary

These ideas retain the source-grounded scope from the 2026-09-12 roadmap review. They have not been implemented or browser-tested. Supporting implementation links are in the roadmap's implementation references and current-capabilities sections.
