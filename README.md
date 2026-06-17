# Hostile Scene Chain Oracle

Standalone local HTML/JavaScript app for solo sci-fi scene generation and sequential event chaining.

## What changed

- Added a comprehensive integrated worldbuilding oracle library.
- Added a nested, collapsible table browser.
- Added grouped Districts node with district type subfolders: Access, Community, Engineering, Living, Medical, Operations, Production, Research, Security, Commercial.
- Added Starforged-style category coverage: Campaign, Core Oracles, Space Encounters, Planets, Settlements, Districts, Starships, Characters, Creatures, Factions, Derelicts, Vaults / Ruins, Location Themes, Missions, Conflict Architecture, and Miscellaneous.
- Tables are original, Hostile-inspired, and editable in `tables.js`.

## Run locally

Open `index.html` in a modern browser.

## OneDrive use

On Windows Chrome/Edge, click **Bind Save File / OneDrive Folder** and save the JSON file in a OneDrive-synced folder. On Android, use Export/Import JSON.


## Android rendering update

This build includes Android-focused layout and stylesheet changes:

- Uses a mobile-safe viewport setting with `interactive-widget=resizes-content`.
- Prevents Android Chrome input zoom by using 16px form controls.
- Adds touch-friendly 44px minimum controls.
- Uses a phone layout under 760px width.
- Uses a two-column tablet / landscape layout from 760px to 1200px.
- Keeps the wide desktop three-column layout over 1200px.
- Adds smooth touch scrolling for the oracle tree and scene log.
- Moves Table Output above the Worldbuilding Oracles tree.
- Adds Copy and Clear buttons for oracle table output.
- Oracle rolls now append until Clear is selected or the page is refreshed.

For closest Windows-like view on Android tablets, use Chrome or Edge in landscape mode. Desktop Site can help on some tablets, but is no longer required for usability.


## Mobile side panel update

This build adds collapsing side panels on mobile and smaller tablet widths:

- Builder opens as a left slide-out panel.
- Oracles open as a right slide-out panel.
- Save/Sync opens as a left slide-out panel.
- Output remains the main middle workspace.
- A sticky mobile tab bar provides Builder / Output / Oracles / Save buttons.
- Tapping outside a panel, pressing Close, or pressing Escape closes the panel.
- Generating a scene on mobile closes the panel so the new output is immediately visible.
