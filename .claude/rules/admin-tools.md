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

- **Shell:** admin routes hide the site navbar (`data.showNavbar: false`) for
  the slim `admin-bar/`; tools are a sidebar on desktop and a bottom tab bar on
  mobile.
- **Routes** (`pages/admin-page/admin.routes.ts`, under `/admin`): each tool's
  list at `/admin/<type>` (`editor-list-page/`), with routed modals over it:
  `new`, `drafts/<draftId>`, `<id>` (`editor-modal/`, the shared `draft-editor/`
  around the type's form), `bulk` (`bulk-create-modal/`), and `collections`
  (`collections-modal/`). `openModalRoute()` ties a dialog to its route: every
  way of closing it (Escape, backdrop, Close, Back) leaves the route, so a
  route's `canDeactivate` can ask first (bulk creation with rows does). Every
  modal is framed by `modal-shell/` (fixed header and footer, mobile-only tabs;
  it focuses its heading on opening). Public cards link editors to
  `/admin/<type>/<id>` with `<app-edit-button>` (`components/edit-button/`).
- **The editor** shows the type's form beside its `preview` (Edit and Preview
  tabs on mobile). `PublishSettings` (`draft-editor/publish-settings.ts`,
  provided per editor modal) holds how it'll publish (visibility, news's date)
  and whether publishing was tried, shared by the footer and the form's fields;
  its `ErrorStateMatcher` marks blank required fields only after that.
- **Per-type differences live in `EDITOR_TYPES`**
  (`pages/admin-page/editor-types.ts`): noun, statuses, search fields, field
  labels, flags, sort options (the first is the default), list layout, public
  page, new-item fields, and the type's form, preview, list cell, and bulk
  actions (`components/<type>/`). Shared code reads it; never check
  `type === …`. A type's bulk actions run through `BULK_ACTION_HOST`.
- **The list** (`editor-list/`): `EditorListStore` owns its state (type and
  filters from the URL, the loaded items and drafts, the selection, cleared on
  every load) and `EditorListActions` every write from it (row actions, bulk
  actions, also as the `BULK_ACTION_HOST`); both are provided by the list page.
  Unpublished changes and every item are two collapsible groups of one table,
  with the same row component (`ListRow`, `list-rows.ts`); the gallery lays the
  same table out as a grid of cards in CSS. An `isOrderable` type, filtered to
  one collection, drags into order (`list-order.ts`, one update per moved item).
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
  `MAX_BULK_ITEMS` a request, one after another, answering every item's result
  once all are done. Updates send only the items they'd change and offer Undo,
  which `bulk-undo.ts` turns into the fewest updates that put items back.
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
