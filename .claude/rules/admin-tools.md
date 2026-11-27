---
paths:
    - "src/app/features/admin/**/*"
    - "src/admin-theme.scss"
---

# Admin tools

The decisions are in issue #101; the API's side is in the web-server's
`src/contract/` (synced to `src/app/core/api/api-*.ts`).

- **Shell:** admin routes hide the site navbar (`data.showNavbar: false`) for
  the slim `admin-bar/`; tools are a sidebar on desktop and a bottom tab bar on
  mobile. Without the navbar, `PageTemplate` leaves `<main>` to the page, so the
  admin bar and tools sit outside it.
- **Routes** (`features/admin/admin.routes.ts`, under `/admin`): each tool's
  list at `/admin/<type>` (`editor-list-page/`), with routed modals over it:
  `new`, `drafts/<draftId>`, `<id>` (`editor-modal/`, the shared `draft-editor/`
  around the type's form), `bulk` (`bulk-create-modal/`), and `collections`
  (`collections-modal/`). `openModalRoute()` ties a dialog to its route: every
  way of closing it (Escape, backdrop, Close, Back) leaves the route, so a
  route's `canDeactivate` can ask first (bulk creation with rows does). Every
  modal is framed by `modal-shell/` (fixed header and footer, mobile-only tabs;
  it focuses its heading on opening). Public cards link editors to
  `/admin/<type>/<id>` with `<app-edit-button>` (`shared/ui/edit-button/`).
- **The editor** shows the type's form beside its `preview` (Edit and Preview
  tabs on mobile). The draft holds the publish choices (`visible`, news's
  `date`) beside its fields (`DRAFT_OPTION_KEYS`); `PublishSettings`
  (`draft-editor/publish-settings.ts`, provided per editor modal) holds the
  published item's date (for "As before") and whether publishing was tried,
  shared by the footer and the form's fields; its `ErrorStateMatcher` marks
  blank required fields only after that.
- **Per-type differences live in `EDITOR_TYPES`**
  (`features/admin/editor-type-configs.ts`): noun, search fields, field labels,
  flags, the list's `filters`, `columns`, `view` and `defaultSort`, public page,
  new-item fields, and the type's form, preview, and bulk actions
  (`features/admin/<type>/`). Shared code reads it; never check `type === …`. A
  type's bulk actions run through `BULK_ACTION_HOST`. Collections' differences
  (their page's path, upload album) live in `COLLECTION_TYPES`
  (`collection-type-configs.ts`).
- **The list** (`editor-list/`): `EditorListStore` owns its state (type and
  filters from the URL, the loaded items and drafts, the selection, cleared on
  every load) and `EditorListActions` every write from it (row actions, bulk
  actions, also as the `BULK_ACTION_HOST`); both are provided by the list page.
  Unpublished changes and every item are two collapsible row groups of the
  type's `view`: `list-views/list-table/` (column headings that sort, `sort` and
  `order` in the URL; cards on phones) or `list-views/list-grid/` (cards on
  every screen, for the gallery). Both keep explicit table roles. Each column
  (`ListColumn`, `list-columns.ts`) names a shared cell (`cells/`, or the status
  badge) and builds its inputs from the row's `RowData` (`list-rows.ts`, the
  same for items and drafts), with its width, sort, and place on a card; the
  column on a card's `title` links to the editor. Filters beside search are
  `ListFilterField`s (`list-filter-fields.ts`): their options, URL key, API
  query, and which drafts they keep. Phones and the grid sort with a Sort by
  field. An `isOrderable` type, filtered to one collection, drags into order
  (`list-order.ts`, one update per moved item).
- **Collections** come from `CollectionsStore` (provided by the admin page):
  fetched once per type, reloaded after a collection write. The Collections
  modal lists them, and the editor's drafts of new ones, beside
  `collection-form/`, which edits one collection draft at a time
  (`gallery-collections`, `downloads-collections`): a new one, or an existing
  one's title and dimensions. Side by side, the list and the form scroll
  separately. `CollectionsEditor` (provided by the modal) owns the open draft
  and the drafts list; `collections-manager/` runs the list's actions and shows
  `collection-list/` (cards from `toCollectionCards()`) beside the form.
  Published and unpublished collections are the same cards: a click opens one in
  the form, showing or hiding one changes its draft, and deleting a published
  one writes at once. The form shares the item editor's publishing
  (`DraftPublisher`, `drafts/draft-publisher.ts`, given each editor's problems
  and messages), footer (`draft-footer/`), undo and redo (`draft-history/`), and
  conflict panel, with the footer in the modal's through `ModalFooterSlot`
  (`modal-shell/modal-footer-slot.ts`). Dimensions (a name and image each) use
  the same `dimensions-editor/` as map seasons, which add BlueMap fields
  (`withMapFields`). Both show each dimension's image as a thumbnail on its card
  (`withThumbnails`); a map's spans its taller fields, cropped narrower than
  16:9. The `/gallery` card shows the collection's first dimension's image, or
  none.
- **Writes** (confirm, send, snackbar) go through `EditorWriter.run()`.
- **API:** `EditorContentApi` (items, bulk actions, collections), `DraftsApi`,
  and `ImageUploader`, typed per content type by `EditorContentTypes`
  (`features/admin/editor-content/editor-content-types.ts`). Every `/editor/*`
  request uses `EDITOR_REQUEST_OPTIONS`.
- **Drafts** (`features/admin/drafts/`): the server holds them, of items or
  collections (`DraftTypes` in `editor-content-types.ts`). `DraftStore` owns
  every draft write (one queue, so autosave, retries, publishing, and syncing
  never race) and this browser's copies, kept only while a change waits for the
  server (`AUTOSAVE_DELAY_MS` after typing stops, or offline). Its `sync()`
  reconciles the copies with the server when the admin page opens and when the
  API comes back. A `DraftSession` per open item holds editing state: fields,
  undo/redo (`FieldHistory`), the save stage (`SaveState`, one union), conflicts
  (`409`/`404`), and publishing, which always makes sure the server has the
  draft first. `DraftSessions` starts sessions.
- **Bulk actions** go through `BulkActionRunner`: at most `MAX_BULK_ITEMS` a
  request, one after another, answering every item's result once all are done.
  Updates send only the items they'd change and offer Undo, which `bulk-undo.ts`
  turns into the fewest updates that put items back.
- **Feedback:** `AdminNotifier` (snackbars; failures stay until dismissed),
  `confirmAction` before anything destructive (through `EditorWriter`), and
  `describeWriteError` for messages.
- **Material** is allowed here; theme components only these pages use in
  `src/admin-theme.scss`, which `AdminPage` loads. Avoid `DatePipe` and other
  `@angular/common` extras: they'd join every page's initial chunk (use
  `formatDateTime`).
- **Mirrored limits** (`core/config/images.ts`, `core/config/uploads.ts`,
  `core/config/admin.ts`) copy the API's to flag problems early; the API's are
  the ones enforced. Update both when they change.
