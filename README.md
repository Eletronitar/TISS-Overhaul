# TISS Overhaul

A Violentmonkey userscript that restyles TU Wien's [TISS](https://tiss.tuwien.ac.at) and adds the features it never had.

> **Heads-up:** this project is vibe-coded – written with an AI assistant, directed and tested by a single student, not a web developer. It works on my TISS; it may not work on yours. Please [report](../../issues) anything that breaks.

## Installation

1. Install the [Violentmonkey](https://violentmonkey.github.io/) browser extension (Firefox, Chrome, Edge – Firefox on Android works too).
2. Open [`tiss-overhaul.user.js`](https://raw.githubusercontent.com/Eletronitar/TISS-Overhaul/main/tiss-overhaul.user.js) – Violentmonkey offers to install it.
3. Reload TISS. The **Overhaul ⚙** gear in the top bar opens the settings.

Updates arrive automatically through Violentmonkey (`@updateURL` points at this file).

**TISS must be set to German.** The script reads TISS's own labels ("Anmeldung", "Prüfungen", "Externer Kalender", …) to find things on the page; with TISS in English most features silently do nothing. Switch the language in TISS's top bar.

## Features

**Design** – new header with the TU signet, colour-coded section tabs (Lehre / Forschung / Organisation), sidebar with a collapsible "Extras" block, pill buttons, full-width layout without inner scrolling.

**Favoriten** – collapsible and sortable categories, filter, compact view (VO/VU/UE of one course on one row), status badges for registration, groups, exams and TUWEL (fetched in the background), readable exam cards with capacity bar, a colour per course, move courses via a menu.

**Calendar** – a colour per course (warm = UE, mid = VU, cold = VO; override by hand), legend as filter chips with weekly hours, "next event" bar with room and a link to the TU map, custom event popup (room → Raumbelegung, exact map link, TUWEL, registration, exams), show only your own group, exams dashed and merged, compact mode, .ics download.

**Offline calendar** – `https://www.tuwien.at/tiss-offline` shows the last calendar snapshot even when TISS is down.

**Registration** – countdown to the opening, register button at the top, ⚡ automatic registration at the opening time.

**Search** – tidied form, fuzzy search (typo-tolerant), Studienangebot with collapsible faculties and ★ "my programmes".

Every feature can be switched off individually in the settings; the top switch disables the script entirely.

## Privacy

The script only talks to `tiss.tuwien.ac.at` and `tuwel.tuwien.ac.at` (background status requests with your existing session). Nothing is sent to third parties. Settings, colours and the calendar snapshot stay in your browser (localStorage and Violentmonkey storage).

## Development

One file, no build step. `node --check tiss-overhaul.user.js` checks the syntax. The TU signets are embedded as data URIs.

The automatic registration is conceptually based on [TISS-Lightning-Registrator](https://github.com/The-breakbar/TISS-Lightning-Registrator) (GPL-3.0).

## License

[GPL-3.0](LICENSE)
