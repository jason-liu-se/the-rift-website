---
paths:
    - "src/app/pages/admin-page/**/*"
    - "src/app/services/editor-content/**/*"
    - "src/app/services/drafts/**/*"
    - "src/app/services/image-upload/**/*"
    - "src/admin-theme.scss"
---

# Admin tools

The decisions are in issue #101; the API's side is in the web-server's
`src/contract/` (synced to `src/app/interfaces/api-*.ts`).

- **Routes** (`pages/admin-page/admin.routes.ts`, under `/admin`): each tool's
  list at `/admin/<type>` (`editor-list-page/`), with creating and editing in
  routed modals over it: `new`, `drafts/<draftId>`, `<id>` (`editor-modal/`, the
  shared `draft-editor/` around the type's form), and `bulk`
  (`bulk-create-modal/`). `openModalRoute()` ties a dialog to its route: closing
  it returns to the list with its filters, and Back closes it. Public cards link
  editors to `/admin/<type>/<id>` with `<app-edit-button>`
  (`components/edit-button/`).
- **Per-type differences live in `EDITOR_TYPES`**
  (`pages/admin-page/editor-types.ts`): noun, statuses, search fields, field
  labels, flags, and the type's form, list cell, and bulk actions
  (`components/<type>/`). Shared code reads it; never check `type === …`. A
  type's bulk actions run through `BULK_ACTION_HOST`.
- **The list** (`editor-list/`): `EditorListStore` owns its state (type and
  filters from the URL, the loaded items and drafts, the selection, cleared on
  every load) and `EditorListActions` every write from it (row actions, bulk
  actions, also as the `BULK_ACTION_HOST`); both are provided by the list page.
  Drafts and published items are two collapsible groups of one table, with the
  same row component (`ListRow`, `list-rows.ts`).
- **Collections** come from `CollectionsStore` (provided by the admin page):
  fetched once per type, reloaded after a collection write.
- **Writes** (confirm, send, snackbar) go through `EditorWriteService.run()`.
- **API:** `EditorContentService` (items, bulk actions, collections),
  `DraftsService`, and `ImageUploadService`, typed per content type by
  `EditorContentTypes` (`services/editor-content/editor-content-types.ts`).
  Every `/editor/*` request uses `EDITOR_REQUEST_OPTIONS`.
- **Drafts** (`pages/admin-page/drafts/`): the server holds them. `DraftStore`
  owns every draft write (one queue, so autosave, retries, publishing, and
  syncing never race) and this browser's copies, kept only while a change waits
  for the server (`AUTOSAVE_DELAY_MS` after typing stops, or offline). Its
  `sync()` reconciles the copies with the server when the admin page opens and
  when the API comes back. A `DraftSession` per open item holds editing state:
  fields, undo/redo, the save stage (`SaveState`, one union), conflicts
  (`409`/`404`), and publishing, which always makes sure the server has the
  draft first. `DraftSessionsService` starts sessions.
- **Bulk actions** go through `BulkActionRunnerService`: at most
  `MAX_BULK_ITEMS` a request, one after another, with one snackbar summary per
  response (`summarizeBulkResults`).
- **Feedback:** `AdminNotifierService` (snackbars; failures stay until
  dismissed), `confirmAction` before anything destructive (through
  `EditorWriteService`), and `describeWriteError` for messages.
- **Material** is allowed here; theme components only these pages use in
  `src/admin-theme.scss`, which `AdminPageComponent` loads. Avoid `DatePipe` and
  other `@angular/common` extras: they'd join every page's initial chunk (use
  `formatDateTime`).
- **Mirrored limits** (`config/images.ts`, `config/uploads.ts`,
  `config/admin.ts`) copy the API's to flag problems early; the API's are the
  ones enforced. Update both when they change.
