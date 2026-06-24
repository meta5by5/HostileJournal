# Hostile Sci-fi Worldbuilder

Patch updates:
- Comment editor formatting toolbar is on the same row as Roll, Clear, and Add Comment.
- D6 result icon uses `33909.png` as `d6.png`; D10 uses `d10.jpg`.
- Ship generator icon remains `11872755.png` as `ship-generator-icon.png`.
- Multiple button rows are left-aligned.
- Header remains compact from the prior patch.
- Removed the visible `Table Output` heading to conserve space.


Patch includes: ship icon update, entity overview/revealed toolbar buttons, entity directory filter, directory row alignment, Scene Elements rename, icon-only action buttons, unified journal/copy icons, collapse-oracles filter-row placement, and compact insert-image button styling.


## File organization

This build uses root `index.html`, `css/style.css`, `js/app.js`, `js/tables.js`, and `img/` for icons and image assets.

## Added in this build

- Entity List left-side tab with filter and Show Editor button.
- Drag entities from Entity List or Entity Directory into editors to insert an entity reference.
- Type `@` in editors to open an entity picker and insert a reference.


Update: Entity List is now the default left view; Entity Tracker uses a left-side directory and right-side editor without collapsing center/right panels.


## Patch notes
- Entity Directory is the default left view.
- Removed separate Entity List tab treatment.
- Selecting an entity opens the Entity Editor as an overlay card across the center/right workspace while preserving the middle and right sections.


Update: Crew Link now spans the left and center workspace, Entity Tracker navigation was removed, and Entity Directory is presented as Entity Library in the left pane.


Patch: top navigation reordered to Entities, Crew, Journal, Oracle, Builder, Elements, Ship; Library renamed Entities; Journal/Scene Elements tabs moved to a right-aligned control row with the active label on the left.


## Update: Sticky Header/Nav
- Header and top navigation remain locked in place while scrolling.
- Main workspace is kept aligned to the top when tabs/cards update.
- Removed downward scroll jumps from navigation actions.

## 2026-06-23 Document Library PDF Viewer

This build reverts to the `hostilejournal-import-export-working-plus-entities` baseline and adds a native Document Library in the right-side Oracles panel.

- Use the right-panel **Documents** tab beside **Oracles**.
- Upload one or more PDFs with **Upload PDF**.
- PDFs are stored locally in the browser using IndexedDB, while the campaign JSON stores document metadata.
- Click **Open** to show the PDF in an expanding viewer card over the left and middle workspace, leaving the right Oracles/Documents panel accessible.
- Click **Open** in the viewer toolbar to launch the PDF in a browser tab, or **×** / Escape to close the overlay.

Note: browser PDF rendering depends on the built-in PDF viewer for the browser. Export Campaign JSON preserves document names/metadata, but the PDF binary files remain in local browser storage and should be re-uploaded if you move browsers/devices.

## PDF @ Links

Rich text editors now support PDF references through the existing `@` mention popup. Upload PDFs in the right-side Documents tab, then type `@` in a rich editor and select a PDF document. The app prompts for a page number and inserts a clickable PDF link. Clicking the link opens the PDF viewer directly to that page when the browser PDF engine supports page anchors.


### Document Library update
- PDFs now support comma-separated tags on upload and per-document tag editing.
- Search matches PDF names and tags; tag chips filter groups of documents.
- Duplicate uploads are skipped using the PDF filename and file size fingerprint.
- `@` PDF links now replace the typed trigger text, preventing orphaned text such as `@colony-` before the inserted link.

### Document Library list update
- PDFs are sorted alphabetically by file name.
- Size/date details are hidden to make the list denser.
- Document rows use compact padding so more PDFs are visible at once.

## Document Library Guide and tag dropdown update

- Document tag inputs now use the existing document tag catalog as suggestions.
- Each uploaded PDF row includes an existing-tag dropdown for quickly adding tags already used by other documents.
- The right panel now includes a Guide tab beside Oracles and Documents.
- The Guide tab is a rich text editor saved in the Hostile JSON/local state and supports the same @ document links used by journal/comment editors, including PDF page targets.
