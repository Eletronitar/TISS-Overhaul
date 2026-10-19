# TISS Overhaul

Ein Violentmonkey-Userscript, das TU Wiens [TISS](https://tiss.tuwien.ac.at) neu gestaltet und um Funktionen erweitert, die TISS selbst nicht hat.

## Installation

1. Browser-Erweiterung [Violentmonkey](https://violentmonkey.github.io/) installieren (Firefox, Chrome, Edge – auch Firefox auf Android).
2. Die neueste `tiss-overhaul_vX.Y.user.js` aus [Releases](../../releases) öffnen – Violentmonkey bietet die Installation automatisch an.
3. TISS neu laden. Das Zahnrad **Overhaul ⚙** in der oberen Leiste öffnet die Einstellungen.

## Funktionen

**Design** – neue Kopfzeile mit TU-Signet, farbige Bereichs-Tabs (Lehre / Forschung / Organisation), Seitenleiste mit einklappbarem „Extras“-Block, Pill-Buttons, Vollbreite ohne internes Scrollen.

**Favoriten** – ein-/ausklappbare und sortierbare Kategorien, Filter, Kompaktansicht (VO/VU/UE einer LVA in einer Zeile), Status-Badges für Anmeldung, Gruppen, Prüfungen und TUWEL (im Hintergrund geladen), Prüfungskarten mit Platz-Anzeige, Farbe pro LVA, LVA per Menü verschieben.

**Kalender** – Farben pro LVA (warm = UE, mittel = VU, kalt = VO; manuell überschreibbar), Legende als Filter-Chips mit Wochenstunden, „Nächster Termin“-Leiste mit Raum und Link auf die TU-Karte, eigenes Termin-Popup (Raum → Raumbelegung, exakter Karten-Link, TUWEL, Anmeldung, Prüfungen), nur die eigene Gruppe anzeigen, Prüfungen gestrichelt und zusammengefasst, Kompakt-Modus, .ics-Download.

**Offline-Kalender** – `https://www.tuwien.at/tiss-offline` zeigt den letzten Kalender-Snapshot auch wenn TISS down ist.

**Anmeldung** – Countdown bis zur Öffnung, Anmelden-Button oben, ⚡ automatische Anmeldung zum Öffnungszeitpunkt.

**Suche** – aufgeräumtes Formular, „Unscharfe Suche“ (Tippfehler-tolerant), Studienangebot mit einklappbaren Fakultäten und ★ „Meine Studien“.

Alles lässt sich in den Einstellungen einzeln abschalten; der oberste Schalter deaktiviert das Script komplett.

## Datenschutz

Das Script spricht nur mit `tiss.tuwien.ac.at` und `tuwel.tuwien.ac.at` (Status-Abfragen im Hintergrund mit deiner bestehenden Sitzung). Es sendet nichts an Dritte. Einstellungen, Farben und der Kalender-Snapshot liegen lokal im Browser (localStorage bzw. Violentmonkey-Speicher).

## Entwicklung

Eine Datei, kein Build. `node --check tiss-overhaul_vX.Y.user.js` prüft die Syntax. Die TU-Signets sind als Data-URIs eingebettet.

Die automatische Anmeldung ist konzeptionell an [TISS-Lightning-Registrator](https://github.com/The-breakbar/TISS-Lightning-Registrator) (GPL-3.0) angelehnt.

## Lizenz

[GPL-3.0](LICENSE)
