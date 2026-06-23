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
