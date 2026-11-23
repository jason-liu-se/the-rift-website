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

- **One tool per content type** (`pages/admin-page/components/<type>-tool/`),
  each an `<app-content-tool>`: the shared list (`editor-list/`) or the shared
  draft editor (`draft-editor/`) around the tool's own form, as the URL's query
  parameters say (`EDITOR_PARAMS`: `?new`, `?edit=<id>`, `?draft=<id>`,
  `?duplicate=<id>`, beside the tool's `#fragment`).
- **API:** `EditorContentService` (items, bulk actions, collections),
  `DraftsService`, and `ImageUploadService`, typed per content type by
  `EditorContentTypes` (`services/editor-content/editor-content-types.ts`).
  Every `/editor/*` request uses `EDITOR_REQUEST_OPTIONS`.
- **Drafts** (`pages/admin-page/drafts/`): a `DraftSession` per open item saves
  to `localStorage` on every change and to the server `AUTOSAVE_DELAY_MS` after
  typing stops (`config/admin.ts`). It owns undo/redo, the "unpublished changes"
  tell, conflicts (`409`/`404`), and publishing. `DraftSessionsService` starts
  sessions; `DraftSyncService` sends drafts saved offline once the API is back.
- **Bulk actions** go through `BulkActionRunnerService`: at most
  `MAX_BULK_ITEMS` a request, one after another, with one snackbar summary per
  response (`summarizeBulkResults`).
- **Feedback:** `AdminNotifierService` (snackbars; failures stay until
  dismissed), `confirmAction` before anything destructive, and
  `describeWriteError` for messages.
- **Material** is allowed here; theme components only these pages use in
  `src/admin-theme.scss`, which `AdminPageComponent` loads. Avoid `DatePipe` and
  other `@angular/common` extras: they'd join every page's initial chunk (use
  `formatDateTime`).
- **Mirrored limits** (`config/images.ts`, `config/uploads.ts`,
  `config/admin.ts`) copy the API's to flag problems early; the API's are the
  ones enforced. Update both when they change.
