// ==UserScript==
// @name        TISS Overhaul
// @namespace   https://github.com/Eletronitar/TISS-Overhaul
// @version     1.1
// @description TU Wien TISS neu gestaltet und erweitert: Favoriten mit Status, Kalender mit Farben und Raum-Links, Offline-Kalender, Anmelde-Countdown und Auto-Anmeldung, unscharfe Suche, Einstellungen
// @author      Eletronitar
// @license     GPL-3.0
// @homepageURL https://github.com/Eletronitar/TISS-Overhaul
// @supportURL  https://github.com/Eletronitar/TISS-Overhaul/issues
// @updateURL   https://raw.githubusercontent.com/Eletronitar/TISS-Overhaul/main/tiss-overhaul.user.js
// @downloadURL https://raw.githubusercontent.com/Eletronitar/TISS-Overhaul/main/tiss-overhaul.user.js
// @match       https://tiss.tuwien.ac.at/*
// @match       https://www.tuwien.at/tiss-offline*
// @match       https://tuwien.at/tiss-offline*
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       unsafeWindow
// @connect     tuwel.tuwien.ac.at
// @run-at      document-start
// ==/UserScript==

(function () {
  'use strict';
  const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  // ---------------------------------------------------------------
  // SETTINGS — edit freely
  // ---------------------------------------------------------------
  const COURSE_COLORS = {
    // '104.297': '#1d4ed8',
  };
  // automatic calendar colours by course type: UE warm (attendance usually mandatory), VU in between, VO cold
  const WARM = ['#c2410c', '#dc2626', '#b91c1c', '#d97706', '#be185d', '#ea580c', '#9f1239'];
  const MID = ['#15803d', '#0d9488', '#4d7c0f', '#65a30d', '#0f766e', '#b45309', '#166534'];
  const COLD = ['#1d4ed8', '#6d28d9', '#0e7490', '#1e40af', '#7e22ce', '#0369a1', '#4338ca'];
  const PALETTE = [...COLD, ...MID, ...WARM];
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;  // 6 h

  const SIGNET_WHITE = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20283.44%20283.46'%3E%3Cpath%20fill='%23ffffff'%20fill-rule='evenodd'%20d='M202.75,138.27c0.46-0.08,0.8-0.14,1.25-0.25c11.39-2.89,19.88-13.87,19.88-26.08l-0.26-83.47h30.87v83.91c0.03,29.16-22.11,53.41-50.49,56.41l-1.25,0.13L202.75,138.27zM193.57,168.92l-1.6-0.13c-28.37-2.96-50.31-26.94-50.31-56.1V28.48h30.67l-0.05,83.47c0,12.21,8.49,23.19,19.88,26.08c0.5,0.12,0.89,0.2,1.4,0.29L193.57,168.92zM118.64,254.45v-49.89h-9.74v49.89H118.64zM184.86,254.45v-8.69h-23.12v-12.12h19.69v-8.69h-19.69v-11.7h23.12v-8.69H152v49.89H184.86zM254.63,254.45v-49.89h-9.74v30.55l-19.76-30.55h-8.69v49.89h9.74v-30.62l19.76,30.62H254.63zM85.72,204.56H75.56l-7.78,31.46l-9.11-31.46h-7.29l-9.11,31.46l-7.71-31.46H24.42l13.31,49.89h8.13l9.18-30.27l9.18,30.27h8.13L85.72,204.56zM21.79,28.48h105.86v30.27H21.79V28.48zM60.1,168.12V67.55h30.27v100.58H60.1zM255.11,0c15.65,0,28.29,12.7,28.29,28.36l0.06,226.74c0,15.66-12.74,28.36-28.39,28.36H28.34C12.7,283.46,0,270.77,0,255.11L0.02,28.36C0.02,12.7,12.68,0,28.32,0H255.11z'/%3E%3C/svg%3E";
  const SIGNET_BLUE = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20283.44%20283.46'%3E%3Cpath%20fill='%23006699'%20fill-rule='evenodd'%20d='M202.75,138.27c0.46-0.08,0.8-0.14,1.25-0.25c11.39-2.89,19.88-13.87,19.88-26.08l-0.26-83.47h30.87v83.91c0.03,29.16-22.11,53.41-50.49,56.41l-1.25,0.13L202.75,138.27zM193.57,168.92l-1.6-0.13c-28.37-2.96-50.31-26.94-50.31-56.1V28.48h30.67l-0.05,83.47c0,12.21,8.49,23.19,19.88,26.08c0.5,0.12,0.89,0.2,1.4,0.29L193.57,168.92zM118.64,254.45v-49.89h-9.74v49.89H118.64zM184.86,254.45v-8.69h-23.12v-12.12h19.69v-8.69h-19.69v-11.7h23.12v-8.69H152v49.89H184.86zM254.63,254.45v-49.89h-9.74v30.55l-19.76-30.55h-8.69v49.89h9.74v-30.62l19.76,30.62H254.63zM85.72,204.56H75.56l-7.78,31.46l-9.11-31.46h-7.29l-9.11,31.46l-7.71-31.46H24.42l13.31,49.89h8.13l9.18-30.27l9.18,30.27h8.13L85.72,204.56zM21.79,28.48h105.86v30.27H21.79V28.48zM60.1,168.12V67.55h30.27v100.58H60.1zM255.11,0c15.65,0,28.29,12.7,28.29,28.36l0.06,226.74c0,15.66-12.74,28.36-28.39,28.36H28.34C12.7,283.46,0,270.77,0,255.11L0.02,28.36C0.02,12.7,12.68,0,28.32,0H255.11z'/%3E%3C/svg%3E";

  // ---------------------------------------------------------------
  // SETTINGS (⚙ in the top bar). Stored in the browser, per device.
  // ---------------------------------------------------------------
  // storage: site-local (fast, per origin) and script-wide (survives TISS outages, shared with the offline page).
  // Both go through these two objects so a browser-extension port only has to swap their bodies.
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const vault = {
    get(k, d) { try { return typeof GM_getValue === 'function' ? (GM_getValue(k, d) ?? d) : d; } catch (e) { return d; } },
    set(k, v) { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); } catch (e) {} },
  };
  const OFFLINE = /tuwien\.at$/.test(location.hostname) && /\/tiss-offline/.test(location.pathname);
  const SETTINGS_KEY = 'tissOverhaul.settings';
  const OPTIONS = [
    { group: 'Allgemein' },
    { key: 'enabled', label: 'TISS Overhaul aktiv', hint: 'Schaltet alle Änderungen an dieser Seite ein oder aus.', def: true, master: true },
    { key: 'layout', label: 'Neues Design', hint: 'Kopfzeile, Seitenleiste, Bereichs-Tabs, Buttons und Tabellen.', def: true },
    { key: 'navExtras', label: 'Seitenleiste: selten Gebrauchtes unter „Extras“ zusammenfassen', hint: 'Best Teaching Awards, Vorregistrierung, Mobility Services, Unterstützungsangebote.', def: true },
    { key: 'keepAlive', label: 'Sitzung wach halten', hint: 'Fragt TISS alle 5 Minuten leise im Hintergrund ab, solange ein TISS-Tab offen ist – die Sitzung läuft nicht wegen Inaktivität ab. Hilft nicht gegen eine feste Höchstdauer.', def: true },
    { group: 'Favoriten' },
    { key: 'favStatus', label: 'Anmelde-, Gruppen- und Prüfungsstatus laden', hint: 'Holt den Status jeder LVA im Hintergrund (einmal alle 6 h).', def: true },
    { key: 'favTuwel', label: 'TUWEL-Inhalte prüfen', hint: 'Zeigt, ob und wie viel im TUWEL-Kurs schon steht.', def: true },
    { key: 'favCollapsed', label: 'Kategorien beim Öffnen eingeklappt', def: false },
    { key: 'merge', label: 'Kompaktansicht (VO/VU/UE einer LVA zusammenfassen)', hint: 'Entspricht dem Schalter auf der Favoriten-Seite.', def: false },
    { group: 'Kalender' },
    { key: 'calColors', label: 'Eigene Farbe pro LVA', def: true },
    { key: 'calHideWeekend', label: 'Samstag und Sonntag ausblenden', def: false },
    { key: 'calBlurToken', label: 'Kalender-Token verwischen', hint: 'Der Abo-Link unten auf der Kalenderseite ist privat.', def: true },
    { key: 'calNext', label: '„Nächster Termin“-Leiste mit Raum und Karte', def: true },
    { key: 'calPopup', label: 'Eigenes Termin-Popup statt TISS-Dialog', def: true },
    { key: 'calStart', label: 'Tagesbeginn im Raster (Stunde)', hint: 'Das Raster endet automatisch nach dem letzten Termin, frühestens 20 Uhr.', def: '7', text: true },
    { key: 'calCompact', label: 'Kompaktansicht standardmäßig an', def: false },
    { key: 'calExams', label: 'Prüfungstermine aus den Favoriten einblenden', hint: 'Nutzt die Daten der Favoriten-Seite (einmal öffnen genügt).', def: true },
    { key: 'calNoOverlap', label: 'Überschneidungen nebeneinander statt gestapelt', def: false },
    { key: 'calOwnGroup', label: 'Nur die eigene Gruppe anzeigen', hint: 'TISS zeigt alle Gruppentermine einer UE; die eigene Gruppe kommt von der Favoriten-Seite.', def: true },
    { group: 'Anmeldeseiten' },
    { key: 'regCountdown', label: 'Countdown bis Anmeldebeginn/-schluss', def: true },
    { key: 'regHeaderButton', label: 'Anmelden-Button in der Kopfzeile der Gruppe', def: true },
    { key: 'autoReg', label: '⚡ Automatische Anmeldung anbieten', hint: 'Meldet dich in der Sekunde an, in der die Anmeldung öffnet (Tab muss offen bleiben).', def: true },
    { key: 'studyCode', label: 'Studienkennzahl für die Anmeldung', hint: 'Nur nötig, wenn du in mehreren Studien inskribiert bist, z. B. 033245.', def: '', text: true },
    { group: 'Suche & Studienangebot' },
    { key: 'fuzzy', label: 'Unscharfe Suche standardmäßig an', def: false },
    { key: 'searchAdvanced', label: 'Erweiterte Suche automatisch öffnen', def: false },
    { key: 'studyCollapsed', label: 'Studienangebot: Kategorien eingeklappt', def: true },
    { key: 'studyPinned', label: 'Studienangebot: „Meine Studien“ oben anzeigen', def: true },
  ];
  const DEFAULTS = Object.fromEntries(OPTIONS.filter(o => o.key).map(o => [o.key, o.def]));
  const S = Object.assign({}, DEFAULTS, store.get(SETTINGS_KEY, {}));
  const saveSettings = () => store.set(SETTINGS_KEY, S);
  const HIDE_WEEKEND = !!S.calHideWeekend;

  // ---------------------------------------------------------------
  // 1. GLOBAL STYLE
  // ---------------------------------------------------------------
  const settingsCss = `
    .tiss-gear { display:inline-flex !important; align-items:center; gap:6px; cursor:pointer; }
    .tiss-gear svg { width:15px; height:15px; }
    .tiss-set-mask { position:fixed; inset:0; background:rgba(15,30,45,.35); z-index:99990; }
    .tiss-set { position:fixed; top:0; right:0; bottom:0; width:min(420px, 94vw); background:#fff; z-index:99991; box-shadow:-8px 0 30px rgba(0,0,0,.25); display:flex; flex-direction:column; font:14px/1.4 "Segoe UI", Roboto, Arial, sans-serif; color:#1f2933; }
    .tiss-set-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #e3e7eb; }
    .tiss-set-head b { font-size:17px; }
    .tiss-set-head button { background:transparent; border:0; font-size:22px; cursor:pointer; color:#6b7280; line-height:1; }
    .tiss-set-body { overflow:auto; padding:6px 20px 20px; flex:1; }
    .tiss-set-group { margin:18px 0 6px; font-size:11px; font-weight:700; letter-spacing:.6px; text-transform:uppercase; color:#6b7280; }
    .tiss-set-row { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:9px 0; border-bottom:1px solid #f0f2f5; }
    .tiss-set-row.master { background:#eef4fa; margin:10px -20px 0; padding:14px 20px; border-bottom:0; border-radius:0; }
    .tiss-set-row.master .tiss-set-label { font-weight:700; font-size:15px; }
    .tiss-set-row small { display:block; color:#6b7280; font-size:12px; margin-top:2px; }
    .tiss-set-row input[type=text] { width:120px; padding:6px 8px; border:1px solid #cbd2d9; border-radius:8px; font-size:14px; }
    .tiss-set.off .tiss-set-row:not(.master) { opacity:.4; pointer-events:none; filter:grayscale(1); }
    .tiss-set-foot { padding:14px 20px; border-top:1px solid #e3e7eb; display:flex; gap:10px; align-items:center; justify-content:space-between; }
    .tiss-set-foot button { background:#eef1f4 !important; background-image:none !important; color:#1f2933 !important; border:0 !important; border-radius:999px !important; padding:9px 16px !important; font:600 14px/1.2 inherit !important; font-family:inherit !important; cursor:pointer; box-shadow:none !important; text-shadow:none !important; }
    .tiss-set-foot button.hot { background:#006699 !important; color:#fff !important; }
    .tiss-set-foot span { color:#6b7280; font-size:12px; }
    .tiss-sw { position:relative; display:inline-block; width:38px; height:22px; flex:none; }
    .tiss-sw input { position:absolute; opacity:0; width:0; height:0; }
    .tiss-sw i { position:absolute; inset:0; border-radius:999px; background:#cbd2d9; border:1px solid #aeb8c2; transition:background .15s; cursor:pointer; }
    .tiss-sw i::after { content:""; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.3); transition:transform .15s; }
    .tiss-sw input:checked + i { background:#006699; border-color:#006699; }
    .tiss-sw input:checked + i::after { transform:translateX(16px); }
  `;
  const css = !S.enabled ? '' : `
    :root { --t-blue:#006699; --t-blue-dark:#004d73; --t-orange:#e07b16; --t-green:#5f9b2c; --t-purple:#6b3fa0; --t-bg:#f4f6f8; --t-side:#f3f6f9; --t-border:#e3e7eb; --t-text:#1f2933; --t-muted:#6b7280; --t-sec:var(--t-orange); }
    body.forschung { --t-sec:var(--t-green); }
    body.organisation { --t-sec:var(--t-purple); }
    html { background:var(--t-bg) !important; }
    body.lehre, body.forschung, body.organisation { background:var(--t-bg) !important; color:var(--t-text); font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important; }
    #glow_left, #glow_right, #shadow_top, #footerShadow-left, #footerShadow-right { display:none !important; }
    /* ---------- footer: drop the sprite blocks, keep the links ---------- */
    #footer, #footerContent, #footerShadow, #footer-left, #footer-right, #pageEnd, #baseLinks, #legalInfo { background:none !important; background-image:none !important; border:0 !important; box-shadow:none !important; height:auto !important; min-height:0 !important; float:none !important; position:static !important; }
    #footerContent, #footer-left, #footer-right, #pageEnd { display:none !important; }
    #footer { margin:0 !important; padding:0 !important; width:auto !important; }
    #footerShadow { display:block !important; width:auto !important; margin:0 !important; padding:22px 36px 30px !important; border-top:1px solid var(--t-border) !important; text-align:center; color:var(--t-muted) !important; font-size:12px !important; line-height:1.7; }
    #baseLinks { margin:0 0 4px !important; padding:0 !important; width:auto !important; }
    #baseLinks a { color:var(--t-muted) !important; font-weight:600; text-decoration:none !important; margin:0 4px; }
    #baseLinks a:hover { color:var(--t-blue) !important; }
    #legalInfo { margin:0 !important; padding:0 !important; width:auto !important; color:var(--t-muted) !important; }
    #legalInfo .versionInfo { display:block; opacity:.7; }
    /* TISS gives these fixed/100% widths with content-box sizing, so padding would push the content under the tab column */
    #content, #contentInnerWrapper, #contentInner { width:auto !important; max-width:none !important; min-width:0 !important; box-sizing:border-box !important; }
    #contentInner { padding:20px 28px 24px 28px !important; }
    #contentInner > *, #contentInner form, #contentInner .ui-datatable, #contentInner table { max-width:100%; }
    #contentInner h1 { font-size:26px !important; font-weight:600 !important; border-bottom:2px solid var(--t-border) !important; padding-bottom:10px !important; }
    #contentInner h1 .light { color:var(--t-muted) !important; font-weight:400 !important; }
    #subHeader { color:var(--t-muted) !important; margin-top:6px !important; }
    a:not(.fc-event) { color:var(--t-blue) !important; }

    ${!S.layout ? '' : `
    /* ---------- header: TU Wien signet + "Informations-Systeme & Services" ---------- */
    #header { position:relative !important; overflow:hidden !important; }
    #header, #headerInnerWrapper, #headerInner, #headerLeft, #headerLeftInside, #logo, #logo h1, #logo h1 a { border:0 !important; box-shadow:none !important; outline:0 !important; }
    #headerLeft::before, #headerLeft::after, #headerLeftInside::before, #headerLeftInside::after, #logo::before, #logo::after, #logo h1::before, #logo h1::after { content:none !important; display:none !important; }
    #headerLeft, #headerLeftInside, #logo, #logo h1 { background:none !important; background-image:none !important; }
    #headerLeft { display:flex !important; align-items:center; border-left:6px solid var(--t-sec) !important; box-sizing:border-box; }
    /* top-right: link to the TU Wien main site, made recognisable as such */
    #tuLogo { display:block !important; position:absolute !important; top:12px; right:14px; left:auto !important; z-index:5; width:auto !important; height:auto !important; margin:0 !important; padding:0 !important; background:none !important; background-image:none !important; }
    #tuLogo a { display:flex !important; align-items:center; gap:8px; width:auto !important; height:auto !important; padding:5px 12px 5px 7px !important; border-radius:999px; background:rgba(255,255,255,.14) !important; background-image:none !important; border:1px solid rgba(255,255,255,.4) !important; color:#fff !important; font:600 12px/1 "Segoe UI", Roboto, Arial, sans-serif; letter-spacing:.3px; text-indent:0 !important; text-decoration:none !important; backdrop-filter:blur(4px); transition:background .15s; }
    #tuLogo a:hover { background:rgba(255,255,255,.28) !important; }
    #tuLogo a::before { content:""; width:24px; height:24px; flex:none; background:url("${SIGNET_WHITE}") center/contain no-repeat; }
    #tuLogo a::after { content:"tuwien.at ↗"; }
    #headerLeftInside { padding:0 0 0 22px !important; margin:0 !important; width:auto !important; height:auto !important; }
    #logo { position:static !important; margin:0 !important; padding:0 !important; width:auto !important; height:auto !important; }
    #logo h1 { margin:0 !important; padding:0 !important; }
    #logo h1 a { display:flex !important; align-items:flex-end; gap:12px; width:auto !important; height:auto !important; margin:0 !important; padding:0 !important;
      background:none !important; background-image:none !important; text-indent:0 !important; clip-path:none !important; overflow:visible !important; text-decoration:none !important; }
    #logo h1 a::before { content:""; display:block; width:54px; height:54px; flex:none; background:url("${SIGNET_WHITE}") center/contain no-repeat; }
    #logo h1 a::after { content:"Informations-Systeme\\A& Services"; white-space:pre; color:#fff !important; font:400 12.5px/1.35 Arial, Helvetica, sans-serif; letter-spacing:.09em; text-transform:uppercase; padding-bottom:3px; }
    /* ---------- page columns: sidebar | content | section tabs — redrawn, no sprites ---------- */
    #contentWrapper { display:flex !important; align-items:stretch; background:#fff !important; background-image:none !important; }
    #contentInnerWrapper { background:none !important; background-image:none !important; }
    #supNav { float:none !important; position:relative !important; left:auto !important; top:auto !important; flex:0 0 240px; align-self:stretch; width:240px !important; height:auto !important; min-height:100%; margin:0 !important; padding:0 0 0 6px !important;
      background:var(--t-side) !important; background-image:none !important; box-sizing:border-box; overflow:hidden !important; z-index:2; }
    #supNav::before { content:""; position:absolute; left:0; top:0; bottom:0; width:6px; background:var(--t-sec); z-index:5; }
    #content { float:none !important; flex:1 1 auto; min-width:0; margin:0 !important; width:auto !important; background:#fff !important; background-image:none !important; }
    #mainNav { order:3; float:none !important; position:relative !important; flex:0 0 56px; align-self:stretch; width:56px !important; height:auto !important; margin:0 !important; padding:0 0 0 6px !important;
      background:#fff !important; background-image:none !important; box-sizing:border-box; z-index:3; }
    #mainNav::before { content:""; position:absolute; left:0; top:0; bottom:0; width:6px; background:var(--t-sec); z-index:5; box-shadow:-1px 0 0 rgba(0,0,0,.06); }
    /* the three section tabs form one connected stack; the current section is the vivid one */
    #mainNav > div { position:sticky; top:0; display:flex; flex-direction:column; gap:0; padding:0; margin:0; width:44px !important; height:auto !important; background:none !important; background-image:none !important;
      border-radius:0 0 14px 0; overflow:hidden; box-shadow:2px 2px 8px rgba(0,0,0,.16); }
    #mainNav a { position:static !important; display:flex !important; align-items:center; gap:12px; writing-mode:vertical-rl; width:44px !important; height:auto !important; min-height:150px;
      margin:0 !important; padding:16px 0 18px !important; border:0 !important; border-radius:0 !important; box-shadow:none !important;
      background-image:none !important; text-indent:0 !important; overflow:visible !important; color:#fff !important; font:700 12px/1 "Segoe UI", Roboto, Arial, sans-serif !important;
      letter-spacing:2px; text-transform:uppercase; text-decoration:none !important; transform:none !important; transition:filter .15s, opacity .15s; box-sizing:border-box; opacity:.72; }
    #mainNav a + a { border-top:1px solid rgba(255,255,255,.5) !important; }
    #mainNav a::before { content:""; width:22px; height:22px; display:block; flex:none; background:center/contain no-repeat; }
    #mainNav a:hover { opacity:1; filter:brightness(1.06); }
    body.lehre #mainNav a#lehreLink, body.forschung #mainNav a#forschungLink, body.organisation #mainNav a#organisationLink { opacity:1; }
    #mainNav a#lehreLink { background:var(--t-orange) !important; }
    #mainNav a#lehreLink::before { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 10L12 5 2 10l10 5 10-5z'/%3E%3Cpath d='M6 12v5c3 3 9 3 12 0v-5'/%3E%3C/svg%3E"); }
    #mainNav a#forschungLink { background:var(--t-green) !important; }
    #mainNav a#forschungLink::before { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3'/%3E%3Cpath d='M7 15h10'/%3E%3C/svg%3E"); }
    #mainNav a#organisationLink { background:var(--t-purple) !important; }
    #mainNav a#organisationLink::before { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='9' cy='8' r='3.5'/%3E%3Cpath d='M2.5 20a6.5 6.5 0 0 1 13 0'/%3E%3Ccircle cx='17' cy='9' r='2.5'/%3E%3Cpath d='M16 20h5.5a5 5 0 0 0-4.5-5.9'/%3E%3C/svg%3E"); }

    /* ---------- left nav ---------- */
    #supNavHeaderWrapper, #supNavHeader { display:none !important; }
    #supNavBody { font-size:13px !important; line-height:1.35 !important; padding:10px 14px 28px 14px !important; margin:0 !important; width:auto !important; background:none !important; box-sizing:border-box; }
    #supNavBody > ul { margin:0 !important; padding:0 !important; }
    #supNavBody ul, #supNavBody li { white-space:normal !important; }
    #supNavBody a { display:block; padding:2px 6px 2px 0 !important; overflow-wrap:anywhere; }
    #supNavBody > ul > li { margin:0 !important; padding:12px 0 !important; }
    #supNavBody > ul > li + li { border-top:2px solid #dbe3ea; }
    #supNavBody > ul > li > span > a.supNavMenuHeader { display:block; font-weight:800 !important; color:#fff !important; background:var(--t-blue); font-size:11px !important; text-transform:uppercase; letter-spacing:.7px; padding:6px 14px !important; margin:0 0 8px 0 !important; border-radius:999px; width:fit-content; max-width:100%; box-sizing:border-box; }
    #supNavBody > ul > li > span > a.supNavMenuHeader:hover { background:var(--t-blue-dark); color:#fff !important; }
    #supNavBody ul.linkBlock a { font-size:14px !important; padding-left:14px !important; }
    #supNavBody ul.linkBlock li { padding:1px 0 !important; }
    #supNavBody ul.linkBlock li.currentPageItem { background:#e3edf5 !important; border-radius:6px !important; }
    #supNavBody ul.linkBlock li.currentPageItem a { color:var(--t-blue-dark) !important; font-weight:600 !important; }
    #supNavBody a:hover { text-decoration:none !important; color:var(--t-orange) !important; }
    #supNavBody a[href^="http"]:not(.supNavMenuHeader)::after, #supNavBody li:only-child > span > a.supNavMenuHeader[href^="http"]::after { content:"↗"; margin-left:6px; font-size:11px; opacity:.8; }
    .tiss-extras-head { background:#b9d0e3 !important; color:#123f5e !important; display:inline-flex !important; align-items:center; gap:6px; }
    .tiss-extras-head:hover { background:#a3c2da !important; color:#123f5e !important; }
    .tiss-extras-head .tiss-chev { font-style:normal; width:auto; color:inherit; }
    .tiss-extras:not(.open) .tiss-extras-head .tiss-chev { transform:rotate(-90deg); }
    .tiss-extras-list { display:none; margin:4px 0 0 !important; padding:0 !important; }
    .tiss-extras.open .tiss-extras-list { display:block; }
    .tiss-extras-list > li { padding:8px 0 0 !important; margin:0 !important; }
    .tiss-extras-list > li > span > a.supNavMenuHeader { display:block; font-size:11px !important; font-weight:700 !important; text-transform:uppercase; letter-spacing:.6px; color:var(--t-muted) !important; padding:2px 0 2px 14px !important; }
    `}

    /* buttons & inputs */
    input[type=submit], input[type=button], button.ui-button, .primaryButton, .fc-button {
      background:var(--t-blue) !important; color:#fff !important; border:0 !important; border-radius:999px !important;
      padding:8px 18px !important; font-weight:600 !important; font-size:14px !important; cursor:pointer !important;
      box-shadow:none !important; background-image:none !important; text-shadow:none !important;
    }
    input[type=submit]:hover, button.ui-button:hover, .fc-button:hover { background:var(--t-blue-dark) !important; }
    input[type=text], .ui-inputfield { border:1px solid #cbd2d9 !important; border-radius:999px !important; padding:8px 14px !important; font-size:14px !important; box-sizing:border-box; background:#fff; }
    input[type=text]:focus, .ui-inputfield:focus { outline:0; border-color:var(--t-blue) !important; box-shadow:0 0 0 3px rgba(0,102,153,.15); }
    select { border:1px solid #cbd2d9 !important; border-radius:999px !important; padding:7px 30px 7px 14px !important; font-size:14px !important; background:#fff !important; color:var(--t-text); box-sizing:border-box; appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236b7280' stroke-width='1.6'/%3E%3C/svg%3E") !important; background-repeat:no-repeat !important; background-position:right 12px center !important; }
    .ui-calendar input.hasDatepicker { width:124px !important; padding-right:32px !important; background-image:none !important; }
    .ui-calendar .ui-datepicker-trigger { position:relative; left:-30px; vertical-align:middle; width:22px; height:22px; border:0 !important; padding:0 !important; margin:0 !important; background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M16 3v4M8 3v4M3 10h18'/%3E%3C/svg%3E") center/17px no-repeat !important; overflow:hidden; cursor:pointer; }
    .ui-calendar .ui-datepicker-trigger img, .ui-calendar .ui-datepicker-trigger span { opacity:0; width:22px; height:22px; display:block; }

    /* tabs on course pages */
    #pageNav ul.ui-tabs-nav { border:0 !important; background:none !important; display:flex; gap:6px; padding:0 !important; margin:18px 0 !important; }
    #pageNav ul.ui-tabs-nav li { border:0 !important; background:#eef1f4 !important; border-radius:999px !important; margin:0 !important; }
    #pageNav ul.ui-tabs-nav li a { padding:8px 16px !important; display:block; color:var(--t-text) !important; text-decoration:none !important; font-weight:500; background:transparent !important; background-image:none !important; border:0 !important; margin:0 !important; }
    #pageNav ul.ui-tabs-nav li.ui-tabs-selected { background:var(--t-blue) !important; background-image:none !important; }
    #pageNav ul.ui-tabs-nav li.ui-tabs-selected a { color:#fff !important; }

    /* tables */
    .ui-datatable table { border-collapse:separate !important; border-spacing:0 !important; width:100%; border:1px solid var(--t-border) !important; border-radius:10px !important; overflow:hidden; }
    .ui-datatable th { background:#f8fafc !important; color:var(--t-muted) !important; font-weight:600 !important; font-size:12px !important; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px !important; border:0 !important; border-bottom:1px solid var(--t-border) !important; }
    .ui-datatable td { padding:10px 12px !important; border:0 !important; border-bottom:1px solid var(--t-border) !important; vertical-align:middle !important; }
    .ui-datatable tr.ui-datatable-odd td { background:#fbfcfd !important; }
    .ui-datatable tbody tr:hover td { background:#eef6fb !important; }
    .ui-datatable tfoot td { background:#f8fafc !important; font-weight:600; }
    .favoritesTitleCol a { font-weight:600 !important; font-size:15px; }
    td.favoritesReg, td.favoritesExam, td.favoritesLinks { white-space:nowrap; }
    .tiss-badge.two { white-space:normal; text-align:center; line-height:1.3; padding:4px 9px; }
    td.favoritesReg img, td.favoritesGrp img { vertical-align:middle; }

    /* badges */
    .tiss-badge { display:inline-block; font-size:11px; font-weight:600; padding:2px 7px; border-radius:999px; background:#dcfce7; color:#166534; margin:1px 0 1px 4px; white-space:nowrap; vertical-align:middle; }
    .tiss-badge.ok { background:#dcfce7; color:#166534; }
    .tiss-badge.open { background:#dbeafe; color:#1e40af; }
    .tiss-badge.wait { background:#fef3c7; color:#92400e; }
    .tiss-badge.none { background:#f1f5f9; color:#64748b; font-weight:500; }
    .tiss-badge.bad { background:#fee2e2; color:#991b1b; }
    .tiss-badge.load { background:#f1f5f9; color:#94a3b8; }
    a.tiss-badge { text-decoration:none !important; }
    a.tiss-badge:hover { filter:brightness(.92); }
    .tiss-badge small { font-weight:500; opacity:.85; }

    /* exam cell: date · status, capacity bar, further dates */
    td.favoritesExam:has(.tiss-st) > :not(.tiss-st) { display:none !important; }
    .tiss-exam, .tiss-exam * { white-space:nowrap; }
    .tiss-exam { display:inline-flex; flex-direction:column; gap:3px; min-width:128px; padding:6px 9px; border-radius:9px; background:#f1f5f9; color:var(--t-text) !important; text-decoration:none !important; font-size:12px; line-height:1.2; vertical-align:middle; }
    .tiss-exam:hover { filter:brightness(.96); }
    .tiss-exam-top { display:flex; justify-content:space-between; gap:10px; align-items:baseline; }
    .tiss-exam-top b { font-size:13px; }
    .tiss-exam-st { font-weight:600; font-size:11px; }
    .tiss-exam.open { background:#e4eefc; } .tiss-exam.open .tiss-exam-st { color:#1e40af; }
    .tiss-exam.ok { background:#dff5e6; } .tiss-exam.ok .tiss-exam-st { color:#166534; }
    .tiss-exam.full { background:#fde8e8; } .tiss-exam.full .tiss-exam-st { color:#991b1b; }
    .tiss-exam.none .tiss-exam-st { color:var(--t-muted); }
    .tiss-cap { display:block; height:5px; border-radius:999px; background:rgba(0,0,0,.09); overflow:hidden; }
    .tiss-cap i { display:block; height:100%; border-radius:999px; background:#2563eb; }
    .tiss-exam.ok .tiss-cap i { background:#16a34a; } .tiss-exam.full .tiss-cap i { background:#dc2626; } .tiss-exam.none .tiss-cap i { background:#94a3b8; }
    .tiss-exam-sub { display:flex; justify-content:space-between; gap:10px; color:var(--t-muted); font-size:11px; }

    /* course search page */
    #courseList fieldset.styledFieldset { border:1px solid var(--t-border) !important; border-radius:14px !important; background:#f8fafc !important; padding:18px 24px 22px !important; margin:16px 0 0 !important; }
    #courseList fieldset.styledFieldset legend { font-weight:600 !important; font-size:15px !important; padding:0 8px !important; color:var(--t-text) !important; }
    #courseList fieldset ol { display:grid !important; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px 28px; margin:0 !important; padding:0 !important; list-style:none; }
    #courseList\\:extSearchPanel, #courseList\\:quickSearchPanel { display:contents; }
    #courseList fieldset ol li { display:flex !important; flex-direction:column; gap:5px; margin:0 !important; padding:0 !important; float:none !important; width:auto !important; }
    #courseList fieldset ol li label { font-size:11px !important; font-weight:700 !important; text-transform:uppercase; letter-spacing:.5px; color:var(--t-muted) !important; width:auto !important; float:none !important; text-align:left !important; margin:0 !important; padding:0 !important; }
    #courseList fieldset ol li input[type=text], #courseList fieldset ol li select { width:100% !important; max-width:none !important; margin:0 !important; }
    #courseList fieldset ol li > a { font-size:13px; align-self:flex-start; margin-top:2px; }
    #courseList fieldset ol li:has(> .formLabel) { flex-direction:row !important; flex-wrap:wrap; align-items:center; gap:8px 10px; }
    #courseList fieldset ol li:has(> .formLabel) > label { flex:0 0 100%; }
    #courseList fieldset ol li:has(> .formLabel) > select { width:auto !important; flex:1; }
    #courseList fieldset ol li:has(> .formLabel) > .formLabel { color:var(--t-muted); font-size:13px; }
    #courseList fieldset ol li:has(> input[type=submit]) { grid-column:1 / -1; flex-direction:row !important; flex-wrap:wrap; align-items:center; gap:10px 18px; margin-top:6px !important; padding-top:14px !important; border-top:1px solid var(--t-border); }
    #courseList input[type=submit] { font-size:15px !important; padding:10px 26px !important; }
    .tiss-fuzzy-hint { font-size:12px; color:var(--t-muted); flex-basis:100%; }
    #courseList fieldset ol li label.tiss-switch { text-transform:none !important; letter-spacing:0; font-size:14px !important; font-weight:500 !important; color:var(--t-text) !important; display:flex !important; flex-direction:row; align-items:center; gap:8px; }
    #courseList fieldset ol li > a.tiss-search-mode { display:inline-block; padding:6px 12px; border-radius:999px; background:#e6eef5; color:var(--t-blue-dark) !important; font-weight:600; text-decoration:none !important; margin-top:6px; }
    #courseList fieldset ol li > a.tiss-search-mode:hover { background:#d6e3ee; }
    /* advanced search: what → where/when */
    #courseList fieldset ol li:has(> label[for="courseList:courseTitleInp"]) { order:1; grid-column:1 / -1; }
    #courseList fieldset ol li:has(> label[for="courseList:courseNumberInp"]) { order:2; }
    #courseList fieldset ol li:has(> label[for="courseList:courseType"]) { order:3; }
    #courseList fieldset ol li:has(> label[for="courseList:courseLanguage"]) { order:4; }
    #courseList fieldset ol li:has(> label[for="courseList:courseLecturer"]) { order:5; }
    #courseList fieldset ol li:has(> label[for="courseList:faculties"]) { order:6; }
    #courseList fieldset ol li:has(> label[for="courseList:institutes"]) { order:7; }
    #courseList fieldset ol li:has(> .formLabel) { order:8; }
    #courseList fieldset ol li:has(> input[type=submit]) { order:9; }
    #courseList fieldset ol li:has(> label[for="courseList:courseTitleInp"]) input { max-width:720px !important; font-size:16px !important; padding:11px 14px !important; }

    /* LVA-Detailseite: quick links as buttons */
    ul.tiss-quicklinks { display:flex !important; flex-wrap:wrap; gap:10px; list-style:none !important; padding:0 !important; margin:16px 0 22px !important; }
    ul.tiss-quicklinks li { margin:0 !important; padding:0 !important; background:none !important; }
    ul.tiss-quicklinks li::before { content:none !important; }
    ul.tiss-quicklinks a { display:inline-block; padding:10px 18px; border-radius:999px; background:#eef1f4; color:var(--t-text) !important; font-weight:600; font-size:14px; text-decoration:none !important; }
    ul.tiss-quicklinks a:hover { background:#dfe5ea; }
    ul.tiss-quicklinks a.primary { background:var(--t-blue); color:#fff !important; font-size:16px; padding:12px 22px; }
    ul.tiss-quicklinks a.primary:hover { background:var(--t-blue-dark); }

    /* Studienangebot */
    .tiss-study { border:1px solid var(--t-border); border-radius:12px; margin-top:14px; background:#fff; overflow:hidden; }
    .tiss-study h2 { margin:0 !important; padding:12px 16px !important; display:flex; align-items:center; gap:10px; background:#f8fafc; cursor:pointer; user-select:none; font-size:17px !important; font-weight:600 !important; border:0 !important; }
    .tiss-study h2:hover { background:#eef3f7; }
    .tiss-study.collapsed .tiss-chev { transform:rotate(-90deg); }
    .tiss-study.collapsed > table { display:none; }
    .tiss-study.tiss-filter-open > table { display:table !important; }
    .tiss-study.tiss-filter-hidden { display:none; }
    .tiss-study table.standard { border:0 !important; margin:0 !important; width:100%; }
    .tiss-study table.standard th { background:#fff !important; color:var(--t-muted) !important; font-size:12px !important; text-transform:uppercase; letter-spacing:.4px; padding:8px 16px !important; border-bottom:1px solid var(--t-border) !important; }
    .tiss-study table.standard td { padding:9px 16px !important; border-bottom:1px solid #f0f2f5 !important; vertical-align:middle !important; }
    .tiss-study table.standard tr:hover td { background:#f6f9fc; }
    .tiss-study td.studyCodeNameColumn { display:flex; align-items:center; gap:8px; }
    .tiss-study td.studyCodeNameColumn a { flex:1; font-weight:500; }
    .tiss-pin { color:#b7c0ca !important; }
    .tiss-pin.on { color:#e07b16 !important; }
    .tiss-pin.on svg { fill:currentColor; }
    .tiss-study-filter { width:100%; max-width:520px; margin:16px 0 4px; }
    .tiss-study-mine { border:1px solid #f5d2a8; border-radius:12px; background:#fff8ee; padding:12px 16px 6px; margin-top:14px; }
    .tiss-study-mine h2 { margin:0 0 6px !important; font-size:15px !important; font-weight:700 !important; color:#9a4d07 !important; border:0 !important; }
    .tiss-mine-row { display:flex; align-items:center; gap:12px; padding:7px 0; border-top:1px solid #f5e2c8; }
    .tiss-mine-code { font-variant-numeric:tabular-nums; color:var(--t-muted); min-width:64px; }
    .tiss-mine-row a { flex:1; font-weight:600; font-size:15px; }

    /* ⚡ auto registration */
    .tiss-auto { background:#fff !important; color:#b45309 !important; border:2px solid #f59e0b !important; border-radius:999px !important; padding:7px 14px !important; font-weight:700 !important; font-size:13px !important; cursor:pointer; }
    .tiss-auto:hover { background:#fff7e6 !important; }
    .tiss-auto-panel { position:fixed; right:18px; bottom:18px; width:min(400px, 94vw); background:#fff; border:1px solid var(--t-border); border-radius:14px; box-shadow:0 14px 40px rgba(0,0,0,.22); z-index:99980; padding:14px 16px; font-size:14px; color:var(--t-text); }
    .tiss-auto-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .tiss-auto-head b { font-size:16px; }
    .tiss-auto-close { background:transparent !important; color:var(--t-muted) !important; border:0 !important; font-size:22px !important; padding:0 4px !important; line-height:1; }
    .tiss-auto-name { font-weight:600; color:var(--t-blue-dark); margin-bottom:10px; }
    .tiss-auto-panel label { display:flex; flex-direction:column; gap:4px; font-size:12px; font-weight:600; color:var(--t-muted); text-transform:uppercase; letter-spacing:.4px; margin:8px 0; }
    .tiss-auto-panel label input { font:14px "Segoe UI", Roboto, Arial, sans-serif; color:var(--t-text); border:1px solid #cbd2d9; border-radius:8px; padding:8px 10px; text-transform:none; letter-spacing:0; font-weight:400; }
    .tiss-auto-note { font-size:12px; color:var(--t-muted); margin:8px 0; }
    .tiss-auto-log { max-height:150px; overflow:auto; font:12px/1.4 ui-monospace, Consolas, monospace; background:#f8fafc; border-radius:8px; padding:8px 10px; margin:8px 0; min-height:40px; }
    .tiss-auto-log .ok { color:#166534; font-weight:700; } .tiss-auto-log .err { color:#991b1b; }
    .tiss-auto-foot { display:flex; gap:8px; align-items:center; }
    .tiss-auto-foot button { padding:8px 16px !important; }
    .tiss-auto-stop { background:#eef1f4 !important; color:var(--t-text) !important; }
    .tiss-auto-count { margin-left:auto; font-size:13px; color:var(--t-muted); font-variant-numeric:tabular-nums; }
    .tiss-fuzzy-banner { margin:14px 0 6px; padding:10px 14px; border-radius:10px; background:#eef4fa; color:var(--t-blue-dark); font-size:13px; display:flex; gap:14px; flex-wrap:wrap; align-items:center; }
    .tiss-fuzzy-banner b { font-weight:600; }
    .tiss-fuzzy-results { margin-top:8px; }
    .tiss-fuzzy-results td, .tiss-fuzzy-results th { padding:10px 12px !important; text-align:left; }
    .tiss-fuzzy-results td a { font-weight:600; }
    .tiss-sim { display:block; width:70px; height:6px; border-radius:999px; background:#e3e7eb; overflow:hidden; }
    .tiss-sim i { display:block; height:100%; background:var(--t-blue); }
    .tiss-fuzzy-none { padding:16px; color:var(--t-muted); }
    tr.tiss-weak { display:none; }
    tr.tiss-weak.tiss-show { display:table-row; }
    .tiss-weak-toggle { margin:6px 0 12px; font-size:13px; }

    /* Favoriten toolbar & groups */
    #contentForm\\:groupPanel:not([data-tiss-done]) { visibility:hidden; }   /* never show the raw TISS list while we restructure it */
    .tiss-fav-toolbar { display:flex; gap:8px; align-items:center; margin:22px 0 4px; flex-wrap:wrap; }
    .tiss-fav-toolbar input[type=text] { flex:1; min-width:220px; }
    .tiss-fav-toolbar button, .tiss-fav-toolbar input[type=submit] { background:#eef1f4 !important; color:var(--t-text) !important; padding:8px 12px !important; }
    .tiss-fav-toolbar button:hover, .tiss-fav-toolbar input[type=submit]:hover { background:#dfe5ea !important; }
    .tiss-fav-toolbar button[data-act=diag] { font-weight:500 !important; color:var(--t-muted) !important; }
    .tiss-fav-toolbar label { display:flex; align-items:center; gap:6px; font-size:14px; padding:0 6px; cursor:pointer; }
    .tiss-fav-group { border:1px solid var(--t-border); border-radius:12px; margin-top:16px; background:#fff; overflow:hidden; }
    .tiss-fav-group .subscriptionGroupHead { margin:0 !important; padding:12px 16px; display:flex; align-items:center; gap:10px; background:#f8fafc; user-select:none; }
    .tiss-fav-group .subscriptionGroupHead:hover { background:#eef3f7; }
    .tiss-fav-group .subscriptionGroupHead br { display:none; }
    #contentInner .tiss-fav-group h3.subscriptionGroupTitle { margin:0 !important; padding:0 !important; font-size:17px !important; font-weight:700 !important; color:var(--t-text) !important; text-transform:none !important; letter-spacing:0 !important; line-height:1.3 !important; }
    .tiss-chev { display:inline-block; transition:transform .15s; color:var(--t-muted); width:14px; }
    .tiss-fav-group.collapsed .tiss-chev { transform:rotate(-90deg); }
    .tiss-fav-meta { color:var(--t-muted); font-size:13px; }
    .tiss-fav-ctl { margin-left:auto; display:flex; gap:4px; }
    .tiss-fav-ctl button { background:transparent !important; color:var(--t-muted) !important; padding:2px 6px !important; font-size:12px !important; }
    .tiss-fav-ctl button:hover { color:var(--t-blue) !important; background:#e3edf5 !important; }
    .tiss-fav-group > div:not(.subscriptionGroupHead) { padding:0 12px 12px; }
    .tiss-fav-group.collapsed > div:not(.subscriptionGroupHead) { display:none; }
    .tiss-fav-group.tiss-filter-open > div:not(.subscriptionGroupHead) { display:block !important; }
    .tiss-fav-group.tiss-filter-hidden { display:none; }
    .tiss-fav-group .ui-datatable table { border:0 !important; table-layout:fixed !important; width:100% !important; }
    .tiss-fav-group .ui-datatable th, .tiss-fav-group .ui-datatable td { box-sizing:border-box !important; }
    .tiss-fav-group .ui-datatable th:nth-child(1), .tiss-fav-group .ui-datatable td:nth-child(1) { width:3%; }
    .tiss-fav-group .ui-datatable th:nth-child(2) { width:21%; }
    .tiss-fav-group .ui-datatable th:nth-child(3) { width:5.5%; }
    .tiss-fav-group .ui-datatable th:nth-child(4) { width:4.5%; }
    .tiss-fav-group .ui-datatable th:nth-child(5) { width:10%; }
    .tiss-fav-group .ui-datatable th:nth-child(6) { width:9.5%; }
    .tiss-fav-group .ui-datatable th:nth-child(7) { width:17%; }
    .tiss-fav-group .ui-datatable th:nth-child(8) { width:6%; }
    .tiss-fav-group .ui-datatable th:nth-child(9) { width:11%; }
    .tiss-fav-group .ui-datatable th:nth-child(10) { width:12.5%; }
    .tiss-fav-group .ui-datatable th { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .tiss-fav-group th:nth-child(8) { font-size:11px !important; letter-spacing:0; }
    .tiss-fav-group .ui-datatable td { overflow-wrap:anywhere; }
    .tiss-fav-group td.favoritesReg, .tiss-fav-group td.favoritesExam, .tiss-fav-group td.favoritesLinks, .tiss-fav-group td.favoritesGrp { white-space:normal; }
    .tiss-exam { min-width:0; width:100%; box-sizing:border-box; }

    /* action icons */
    th.favoritesActionCol2, td.favoritesActionCol2 { white-space:nowrap; }
    .tiss-actions { flex-wrap:nowrap; }
    .tiss-icon-color i { display:block; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1px rgba(0,0,0,.15); }
    .tiss-color-dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; vertical-align:middle; }
    .tiss-swatches { display:grid; grid-template-columns:repeat(7, 26px); gap:6px; padding:4px 10px 8px; }
    .tiss-menu .tiss-swatches button { width:26px !important; height:26px !important; border-radius:50% !important; padding:0 !important; border:2px solid #fff !important; box-shadow:0 0 0 1px rgba(0,0,0,.15); cursor:pointer; background:var(--c) !important; display:block; }
    .tiss-swatches button:hover { transform:scale(1.15); }
    .tiss-color-custom { display:flex !important; flex-direction:column; gap:6px; padding:6px 12px 8px; font-size:12px; color:var(--t-muted); border-top:1px solid var(--t-border); margin-top:4px; }
    .tiss-color-custom .row { display:flex; align-items:center; gap:8px; min-width:0; }
    .tiss-color-custom input[type=range] { flex:1 1 0; min-width:0; height:14px; border-radius:999px; appearance:none; -webkit-appearance:none; outline:0; border:1px solid rgba(0,0,0,.25); box-sizing:border-box; }
    .tiss-color-custom input.lum { background:linear-gradient(90deg, hsl(var(--hue,210),62%,18%), hsl(var(--hue,210),62%,66%)); }
    .tiss-color-custom input[type=range]::-webkit-slider-thumb { appearance:none; width:18px; height:18px; border-radius:50%; background:#fff; border:2px solid #475569; }
    .tiss-color-custom input[type=range]::-moz-range-thumb { width:16px; height:16px; border-radius:50%; background:#fff; border:2px solid #475569; }
    .tiss-color-custom input.hue { background:linear-gradient(90deg, hsl(0,70%,42%), hsl(60,70%,42%), hsl(120,70%,42%), hsl(180,70%,42%), hsl(240,70%,42%), hsl(300,70%,42%), hsl(360,70%,42%)); }
    .tiss-color-custom .sun { width:26px; height:26px; flex:none; display:inline-flex; align-items:center; justify-content:center; color:#475569; }
    .tiss-color-custom .sun svg { width:20px; height:20px; }
    .tiss-color-custom .prev { width:26px; height:26px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1px rgba(0,0,0,.15); flex:none; }
    .tiss-color-custom input.hex { flex:0 0 72px; width:72px; min-width:0; font:12px ui-monospace, monospace; padding:4px 6px !important; text-align:center; border-radius:999px !important; }
    .tiss-color-auto { color:var(--t-muted) !important; }
    td.favoritesActionCol2 > a[title="Verschieben"] { display:none !important; }
    .tiss-actions { display:flex; gap:5px; align-items:center; }
    .tiss-icon { display:inline-flex !important; align-items:center; justify-content:center; width:30px; height:30px; border-radius:999px; border:0; background:#eef1f4 !important; color:#4b5563 !important; cursor:pointer; vertical-align:middle; margin:0 !important; padding:0 !important; flex:none; }
    .tiss-icon:hover { background:#dbe4ec !important; color:var(--t-blue) !important; }
    .tiss-icon-trash:hover { background:#fee2e2 !important; color:#b91c1c !important; }
    .tiss-icon-sm { width:26px; height:26px; border-radius:999px; background:transparent !important; color:var(--t-muted) !important; }
    .tiss-icon-sm:hover { background:#e3edf5 !important; color:var(--t-blue) !important; }
    .tiss-diag { position:fixed; left:50%; top:12%; transform:translateX(-50%); width:min(900px, 90vw); height:60vh; z-index:99999; font:12px/1.4 ui-monospace, Consolas, monospace; padding:12px; border:1px solid var(--t-border); border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,.25); background:#fff; color:var(--t-text); }
    .tiss-menu { position:absolute; z-index:7000; min-width:200px; max-width:calc(100vw - 16px); box-sizing:border-box; background:#fff; border:1px solid var(--t-border); border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.14); padding:6px; }
    .tiss-menu-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--t-muted); padding:6px 10px 4px; }
    .tiss-menu button { display:block; width:100%; text-align:left; background:transparent !important; color:var(--t-text) !important; padding:8px 12px !important; border-radius:999px !important; font-weight:500 !important; }
    .tiss-menu button:hover { background:#eaf2f8 !important; }
    body.tiss-moving #contentForm\\:moveDialog, body.tiss-moving .ui-dialog-mask, body.tiss-moving .ui-widget-overlay { visibility:hidden !important; }

    /* toggle switch (label text left, slider right) */
    .tiss-switch { position:relative; }
    .tiss-switch input { position:absolute; opacity:0; width:0; height:0; }
    .tiss-switch .tiss-slider { order:2; margin-left:4px; }
    .tiss-slider { display:inline-block !important; width:36px !important; height:20px !important; border-radius:999px !important; background:#cbd2d9 !important; border:1px solid #aeb8c2 !important; box-sizing:border-box; position:relative; transition:background .15s; flex:none; padding:0 !important; }
    .tiss-slider::after { content:""; position:absolute; top:1px; left:1px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .15s; box-shadow:0 1px 2px rgba(0,0,0,.3); }
    .tiss-switch input:checked ~ .tiss-slider { background:var(--t-blue) !important; border-color:var(--t-blue) !important; }
    .tiss-switch input:checked ~ .tiss-slider::after { transform:translateX(16px); }

    /* merged courses (Kompaktansicht) */
    tr.tiss-merge-row { cursor:pointer; user-select:none; }
    tr.tiss-merge-row td { padding-top:7px !important; padding-bottom:7px !important; background:#f3f6fa !important; vertical-align:middle !important; }
    tr.tiss-merge-row:hover td { background:#e8eef5 !important; }
    tr.tiss-merge-row td.tiss-merge-handle { text-align:center; }
    tr.tiss-merge-row .tiss-chev { width:auto; font-size:16px; color:var(--t-blue); }
    tr.tiss-merge-row:not(.open) .tiss-chev { transform:rotate(-90deg); }
    .tiss-merge-title { font-weight:600; font-size:15px; color:var(--t-blue); }
    .tiss-badge.tiss-type { background:#e0e7ff; color:#3730a3; margin-left:6px; }
    .tiss-merge-hint { color:var(--t-muted); font-size:12px; white-space:normal; }
    .tiss-merge-hint .tiss-badge { margin:0 6px 0 0; font-style:normal; }
    .tiss-merge-hint .gray { margin-right:12px; }
    .tiss-merge-hinttext { font-style:italic; }
    tr.tiss-child { display:none; }
    tr.tiss-child.open { display:table-row; }
    tr.tiss-child.open td { background:#fafbfd !important; }
    tr.tiss-child.open td.favoritesTitleCol { padding-left:28px !important; border-left:3px solid #c7d2fe !important; }

    /* sign-up pages */
    .groupWrapper { border:1px solid var(--t-border) !important; border-radius:12px !important; overflow:hidden; margin-top:12px !important; background:#fff !important; }
    .groupHeaderWrapper { background:#f8fafc !important; padding:14px 18px !important; border-bottom:1px solid var(--t-border) !important; }
    .groupWrapper fieldset { padding:12px 18px 18px !important; border:0 !important; }
    .groupWrapper fieldset ol { margin:0 !important; padding:0 !important; }
    .groupWrapper fieldset li { display:flex !important; flex-wrap:wrap; align-items:baseline; gap:4px 12px; padding:8px 0 !important; border-bottom:1px dashed var(--t-border); }
    .groupWrapper fieldset li > * { margin:0 !important; float:none !important; }
    .groupWrapper fieldset li label { color:var(--t-muted) !important; flex:0 0 220px; width:auto !important; }
    .groupWrapper fieldset li table { margin-top:4px !important; }
    .groupWrapper fieldset div > li { border:0; }
    .groupWrapper .groupHeaderWrapper { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
    .groupWrapper .groupHeaderWrapper .rightLink { margin-left:auto !important; float:none !important; }
    .tiss-hdr-btn input[type=submit] { font-size:14px !important; padding:8px 18px !important; background:var(--t-orange) !important; margin:0 !important; }
    .tiss-hdr-btn input[type=submit]:hover { background:#c26a0f !important; }
    .groupWrapper fieldset input[type=submit] { font-size:16px !important; padding:12px 28px !important; background:var(--t-orange) !important; }
    .tiss-deadline { margin:14px 0 0; padding:12px 16px; border-radius:10px; background:#e6f0f6; color:var(--t-blue-dark); font-size:15px; display:flex; gap:18px; flex-wrap:wrap; align-items:center; }
    .tiss-deadline b { font-size:20px; }
    .tiss-deadline.soon { background:#fef3c7; color:#92400e; }
    .tiss-deadline.over { background:#fee2e2; color:#991b1b; }

    /* calendar */
    #calendarForm { border:1px solid var(--t-border); border-radius:14px; background:#fff; padding:12px 18px 18px; margin-top:12px; }
    #calendarForm fieldset.tableFilter { border:0 !important; border-radius:0 !important; background:none !important; padding:0 0 10px !important; margin:0 0 12px !important; border-bottom:1px solid var(--t-border) !important; display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
    #calendarForm fieldset.tableFilter ol { flex:1; }
    #subHeader:empty { display:none !important; }
    #calendarForm fieldset.tableFilter ol { display:flex; align-items:center; flex-wrap:wrap; gap:12px 22px; margin:0 !important; padding:0 !important; }
    #calendarForm fieldset.tableFilter .tiss-datefield { position:relative; display:inline-block; }
    #calendarForm fieldset.tableFilter .tiss-datefield .ui-calendar { display:inline-block; width:auto !important; }
    #calendarForm fieldset.tableFilter .tiss-datefield input.hasDatepicker { width:150px !important; padding-right:44px !important; }
    #calendarForm fieldset.tableFilter .tiss-datefield .ui-datepicker-trigger { display:none !important; }
    #calendarForm fieldset.tableFilter .tiss-datefield button.ui-button.tiss-refresh { position:absolute; right:9px; top:50%; transform:translateY(-50%); margin:0 !important; }
    #calendarForm fieldset.tableFilter li.tiss-empty { display:none !important; }
    #calendarForm fieldset.tableFilter select { width:auto !important; max-width:440px; }
    #calendarForm fieldset.tableFilter li { display:flex !important; align-items:center; gap:8px; margin:0 !important; padding:0 !important; float:none !important; }
    #calendarForm fieldset.tableFilter label { color:var(--t-muted) !important; font-size:12px !important; font-weight:700; text-transform:uppercase; letter-spacing:.5px; width:auto !important; float:none !important; }
    #calendarForm fieldset.tableFilter button.ui-button { background:transparent !important; color:var(--t-text) !important; width:28px; height:28px; padding:0 !important; border-radius:50% !important; }
    #calendarForm fieldset.tableFilter button.ui-button:hover { background:#eef1f4 !important; }
    #calendarForm fieldset.tableFilter button.ui-button .ui-button-text { display:block; font-size:0; width:28px; height:28px; background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231f2933' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-2.6-6.4'/%3E%3Cpath d='M21 3v6h-6'/%3E%3C/svg%3E") center/15px no-repeat; }
    #calendarForm fieldset.tableFilter a.rightAlign { float:none !important; margin-left:auto; display:inline-block; padding:7px 14px; border-radius:999px; background:#eef1f4; color:var(--t-text) !important; font-weight:600; font-size:13px; text-decoration:none !important; }
    #calendarForm fieldset.tableFilter a.rightAlign:hover { background:#dfe5ea; }
    .fc .fc-toolbar { margin:0 0 14px !important; padding:0; }
    .fc .fc-toolbar-title { font-size:22px !important; font-weight:700 !important; letter-spacing:-.2px; }
    .fc .fc-button-group { gap:4px; }
    .fc .fc-button, .fc .fc-button-primary, .fc .fc-button-primary:not(:disabled), .fc .fc-button-primary:disabled { background-color:#eef1f4 !important; background-image:none !important; color:var(--t-text) !important; text-transform:none !important; padding:8px 16px !important; border-radius:999px !important; border:0 !important; box-shadow:none !important; text-shadow:none !important; font-weight:600 !important; }
    .fc .fc-button:hover, .fc .fc-button-primary:not(:disabled):hover, .fc .fc-button-primary:not(:disabled):active { background-color:#dfe5ea !important; background-image:none !important; box-shadow:none !important; }
    .fc .fc-button:disabled { opacity:.45; }
    .fc .fc-button-active, .fc .fc-button-primary.fc-button-active, .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled).fc-button-active:hover { background-color:var(--t-blue) !important; background-image:none !important; color:#fff !important; box-shadow:none !important; }
    /* TISS styles the active view button with an id-level selector + gradient; out-specify it */
    html body #calendarForm\\:schedule .fc-button.fc-button-active, html body #calendarForm\\:schedule .fc-button-primary:not(:disabled).fc-button-active, html body #calendarForm\\:schedule .fc-button-primary:not(:disabled):active, html body #calendarForm\\:schedule .fc-button-primary:not(:disabled).fc-button-active:hover,
    html body #calendarForm\\:schedule .fc-button-primary:not(:disabled):focus, html body #calendarForm\\:schedule .fc-button-primary:not(:disabled).fc-button-active:focus { background:var(--t-blue) !important; background-image:none !important; color:#fff !important; border:0 !important; box-shadow:none !important; text-shadow:none !important; }
    html body #calendarForm\\:schedule .fc-button-primary:not(:disabled):not(.fc-button-active):not(.fc-prev-button):not(.fc-next-button):not(.fc-today-button) { background-color:#eef1f4 !important; background-image:none !important; color:var(--t-text) !important; border:0 !important; }
    html body #calendarForm\\:schedule .fc-button-primary:not(:disabled):not(.fc-button-active):not(.fc-today-button):hover { background-color:#dfe5ea !important; }
    html body #calendarForm\\:schedule .fc-button.fc-prev-button, html body #calendarForm\\:schedule .fc-button.fc-next-button { background-color:#eef1f4 !important; border:0 !important; }
    .fc .fc-button.tiss-compact-btn { margin-left:14px; }
    .fc .fc-button.fc-today-button { background-color:#fff !important; color:var(--t-orange) !important; box-shadow:inset 0 0 0 2px var(--t-orange) !important; }
    .fc .fc-button.fc-today-button:disabled { opacity:.5; }
    .fc .fc-button.fc-prev-button, .fc .fc-button.fc-next-button { font-size:0 !important; width:38px; height:38px; padding:0 !important; background-repeat:no-repeat !important; background-position:center !important; background-size:16px !important; }
    .fc .fc-button.fc-prev-button { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231f2933' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 18l-6-6 6-6'/%3E%3C/svg%3E") !important; }
    .fc .fc-button.fc-next-button { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231f2933' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18l6-6-6-6'/%3E%3C/svg%3E") !important; }
    .fc .fc-toolbar-chunk { display:flex; align-items:center; gap:8px; }
    .fc-theme-standard .fc-scrollgrid, .fc-theme-standard td, .fc-theme-standard th { border-color:#eef1f4 !important; }
    .fc-theme-standard .fc-scrollgrid { border:1px solid var(--t-border) !important; border-radius:10px; overflow:hidden; }
    .fc-event.tiss-hidden, .fc-event.tiss-othergroup { display:none !important; }
    .fc.tiss-compact .fc-event-time { display:none; }
    .fc.tiss-compact .fc-event-main { padding:1px 4px !important; font-size:11px; }
    .fc a.fc-event.tiss-exam-ev, .fc a.fc-event.tiss-exam-ev .fc-event-main { background:#fff5f5 !important; background-image:none !important; color:#b91c1c !important; }
    .fc a.fc-event.tiss-exam-ev { border:2px dashed #b91c1c !important; border-radius:6px !important; box-shadow:none !important; }
    .fc a.fc-event.tiss-exam-ev .fc-event-title, .fc a.fc-event.tiss-exam-ev .fc-event-title-container { color:#b91c1c !important; font-weight:600; }
    .fc .fc-timegrid-slot { height:1.9em !important; }
    .tiss-next { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:4px 22px; margin:0 0 12px; padding:12px 18px; border-radius:14px; background:#e6f0f6; color:var(--t-blue-dark); }
    .tiss-next .k { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; opacity:.75; }
    .tiss-next .v { font-size:24px; font-weight:700; line-height:1.1; font-variant-numeric:tabular-nums; }
    .tiss-next .room { font-size:17px; font-weight:600; }
    .tiss-next .when { font-size:13px; opacity:.8; }
    .tiss-next a.map { width:46px; height:46px; border-radius:50%; background:var(--t-blue); display:inline-flex; align-items:center; justify-content:center; color:#fff !important; text-decoration:none !important; }
    .tiss-next a.map svg { width:24px; height:24px; }
    .tiss-next a.map:hover { background:var(--t-blue-dark); }
    .tiss-next.live { background:#fff4e5; color:#9a4d07; }
    .tiss-next.live a.map { background:var(--t-orange); }
    .tiss-pop-head { position:relative; padding-right:48px; }
    .tiss-pop-head a.map { position:absolute; right:0; top:-2px; width:40px; height:40px; border-radius:50%; background:var(--t-blue); display:inline-flex; align-items:center; justify-content:center; color:#fff !important; }
    .tiss-pop-head a.map svg { width:22px; height:22px; }
    .tiss-pop-color { cursor:pointer; }
    .tiss-pop-color:hover { outline:3px solid #cbd2d9; }
    .tiss-pop ul { margin:6px 0 0 16px; padding:0; }
    .tiss-pop { position:absolute; z-index:6000; width:320px; background:#fff; border:1px solid var(--t-border); border-radius:14px; box-shadow:0 12px 36px rgba(0,0,0,.2); padding:14px 16px; font-size:13px; color:var(--t-text); }
    .tiss-pop-head { display:flex; gap:10px; align-items:flex-start; margin-bottom:8px; }
    .tiss-pop-head i { width:12px; height:12px; border-radius:50%; flex:none; margin-top:4px; }
    .tiss-pop-head b { font-size:14px; line-height:1.3; }
    .tiss-pop-row { display:flex; gap:10px; padding:4px 0; color:var(--t-muted); }
    .tiss-pop-row span:last-child { color:var(--t-text); }
    .tiss-pop-links { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .tiss-pop-links a { display:inline-block; padding:6px 12px; border-radius:999px; background:#eef1f4; color:var(--t-text) !important; text-decoration:none !important; font-weight:600; font-size:12px; }
    .tiss-pop-links a:hover { background:#dfe5ea; }
    .tiss-pop-links a.primary { background:var(--t-blue); color:#fff !important; }
    .tiss-ics-form h2 { cursor:pointer; user-select:none; display:inline-flex; align-items:center; gap:10px; font-size:14px !important; font-weight:600 !important; padding:8px 16px !important; border-radius:999px; background:#eef1f4; margin:18px 0 8px !important; border:0 !important; }
    .tiss-ics-form h2:hover { background:#dfe5ea; }
    .tiss-ics-dl { display:inline-block; margin:18px 0 8px 8px; padding:8px 16px; border-radius:999px; background:#e6f0f6; color:var(--t-blue-dark) !important; font-weight:600; font-size:14px; text-decoration:none !important; vertical-align:top; }
    .tiss-ics-dl:hover { background:#d4e4ef; }
    .tiss-ics-body { overflow:hidden; max-height:1200px; transition:max-height .35s ease, opacity .25s ease; opacity:1; }
    .tiss-ics-form.collapsed .tiss-ics-body { max-height:0; opacity:0; }
    .tiss-ics-form.collapsed h2 .tiss-chev { transform:rotate(-90deg); }
    .tiss-ics-form h2 .tiss-chev { width:auto; }
    .fc .fc-col-header-cell { background:#f8fafc; padding:8px 0; }
    .fc .fc-col-header-cell-cushion { font-weight:600 !important; font-size:13px; color:var(--t-text) !important; padding:4px 10px; }
    .fc .fc-day-today .fc-col-header-cell-cushion { background:var(--t-blue); color:#fff !important; border-radius:999px; }
    .fc .fc-timegrid-axis-cushion, .fc .fc-timegrid-slot-label-cushion { color:var(--t-muted); font-size:12px; font-variant-numeric:tabular-nums; }
    .fc .fc-timegrid-slot-minor { border-top-style:dotted !important; }
    .fc .fc-day-today { background:#fffaf0 !important; }
    .fc .fc-timegrid-now-indicator-line { border-color:var(--t-orange) !important; border-width:2px 0 0; }
    .fc .fc-timegrid-now-indicator-arrow { border-color:var(--t-orange) !important; }
    .fc .fc-daygrid-day-number, .fc .fc-daygrid-day-top a { color:var(--t-text) !important; text-decoration:none !important; }
    #contentInner h3:not(.subscriptionGroupTitle) { font-size:15px !important; font-weight:700 !important; color:var(--t-muted) !important; text-transform:uppercase; letter-spacing:.5px; margin-top:22px !important; }
    a.fc-timegrid-event, a.fc-daygrid-event { border:0 !important; border-radius:6px !important; box-shadow:0 1px 2px rgba(0,0,0,.15); color:#fff !important; }
    a.fc-timegrid-event[data-tiss-color], a.fc-timegrid-event[data-tiss-color] .fc-event-main,
    a.fc-daygrid-event[data-tiss-color], a.fc-daygrid-event[data-tiss-color] .fc-event-main { background:var(--tiss-ev) !important; background-image:none !important; border-color:var(--tiss-ev) !important; }
    a.fc-event[data-tiss-color] * { background:transparent !important; background-image:none !important; color:#fff !important; border:0 !important; }
    a.fc-event[data-tiss-color] .fc-event-title { font-weight:600; }
    a.fc-event[data-tiss-color] .fc-event-time { opacity:.9; font-size:11px !important; }
    a.fc-event[data-tiss-color] .fc-event-main { padding:3px 5px !important; }
    /* TISS exam events: white, dashed border in the course colour, deduplicated via mergeExams() */
    .fc a.fc-event.tiss-examev, .fc a.fc-event.tiss-examev .fc-event-main { background:#fff !important; background-image:none !important; color:var(--tiss-ev, #b91c1c) !important; }
    .fc a.fc-event.tiss-examev { border:2px dashed var(--tiss-ev, #b91c1c) !important; border-radius:6px !important; box-shadow:none !important; }
    .fc a.fc-event.tiss-examev .fc-event-title, .fc a.fc-event.tiss-examev .fc-event-time, .fc a.fc-event.tiss-examev .fc-event-title-container { color:var(--tiss-ev, #b91c1c) !important; font-weight:600; }
    a.fc-event.no_attendance[data-tiss-color] { background-image:repeating-linear-gradient(45deg, rgba(255,255,255,.25) 0 6px, transparent 6px 12px) !important; }
    .fc-col-header-cell-cushion { font-weight:600 !important; color:var(--t-text) !important; text-decoration:none !important; }
    .fc-day-today { background:#fff8e6 !important; }
    ${HIDE_WEEKEND ? '.fc-day-sat, .fc-day-sun { display:none !important; }' : ''}
    body.tiss-peek .ui-dialog, body.tiss-peek .ui-widget-overlay { visibility:hidden !important; opacity:0 !important; pointer-events:none !important; }
    .tiss-pop-room a { color:var(--t-blue); font-weight:600; }
    .tiss-token-blur { filter:blur(5px); transition:filter .2s; }
    .tiss-token-blur:hover { filter:none; }
    dl.legend { display:none !important; }
    .tiss-legend { margin:14px 0 18px; }
    .tiss-legend-head { display:flex; align-items:center; gap:14px; margin-bottom:8px; font-size:13px; color:var(--t-muted); }
    .tiss-legend-head b { color:var(--t-text); font-size:14px; }
    .tiss-legend-head a { margin-left:auto; font-size:13px; }
    .tiss-legend-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:6px 12px; }
    .tiss-chip { display:flex; align-items:center; gap:10px; padding:7px 12px 7px 9px; border-radius:999px; background:#f3f6f9; cursor:pointer; user-select:none; font-size:13px; line-height:1.2; min-width:0; }
    .tiss-chip:hover { background:#e8eef5; }
    .tiss-chip i { width:14px; height:14px; border-radius:50%; flex:none; }
    .tiss-chip .t { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
    .tiss-chip .t small { font-weight:500; color:var(--t-muted); margin-right:6px; }
    .tiss-chip .h { color:var(--t-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }
    .tiss-chip.off { opacity:.4; }
    .tiss-chip.off .t { text-decoration:line-through; }
    .tiss-legend-foot { margin-top:8px; font-size:12px; color:var(--t-muted); display:flex; gap:16px; align-items:center; }
    .tiss-legend-foot i { display:inline-block; width:13px; height:13px; border-radius:3px; vertical-align:-2px; margin-right:5px; }
    .tiss-legend-foot i.exam { outline:2.5px solid #111; outline-offset:-2.5px; }
    .tiss-legend-foot i.online { background:#6b7280; background-image:repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 3px, transparent 3px 6px); }
  `;
  const style = document.createElement('style');
  style.id = 'tiss-overhaul-css';
  style.textContent = settingsCss + css;
  (document.head || document.documentElement).appendChild(style);

  // ---------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------
  const path = location.pathname;
  const parseDate = s => { const m = s && s.match(/(\d{2})\.(\d{2})\.(\d{4}),?\s*(\d{2}):(\d{2})/); return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]) : null; };
  const DIAG = [];                                  // diagnostics shown via the "Diagnose" button
  const diag = line => { DIAG.push(line); if (DIAG.length > 80) DIAG.shift(); console.debug('[TISS Overhaul]', line); };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function gmFetch(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') return reject(new Error('no GM_xmlhttpRequest'));
      GM_xmlhttpRequest({ method: 'GET', url, onload: r => resolve(r), onerror: () => reject(new Error('network')), ontimeout: () => reject(new Error('timeout')), timeout: 20000 });
    });
  }

  // TISS (DeltaSpike "CLIENTWINDOW" mode) answers every GET with a tiny "Loading..." page unless the request carries a
  // one-time token (dsrid) whose cookie "dsrwid-<token>" holds the window id (dswid). The real browser does this
  // handshake on every navigation; we do exactly the same for our background requests, in a window of our own.
  let bgWindowId = sessionStorage.getItem('tissOverhaul.bgWindowId');
  if (!bgWindowId) { bgWindowId = String(Math.floor(Math.random() * 8999) + 1000); sessionStorage.setItem('tissOverhaul.bgWindowId', bgWindowId); }
  const isBootstrap = d => /^Loading/i.test(d.title || '') || /does not support Javascript/i.test(d.body?.textContent || '');
  async function fetchDoc(p) {
    const token = String(Math.floor(Math.random() * 999));
    const exp = new Date(Date.now() + 3000).toUTCString();
    document.cookie = `dsrwid-${token}=${bgWindowId}; expires=${exp}; path=/; SameSite=Strict`;
    const url = location.origin + p + (p.includes('?') ? '&' : '?') + `dswid=${bgWindowId}&dsrid=${token}`;
    const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store', redirect: 'follow' });
    const text = await r.text();
    const d = new DOMParser().parseFromString(text, 'text/html');
    d.__final = r.url; d.__status = r.status;
    if (isBootstrap(d)) { diagFail(`${p}: TISS lieferte nur die Lade-Seite (Handshake fehlgeschlagen, dswid=${bgWindowId})`); throw new Error('bootstrap'); }
    if (!d.getElementById('contentInner')) { diagFail(`${p} → HTTP ${r.status}, keine Inhaltsseite (Titel "${d.title}", URL ${r.url})`); throw new Error('no content'); }
    return d;
  }
  let diagFailures = 0;
  const diagFail = line => { diagFailures++; diag(line); document.querySelectorAll('.tiss-fav-toolbar button[data-act=diag]').forEach(b => b.hidden = false); };

  const badge = (text, cls, title, href) => {
    const b = document.createElement(href ? 'a' : 'span');
    b.className = 'tiss-badge tiss-st ' + (cls || '');
    b.textContent = text;
    if (title) b.title = title;
    if (href) { b.href = href; }
    return b;
  };

  // ---------------------------------------------------------------
  // sign-up pages
  // ---------------------------------------------------------------
  function courseRegistration() {
    const panel = document.getElementById('registrationForm:formContentPanel');
    if (!panel || panel.querySelector('.tiss-deadline')) return;
    const end = parseDate((document.getElementById('registrationForm:end') || {}).textContent);
    const begin = parseDate((document.getElementById('registrationForm:begin') || {}).textContent);
    const now = new Date();
    const box = document.createElement('div');
    box.className = 'tiss-deadline';
    const fmt = d => d.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
    if (begin && now < begin) {
      const days = Math.ceil((begin - now) / 864e5);
      box.innerHTML = `<span>Anmeldung öffnet in <b>${days} Tag${days === 1 ? '' : 'en'}</b></span><span>${fmt(begin)}</span>`;
    } else if (end) {
      const days = Math.ceil((end - now) / 864e5);
      if (days < 0) { box.classList.add('over'); box.innerHTML = `<span>Anmeldefrist <b>abgelaufen</b></span><span>${fmt(end)}</span>`; }
      else { if (days <= 3) box.classList.add('soon'); box.innerHTML = `<span>Noch <b>${days} Tag${days === 1 ? '' : 'e'}</b> bis Anmeldeschluss</span><span>${fmt(end)}</span>`; }
    } else return;
    (panel.querySelector('.groupWrapper') || panel).insertAdjacentElement('beforebegin', box);
  }

  function moveSignupButtons() {
    document.querySelectorAll('.groupWrapper').forEach(g => {
      const header = g.querySelector('.groupHeaderWrapper');
      const btn = g.querySelector('fieldset input[type=submit]');
      if (!header || !btn) return;
      let slot = header.querySelector('.tiss-hdr-btn');
      if (!slot) {
        slot = document.createElement('span');
        slot.className = 'tiss-hdr-btn';
        slot.addEventListener('click', e => e.stopPropagation());
        const right = header.querySelector('.rightLink');
        right ? right.before(slot) : header.appendChild(slot);
      }
      slot.appendChild(btn);
    });
  }

  // ---------------------------------------------------------------
  // Favoriten
  // ---------------------------------------------------------------
  const FAV_KEY = 'tissOverhaul.favorites';
  const CACHE_KEY = 'tissOverhaul.favCache.v6';
  const favState = () => Object.assign(store.get(FAV_KEY, {}), { merge: !!S.merge });
  const favSave = s => store.set(FAV_KEY, s);

  function rowInfo(tr) {
    const t = tr.querySelector('.favoritesTitleCol');
    if (!t) return null;
    const nr = (t.querySelector('[title="LVA Nr."]') || {}).textContent?.trim();
    const type = ((t.querySelector('[title="Typ"]') || {}).textContent || '').replace(/[,\s]/g, '');
    const sem = (t.querySelector('[title="Semester"]') || {}).textContent?.trim();
    const title = (t.querySelector('a') || {}).textContent?.trim();
    const tuwel = tr.querySelector('td.favoritesLinks a[href*="tuwel.tuwien.ac.at"]');
    return { nr, type, sem, title, courseNr: nr ? nr.replace('.', '') : null, tuwelUrl: tuwel ? tuwel.href : null };
  }

  function favorites() {
    favoritesBadges();
    favoritesGroups();
    favoritesQuickMove();
    favoritesMerge();
    if (S.favStatus) favoritesStatus();
  }

  // --- group name badges (exact TISS naming) ---
  function favoritesBadges() {
    document.querySelectorAll('td.favoritesGrp img[title], td.favoritesReg img[title]').forEach(img => {
      const td = img.closest('td');
      if (td.querySelector('.tiss-badge.ok')) return;
      const t = img.getAttribute('title') || '';
      const g = t.match(/,\s*Gruppe\s+(.+?)\s+seit/);
      if (g) { const i = rowInfo(td.closest('tr')); if (i && i.nr) { const mg = store.get('tissOverhaul.myGroups', {}); if (mg[i.nr] !== g[1]) { mg[i.nr] = g[1]; store.set('tissOverhaul.myGroups', mg); } } }
      const b = badge(g ? g[1] : (/Angemeldet/.test(t) ? 'Angemeldet' : t), /Warteliste/i.test(t) ? 'wait' : 'ok', t);
      b.classList.remove('tiss-st'); // permanent, not a fetched status
      td.appendChild(b);
    });
  }

  // --- icons ---
  const ICON_MOVE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v6M9 14l3 3 3-3"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/><path d="M10 10v7M14 10v7"/></svg>';
  const ICON_PEN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

  // --- collapsible / sortable / filterable categories ---
  function favoritesGroups() {
    const panel = document.getElementById('contentForm:groupPanel');
    if (!panel || panel.dataset.tissDone) return;
    panel.dataset.tissDone = '1';
    const state = favState();
    state.collapsed = state.collapsed || {};
    state.order = state.order || [];

    const heads = Array.from(panel.querySelectorAll(':scope > .subscriptionGroupHead'));
    const sections = heads.map(head => {
      const body = head.nextElementSibling;
      const link = head.querySelector('a[href*="sgId="]');
      const id = link ? (link.href.match(/sgId=(\d+)/) || [])[1] : head.textContent.trim();
      const sec = document.createElement('section');
      sec.className = 'tiss-fav-group';
      sec.dataset.sgId = id;
      head.before(sec);
      sec.append(head, body);

      const title = head.querySelector('.subscriptionGroupTitle');
      head.querySelectorAll('a.actionIcon').forEach(a => {
        const img = a.querySelector('img');
        const isBin = /l(ö|oe)sch|delete|bin|trash/i.test((img && (img.getAttribute('title') + ' ' + img.src)) || '');
        a.innerHTML = isBin ? ICON_TRASH : ICON_PEN;
        a.classList.add('tiss-icon', 'tiss-icon-sm', isBin ? 'tiss-icon-trash' : 'tiss-icon-pen');
        a.title = isBin ? 'Kategorie löschen' : 'Kategorie umbenennen / Einstellungen';
      });
      const rows = body.querySelectorAll('tbody tr');
      const ects = body.querySelector('tfoot .favoritesECTS');
      const chev = document.createElement('span'); chev.className = 'tiss-chev'; chev.textContent = '▾';
      const meta = document.createElement('span'); meta.className = 'tiss-fav-meta';
      meta.textContent = rows.length ? `${rows.length} LVA · ${ects ? ects.textContent.trim() : '0'} ECTS` : 'leer';
      title.before(chev); title.after(meta);
      const ctl = document.createElement('span'); ctl.className = 'tiss-fav-ctl';
      ctl.innerHTML = '<button type="button" title="Nach oben">▲</button><button type="button" title="Nach unten">▼</button>';
      head.appendChild(ctl);
      const [up, down] = ctl.querySelectorAll('button');
      up.addEventListener('click', e => { e.stopPropagation(); move(sec, -1); });
      down.addEventListener('click', e => { e.stopPropagation(); move(sec, 1); });
      head.style.cursor = 'pointer';
      head.addEventListener('click', e => {
        if (e.target.closest('a, button, input, select')) return;
        sec.classList.toggle('collapsed');
        state.collapsed[id] = sec.classList.contains('collapsed');
        favSave(state);
      });
      if (id in state.collapsed ? state.collapsed[id] : S.favCollapsed) sec.classList.add('collapsed');
      return sec;
    });
    const pos = id => { const i = state.order.indexOf(id); return i < 0 ? 999 : i; };
    sections.slice().sort((a, b) => pos(a.dataset.sgId) - pos(b.dataset.sgId)).forEach(s => panel.appendChild(s));
    function move(sec, dir) {
      const sib = dir < 0 ? sec.previousElementSibling : sec.nextElementSibling;
      if (!sib || !sib.classList.contains('tiss-fav-group')) return;
      dir < 0 ? sib.before(sec) : sib.after(sec);
      state.order = Array.from(panel.querySelectorAll('.tiss-fav-group')).map(s => s.dataset.sgId);
      favSave(state);
    }

    // toolbar (outside the AJAX-updated panel, built once)
    const form = panel.closest('form');
    if (!form.querySelector('.tiss-fav-toolbar')) {
      const bar = document.createElement('div');
      bar.className = 'tiss-fav-toolbar';
      bar.innerHTML = `
        <input type="text" class="tiss-fav-filter" placeholder="Favoriten filtern (Titel, Nummer, Typ)…">
        <button type="button" data-act="expand">Alle ausklappen</button>
        <button type="button" data-act="collapse">Alle einklappen</button>
        <label class="tiss-switch"><input type="checkbox" class="tiss-merge-cb"><span>Kompaktansicht</span><span class="tiss-slider"></span></label>
        <button type="button" data-act="refresh" title="Anmelde-, Prüfungs- und TUWEL-Status neu laden">Status aktualisieren</button>
        <button type="button" data-act="diag" title="Was die Status-Abfragen zurückgeliefert haben" ${diagFailures ? '' : 'hidden'}>Diagnose</button>`;
      panel.before(bar);
      const addBtn = document.getElementById('contentForm:addGroupLink');
      if (addBtn) { addBtn.value = '+ Kategorie'; bar.appendChild(addBtn); }
      const filter = bar.querySelector('.tiss-fav-filter');
      filter.addEventListener('input', () => applyFilter(filter.value));
      bar.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'refresh') { store.set(CACHE_KEY, {}); favoritesStatus(true); return; }
        if (act === 'diag') {
          const txt = DIAG.length ? DIAG.join('\n\n') : 'Noch keine Abfragen gelaufen.';
          const ta = document.createElement('textarea'); ta.value = txt; ta.className = 'tiss-diag';
          ta.readOnly = true; document.body.appendChild(ta); ta.select();
          try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch (e) {}
          ta.addEventListener('click', e => e.stopPropagation());
          setTimeout(() => document.addEventListener('click', () => ta.remove(), { once: true }), 0);
          return;
        }
        const collapse = act === 'collapse';
        const st = favState(); st.collapsed = st.collapsed || {};
        panel.querySelectorAll('.tiss-fav-group').forEach(s => { s.classList.toggle('collapsed', collapse); st.collapsed[s.dataset.sgId] = collapse; });
        favSave(st);
      }));
      const cb = bar.querySelector('.tiss-merge-cb');
      cb.checked = !!S.merge;
      cb.addEventListener('change', () => { S.merge = cb.checked; saveSettings(); favoritesMerge(true); });
    }
    function applyFilter(q) {
      q = q.trim().toLowerCase();
      panel.querySelectorAll('.tiss-fav-group').forEach(sec => {
        let visible = 0;
        sec.querySelectorAll('tbody tr').forEach(tr => {
          const txt = (tr.querySelector('.favoritesTitleCol') || tr).textContent.toLowerCase();
          const hit = !q || txt.includes(q);
          tr.style.display = hit ? '' : 'none';
          if (hit) visible++;
        });
        sec.classList.toggle('tiss-filter-hidden', !!q && visible === 0);
        sec.classList.toggle('tiss-filter-open', !!q && visible > 0);
      });
    }
  }

  // --- quick move: icon + menu; the move itself is sent as the same two JSF requests TISS's own dialog sends,
  //     but without ever showing that dialog ---
  let openMenu = null;
  document.addEventListener('click', e => { if (openMenu && !e.target.closest('.tiss-menu, .tiss-icon-move, .tiss-icon-color, .tiss-pop-color')) { openMenu.remove(); openMenu = null; } }, true);

  function jsfAjax(source, execute, render) {
    try {
      if (W.myfaces && typeof W.myfaces.ab === 'function') {
        W.myfaces.ab(source, new MouseEvent('click', { bubbles: true, cancelable: true }), 'action', execute, render);
        return true;
      }
    } catch (e) { console.warn('[TISS Overhaul] myfaces.ab failed', e); }
    return false;
  }

  const hslToHex = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
  const hexToHsl = hex => { const m = (hex || '#336699').match(/#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i); if (!m) return [210, 60, 40]; const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2; if (max === min) return [0, 0, Math.round(l * 100)]; const d = max - min, s = l > .5 ? d / (2 - max - min) : d / (max + min); let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]; };
  function openColorMenu(anchor, nr, type, onChange) {
    if (openMenu) { openMenu.remove(); openMenu = null; }
    const menu = document.createElement('div');
    menu.className = 'tiss-menu tiss-color-menu';
    menu.innerHTML = `<div class="tiss-menu-title">Farbe für ${nr}</div><div class="tiss-swatches">${[...COLD, ...MID, ...WARM, '#0f172a', '#475569', '#ca8a04'].map(c => `<button type="button" data-c="${c}" style="--c:${c}" title="${c}"></button>`).join('')}</div>
      <div class="tiss-color-custom"><span>Eigene Farbe</span><div class="row"><i class="prev"></i><input type="range" class="hue" min="0" max="360" value="${hexToHsl(colorFor(nr, type))[0]}"></div><div class="row"><span class="sun" title="Helligkeit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></span><input type="range" class="lum" min="22" max="62" value="${hexToHsl(colorFor(nr, type))[2]}"><input type="text" class="hex" value="${colorFor(nr, type)}" maxlength="7"></div></div><button type="button" class="tiss-color-auto">Automatisch</button>`;
    const set = c => { const m = store.get(COLOR_KEY, {}); if (c) m[nr] = c; else delete m[nr]; store.set(COLOR_KEY, m); vault.set('tiss.colors', m); onChange && onChange(colorFor(nr, type)); };
    menu.querySelectorAll('.tiss-swatches button').forEach(b => b.addEventListener('click', () => { set(b.dataset.c); menu.remove(); openMenu = null; }));
    const hue = menu.querySelector('.hue'), lum = menu.querySelector('.lum'), hex = menu.querySelector('.hex'), prev = menu.querySelector('.prev');
    const fromSliders = () => { const c = hslToHex(+hue.value, 62, +lum.value); hex.value = c; prev.style.background = c; lum.style.setProperty('--hue', hue.value); set(c); };
    prev.style.background = colorFor(nr, type); lum.style.setProperty('--hue', hue.value);
    hue.addEventListener('input', fromSliders); lum.addEventListener('input', fromSliders);
    hex.addEventListener('change', () => { const v = hex.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) { const c = v.startsWith('#') ? v : '#' + v; prev.style.background = c; set(c); } });
    menu.querySelector('.tiss-color-auto').addEventListener('click', () => { set(null); menu.remove(); openMenu = null; });
    menu.style.width = '290px';
    const r = anchor.getBoundingClientRect();
    menu.style.top = (r.bottom + window.scrollY + 4) + 'px';
    menu.style.left = Math.max(8, Math.min(r.left + window.scrollX, document.documentElement.clientWidth - 298)) + 'px';
    document.body.appendChild(menu); openMenu = menu;
  }

  function favoritesQuickMove() {
    const catSel = document.getElementById('contentForm:categorySelect');
    const confirm = document.getElementById('contentForm:moveConfirm');
    if (!catSel || !confirm) return;
    document.querySelectorAll('.tiss-fav-group').forEach(sec => {
      const curId = sec.dataset.sgId;
      sec.querySelectorAll('td.favoritesActionCol2').forEach(td => {
        if (td.querySelector('.tiss-icon-move')) return;
        const link = td.querySelector('a[title="Verschieben"]');
        if (!link) return;
        const bin = td.querySelector('a[title="Entfernen"]');
        if (bin) { bin.innerHTML = ICON_TRASH; bin.classList.add('tiss-icon', 'tiss-icon-trash'); bin.style.marginLeft = '0'; }
        const box = document.createElement('div');
        box.className = 'tiss-actions';
        td.appendChild(box);
        if (bin) box.appendChild(bin);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tiss-icon tiss-icon-move';
        btn.title = 'In andere Kategorie verschieben';
        btn.innerHTML = ICON_MOVE;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if (openMenu) { openMenu.remove(); openMenu = null; }
          const menu = document.createElement('div');
          menu.className = 'tiss-menu';
          menu.innerHTML = '<div class="tiss-menu-title">Verschieben nach</div>';
          Array.from(catSel.options).forEach(o => {
            if (o.value === curId) return;
            const it = document.createElement('button'); it.type = 'button'; it.textContent = o.textContent;
            it.addEventListener('click', () => {
              menu.remove(); openMenu = null;
              catSel.value = o.value;
              // request 1 tells the server which LVA (what the "Verschieben" icon does), request 2 is the dialog's
              // confirm button with the chosen category. MyFaces queues them in order.
              const ok = jsfAjax(link, '', '') && jsfAjax(confirm, 'contentForm:categorySelect', 'contentForm:groupPanel');
              if (!ok) { // fallback: drive TISS's dialog, kept invisible
                document.body.classList.add('tiss-moving');
                link.click();
                setTimeout(() => { try { W.PF && W.PF('moveDlg') && W.PF('moveDlg').hide(); } catch (x) {} confirm.click(); setTimeout(() => document.body.classList.remove('tiss-moving'), 2500); }, 50);
              }
            });
            menu.appendChild(it);
          });
          const r = btn.getBoundingClientRect();
          menu.style.top = (r.bottom + window.scrollY + 4) + 'px';
          menu.style.left = Math.max(8, Math.min(r.left + window.scrollX, document.documentElement.clientWidth - 220)) + 'px';
          document.body.appendChild(menu);
          openMenu = menu;
        });
        box.insertBefore(btn, box.firstChild);
        // colour of this LVA in the calendar
        const info = rowInfo(td.closest('tr'));
        if (info && info.nr) {
          const cb = document.createElement('button');
          cb.type = 'button'; cb.className = 'tiss-icon tiss-icon-color'; cb.title = 'Farbe im Kalender';
          const paint = () => { cb.innerHTML = `<i style="background:${colorFor(info.nr, info.type)}"></i>`; };
          paint();
          cb.addEventListener('click', e => { e.stopPropagation(); openColorMenu(cb, info.nr, info.type, paint); });
          if (bin) bin.before(cb); else box.appendChild(cb);
        }
      });
    });
  }

  // --- Kompaktansicht: same title within a category → one expandable row (VO → VU → UE) ---
  const TYPE_ORDER = { VO: 0, VU: 1, UE: 2, LU: 3, PR: 4, SE: 5, EX: 6 };
  const typeRank = t => (t in TYPE_ORDER ? TYPE_ORDER[t] : 9);
  function favoritesMerge(force) {
    const on = !!favState().merge;
    const st = favState(); st.mergeOpen = st.mergeOpen || {};
    document.querySelectorAll('.tiss-fav-group tbody').forEach(tbody => {
      const sig = (on ? '1' : '0') + ':' + tbody.querySelectorAll('tr:not(.tiss-merge-row)').length;
      if (!force && tbody.dataset.tissMerge === sig) return;
      tbody.dataset.tissMerge = sig;
      tbody.querySelectorAll('tr.tiss-merge-row').forEach(r => r.remove());
      tbody.querySelectorAll('tr.tiss-child').forEach(r => r.classList.remove('tiss-child', 'open'));
      if (!on) return;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const byTitle = new Map();
      rows.forEach(tr => { const i = rowInfo(tr); if (!i || !i.title) return; const k = i.title.toLowerCase(); (byTitle.get(k) || byTitle.set(k, []).get(k)).push(tr); });
      byTitle.forEach((group, key) => {
        if (group.length < 2) return;
        group.sort((a, b) => typeRank(rowInfo(a).type) - typeRank(rowInfo(b).type));
        const infos = group.map(rowInfo);
        const sum = cls => group.reduce((a, r) => a + (parseFloat((r.querySelector(cls) || {}).textContent) || 0), 0);
        const cols = group[0].children.length;
        const parent = document.createElement('tr');
        parent.className = 'tiss-merge-row ui-widget-content';
        const open = !!st.mergeOpen[key];
        parent.innerHTML =
          `<td class="tiss-merge-handle"><span class="tiss-chev">▾</span></td>` +
          `<td class="favoritesTitleCol"><span class="tiss-merge-title">${infos[0].title}</span></td>` +
          `<td class="favoritesH">${sum('.favoritesH').toFixed(1)}</td><td class="favoritesECTS">${sum('.favoritesECTS').toFixed(1)}</td>` +
          `<td colspan="${cols - 4}" class="tiss-merge-hint">` + infos.map(i => `<span class="tiss-badge tiss-type">${i.type} · ${i.nr}</span>`).join('') +
          `<span class="gray">${infos[0].sem}</span><span class="tiss-merge-hinttext">${open ? '' : 'aufklappen für Details'}</span></td>`;
        parent.classList.toggle('open', open);
        group.forEach(r => { r.classList.add('tiss-child'); r.classList.toggle('open', open); });
        tbody.insertBefore(parent, group[0]);
        for (let i = group.length - 1; i >= 0; i--) parent.after(group[i]);
        parent.addEventListener('click', e => {
          if (e.target.closest('a, select, button, input')) return;
          const o = !parent.classList.contains('open');
          parent.classList.toggle('open', o);
          group.forEach(r => r.classList.toggle('open', o));
          parent.querySelector('.tiss-merge-hinttext').textContent = o ? '' : 'aufklappen für Details';
          const s = favState(); s.mergeOpen = s.mergeOpen || {}; s.mergeOpen[key] = o; favSave(s);
        });
      });
    });
  }

  // --- background status: sign-up / groups / exams / TUWEL ---
  let statusRunning = false;
  async function favoritesStatus(force) {
    if (statusRunning) return;
    const rows = Array.from(document.querySelectorAll('.tiss-fav-group tbody tr')).filter(tr => !tr.classList.contains('tiss-merge-row') && (!tr.dataset.tissStatus || force));
    if (!rows.length) return;
    statusRunning = true;
    const cache = store.get(CACHE_KEY, {});
    const now = Date.now();
    const parseWrappers = (doc, what, nr) => {
      const list = Array.from(doc.querySelectorAll('.groupWrapper')).map(w => {
        const h = w.querySelectorAll('.groupHeaderWrapper .header_element');
        const txt = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
        const field = re => { const lab = Array.from(w.querySelectorAll('fieldset label')).find(l => re.test(l.textContent)); return lab ? txt(lab.nextElementSibling) : ''; };
        return { name: txt(h[0]), status: txt(h[1]), count: txt(w.querySelector('.rightLink')), begin: field(/Beginn der Anmeldung/), end: field(/Ende der Anmeldung/) };
      });
      diag(`${nr} ${what}: ${list.length} Einträge` + (list.length ? '' : ` · Seite "${doc.title}" · ${(doc.getElementById('contentInner')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140)}`));
      return list;
    };
    for (const tr of rows) {
      try {
        const info = rowInfo(tr); if (!info || !info.courseNr) continue;
        tr.dataset.tissStatus = '1';
        const key = `${info.courseNr}:${info.sem}`;
        let data = cache[key] && (now - cache[key].t < CACHE_TTL_MS) && !force ? cache[key].d : null;
        const regTd = tr.querySelector('td.favoritesReg'), grpTd = tr.querySelector('td.favoritesGrp'), exTd = tr.querySelector('td.favoritesExam'), lnkTd = tr.querySelector('td.favoritesLinks');
        const needReg = regTd && !regTd.querySelector('a'), needGrp = grpTd && !grpTd.querySelector('a');
        [regTd, grpTd, exTd, lnkTd].forEach(td => td && td.querySelectorAll('.tiss-st').forEach(b => b.remove()));
        const loaders = [];
        if (!data) {
          const mk = td => { if (!td) return; const b = badge('…', 'load'); td.appendChild(b); loaders.push(b); };
          if (needReg) mk(regTd); if (needGrp) mk(grpTd); mk(exTd); if (info.tuwelUrl && S.favTuwel) mk(lnkTd);
          data = { title: info.title, type: info.type, nr: info.nr, tuwel: info.tuwelUrl || '' };
          const q = `semester=${encodeURIComponent(info.sem)}&courseNr=${encodeURIComponent(info.courseNr)}`;
          const tiss = (async () => {
            if (needReg) { await fetchDoc(`/education/course/courseRegistration.xhtml?${q}`).then(d => { data.reg = parseWrappers(d, 'Anmeldung', info.nr); }).catch(() => { data.reg = null; }); await sleep(120); }
            if (needGrp) { await fetchDoc(`/education/course/groupList.xhtml?${q}`).then(d => { data.grp = parseWrappers(d, 'Gruppen', info.nr); }).catch(() => { data.grp = null; }); await sleep(120); }
            await fetchDoc(`/education/course/examDateList.xhtml?${q}`).then(d => { data.exam = parseWrappers(d, 'Prüfungen', info.nr); }).catch(() => { data.exam = null; });
            await sleep(120);
          })();
          const jobs = [tiss];
          if (info.tuwelUrl && S.favTuwel) jobs.push(gmFetch(info.tuwelUrl).then(r => {
            const fin = r.finalUrl || '';
            if (/login/i.test(fin) || /login\/index\.php/.test(r.responseText.slice(0, 5000))) { data.tuwel = { login: true }; return; }
            const d = new DOMParser().parseFromString(r.responseText, 'text/html');
            const acts = d.querySelectorAll('li.activity, .activity-item').length;
            const sections = d.querySelectorAll('li.section, .course-section').length;
            data.tuwel = { acts, sections };
          }).catch(() => { data.tuwel = { err: true }; }));
          await Promise.all(jobs);
          cache[key] = { t: Date.now(), d: data };
          store.set(CACHE_KEY, cache);
          loaders.forEach(b => b.remove());
        }
        render(tr, info, data, { regTd, grpTd, exTd, lnkTd, needReg, needGrp });
      } catch (e) { console.warn('[TISS Overhaul] status', e); }
    }
    statusRunning = false;
  }

  function render(tr, info, d, t) {
    const q = `semester=${info.sem}&courseNr=${info.courseNr}`;
    const dateOf = s => { const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
    const shortDate = s => { const m = (s || '').match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? `${m[1]}.${m[2]}.` : ''; };
    if (t.needReg && t.regTd) {
      if (d.reg === null) t.regTd.appendChild(badge('?', 'none', 'Status konnte nicht geladen werden'));
      else if (!d.reg || !d.reg.length) t.regTd.appendChild(badge('keine Anmeldung', 'none', 'Für diese LVA ist keine Anmeldung in TISS vorgesehen'));
      else {
        const r = d.reg[0];
        const open = /möglich/i.test(r.status);
        const b = badge(open ? 'Anmeldung offen' : (r.status || 'Anmeldung'), open ? 'open' : 'none', `${r.name} · ${r.status}${r.begin ? ' · ab ' + r.begin : ''}${r.end ? ' · bis ' + r.end : ''} · ${r.count}`, `/education/course/courseRegistration.xhtml?${q}`);
        if (open && r.end) { b.classList.add('two'); b.insertAdjacentHTML('beforeend', `<br><small>bis ${shortDate(r.end)}</small>`); }
        if (!open && r.begin && /ab|noch nicht/i.test(r.status)) { b.classList.add('two'); b.insertAdjacentHTML('beforeend', `<br><small>ab ${shortDate(r.begin)}</small>`); }
        t.regTd.appendChild(b);
      }
    }
    if (t.needGrp && t.grpTd) {
      if (d.grp === null) t.grpTd.appendChild(badge('?', 'none'));
      else if (!d.grp || !d.grp.length) t.grpTd.appendChild(badge('keine Gruppen', 'none', 'Keine Gruppenanmeldung in TISS'));
      else {
        const open = d.grp.filter(g => /möglich/i.test(g.status)).length;
        const b = badge(`${d.grp.length} Gruppen`, open ? 'open' : 'none', d.grp.map(g => `${g.name}: ${g.status} (${g.count})`).join('\n'), `/education/course/groupList.xhtml?${q}`);
        if (open) { b.classList.add('two'); b.insertAdjacentHTML('beforeend', `<br><small>${open === d.grp.length ? 'alle' : open} offen</small>`); }
        t.grpTd.appendChild(b);
      }
    }
    if (t.exTd) {
      if (d.exam === null) t.exTd.appendChild(badge('?', 'none'));
      else if (!d.exam || !d.exam.length) t.exTd.appendChild(badge('keine Termine', 'none', 'Keine Prüfungstermine in TISS'));
      else {
        const sorted = d.exam.slice().sort((a, b) => (dateOf(a.name) || 0) - (dateOf(b.name) || 0));
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const next = sorted.find(x => (dateOf(x.name) || 0) >= today) || sorted[sorted.length - 1];
        const dt = dateOf(next.name);
        const dateLabel = dt ? dt.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace(',', '') : 'Prüfung';
        const cm = (next.count || '').match(/(\d+)\s*\/\s*(\d+|∞|unbegrenzt)/);
        const taken = cm ? +cm[1] : null, cap = cm && /^\d+$/.test(cm[2]) ? +cm[2] : null;
        const registered = /angemeldet/i.test(next.status), open = /möglich/i.test(next.status), full = cap !== null && taken >= cap;
        const cls = registered ? 'ok' : full ? 'full' : open ? 'open' : 'none';
        const stText = registered ? 'angemeldet' : full ? 'voll' : open ? 'Anmeldung offen' : (/ab\s*\d/.test(next.status) ? 'noch geschlossen' : 'geschlossen');
        const more = d.exam.length - 1;
        const a = document.createElement('a');
        a.className = 'tiss-exam tiss-st ' + cls;
        a.href = `/education/course/examDateList.xhtml?${q}`;
        a.title = sorted.map(x => `${x.name} — ${x.status}${x.end ? ' (bis ' + x.end + ')' : ''} — ${x.count} Plätze`).join('\n');
        a.innerHTML = `<span class="tiss-exam-top"><b>${dateLabel}</b><span class="tiss-exam-st">${stText}</span></span>` +
          (cap !== null ? `<span class="tiss-cap"><i style="width:${Math.min(100, Math.round(taken / cap * 100))}%"></i></span>` : '') +
          `<span class="tiss-exam-sub"><span>${cap !== null ? `${taken} von ${cap} Plätzen` : (taken !== null ? `${taken} angemeldet` : '')}</span>` +
          `<span>${more > 0 ? more + (more === 1 ? ' weiterer Termin' : ' weitere Termine') : ''}</span></span>`;
        t.exTd.appendChild(a);
      }
    }
    if (t.lnkTd && info.tuwelUrl) {
      const tw = d.tuwel;
      if (!tw) return;
      if (tw.login) t.lnkTd.appendChild(badge('TUWEL: Login nötig', 'wait', 'In TUWEL einloggen, dann „Status aktualisieren“', info.tuwelUrl));
      else if (tw.err) t.lnkTd.appendChild(badge('TUWEL ?', 'none', 'TUWEL nicht erreichbar', info.tuwelUrl));
      else if (tw.acts <= 1) t.lnkTd.appendChild(badge('TUWEL leer', 'none', 'Noch keine Inhalte im TUWEL-Kurs', info.tuwelUrl));
      else t.lnkTd.appendChild(badge(`TUWEL: ${tw.acts} Inhalte`, 'ok', `${tw.acts} Aktivitäten/Materialien in ${tw.sections} Abschnitten`, info.tuwelUrl));
    }
  }

  // ---------------------------------------------------------------
  // Suche im Lehrangebot: layout + "Unscharfe Suche"
  //   TISS only finds exact substrings. With the switch on, the search is sent with the most distinctive word of
  //   the title (so TISS returns a broad list) and the results are then ranked by similarity to what was typed.
  // ---------------------------------------------------------------
  const fuzzyOn = () => !!S.fuzzy;
  const setFuzzy = v => { S.fuzzy = !!v; saveSettings(); };
  const norm = s => (s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
  const bigrams = s => { const r = new Map(); const t = ' ' + s + ' '; for (let i = 0; i < t.length - 1; i++) { const g = t.slice(i, i + 2); r.set(g, (r.get(g) || 0) + 1); } return r; };
  function similarity(q, title) {
    const a = bigrams(q), b = bigrams(title);
    let inter = 0, na = 0, nb = 0;
    a.forEach((c, g) => { na += c; if (b.has(g)) inter += Math.min(c, b.get(g)); });
    b.forEach(c => { nb += c; });
    const dice = na + nb ? 2 * inter / (na + nb) : 0;
    const qt = q.split(' ').filter(Boolean), tt = title.split(' ');
    const wordSim = (x, y) => { const A = bigrams(x), B = bigrams(y); let i = 0, n = 0, m = 0; A.forEach((c, g) => { n += c; if (B.has(g)) i += Math.min(c, B.get(g)); }); B.forEach(c => { m += c; }); return n + m ? 2 * i / (n + m) : 0; };
    const cover = qt.length ? qt.reduce((s, w) => s + Math.max(0, ...tt.map(x => wordSim(w, x))), 0) / qt.length : 0;
    return 0.4 * dice + 0.6 * cover;
  }
  const STOP = new Set(['und', 'fuer', 'der', 'die', 'das', 'mit', 'von', 'zur', 'zum', 'des', 'den', 'im', 'in', 'an', 'auf', 'ein', 'eine', 'einer', 'eines', 'the', 'of', 'and', 'for', 'to']);

  function courseSearch() {
    const form = document.getElementById('courseList');
    if (!form) return;
    const btn = document.getElementById('courseList:cSearchBtn');
    const btnLi = btn && btn.closest('li');
    if (btnLi && !btnLi.querySelector('.tiss-fuzzy')) {
      const lab = document.createElement('label');
      lab.className = 'tiss-switch tiss-fuzzy';
      lab.innerHTML = '<input type="checkbox"><span>Unscharfe Suche</span><span class="tiss-slider"></span>';
      const cb = lab.querySelector('input');
      cb.checked = fuzzyOn();
      cb.addEventListener('change', () => setFuzzy(cb.checked));
      btnLi.appendChild(lab);
      const hint = document.createElement('span');
      hint.className = 'tiss-fuzzy-hint';
      hint.textContent = 'Unscharf: findet LVAs auch bei Tippfehlern, fehlenden Bindestrichen oder anderer Wortreihenfolge (sucht nur im Titel, andere Filter werden dabei nicht angewendet).';
      btnLi.appendChild(hint);
    }
    const sw = form.querySelector('fieldset ol li > a[id^="courseList:j_id"]');
    if (sw && !sw.classList.contains('tiss-search-mode')) {
      sw.classList.add('tiss-search-mode');
      if (S.searchAdvanced && /Erweiterte/.test(sw.textContent) && !sessionStorage.getItem('tissOverhaul.advOpened')) { sessionStorage.setItem('tissOverhaul.advOpened', '1'); sw.click(); }
    }
    if (!form.dataset.tissFuzzy) {
      form.dataset.tissFuzzy = '1';
      form.addEventListener('submit', e => {
        if (!fuzzyOn()) return;
        const inp = document.getElementById('courseList:courseTitleInp') || document.getElementById('courseList:searchField');
        const q = inp && inp.value.trim();
        if (!q || /^\d{3}\.?\w{3}$/.test(q)) return;   // course numbers stay exact
        e.preventDefault(); e.stopImmediatePropagation();
        fuzzySearch(q, form);
      }, true);
    }
  }

  // runs several substring searches in the background (same request TISS's Suchen button sends) and merges them
  async function fuzzySearch(q, form) {
    let box = document.querySelector('.tiss-fuzzy-results');
    if (!box) { box = document.createElement('div'); box.className = 'tiss-fuzzy-results'; form.after(box); }
    const own = document.getElementById('courseList:courseTable'); if (own) own.style.display = 'none';
    const status = m => { box.innerHTML = `<div class="tiss-fuzzy-banner">${m}</div>`; };
    const words = norm(q).split(' ').filter(w => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)).sort((a, b) => b.length - a.length);
    const terms = new Set([q]);
    words.slice(0, 2).forEach(w => {
      const raw = q.split(/[\s\-\/,()]+/).find(t => norm(t) === w) || w;
      terms.add(raw);
      const n = raw.length;
      if (n >= 6) for (let i = 0; i + 5 <= n; i += Math.max(2, Math.floor(n / 4))) terms.add(raw.slice(i, i + 5));   // sliding 5-letter pieces → survives one typo anywhere
      if (n >= 6) terms.add(raw.slice(n - 5));
    });
    const list = Array.from(terms);
    const found = new Map();
    let done = 0;
    status(`Unscharfe Suche nach „${q}“ … 0/${list.length}`);
    for (const term of list) {
      try {
        const page = await fetchDoc('/course/courseList.xhtml');
        const f = page.getElementById('courseList');
        const params = {};
        f.querySelectorAll('input[name]').forEach(i => { if (i.type !== 'submit' && i.type !== 'checkbox') params[i.name] = i.value; });
        const field = f.querySelector('#courseList\\:searchField') || f.querySelector('#courseList\\:courseTitleInp');
        if (!field) throw new Error('Suchfeld nicht gefunden');
        params[field.name] = term;
        const sb = f.querySelector('#courseList\\:cSearchBtn'); if (sb) params[sb.name] = sb.value;
        const res = await jsfPost('/course/courseList.xhtml', params);
        res.querySelectorAll('#courseList\\:courseTable tbody tr').forEach(tr => {
          const td = tr.querySelectorAll('td'); const a = tr.querySelector('a[href*="courseDetails"]'); if (!a || td.length < 6) return;
          const key = td[0].textContent.trim() + ' ' + td[5].textContent.trim();
          if (!found.has(key)) found.set(key, { nr: td[0].textContent.trim(), type: td[1].textContent.trim(), title: a.textContent.trim(), href: a.getAttribute('href'), h: td[3].textContent.trim(), ects: td[4].textContent.trim(), sem: td[5].textContent.trim(), lect: (td[6] ? td[6].textContent : '').replace(/\s+/g, ' ').trim() });
        });
      } catch (e) { diagFail(`Unscharfe Suche „${term}“: ${e.message}`); }
      done++; status(`Unscharfe Suche nach „${q}“ … ${done}/${list.length} (${found.size} Kandidaten)`);
    }
    const qn = norm(q);
    const rows = Array.from(found.values()).map(r => ({ r, s: similarity(qn, norm(r.title)) })).sort((a, b) => b.s - a.s);
    const good = rows.filter(x => x.s >= 0.3), weak = rows.filter(x => x.s < 0.3);
    const row = x => `<tr class="${x.s >= 0.3 ? '' : 'tiss-weak'}" title="Ähnlichkeit ${Math.round(x.s * 100)} %"><td>${x.r.nr}</td><td>${x.r.type}</td><td><a href="${x.r.href}">${x.r.title}</a></td><td>${x.r.h}</td><td>${x.r.ects}</td><td>${x.r.sem}</td><td>${x.r.lect}</td><td><span class="tiss-sim"><i style="width:${Math.round(x.s * 100)}%"></i></span></td></tr>`;
    box.innerHTML = `<div class="tiss-fuzzy-banner"><span>Unscharfe Suche nach <b>„${q}“</b>: ${good.length} passende Treffer${weak.length ? `, ${weak.length} weniger passende` : ''} (aus ${list.length} Suchläufen).</span></div>` +
      (rows.length ? `<div class="ui-datatable"><table role="grid"><thead><tr><th>Nummer</th><th>Typ</th><th>Titel</th><th>Stunden</th><th>ECTS</th><th>Semester</th><th>Vortragende_r</th><th>Ähnlichkeit</th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>` : '<div class="tiss-fuzzy-none">Auch unscharf nichts gefunden.</div>') +
      (weak.length ? `<a href="#" class="tiss-weak-toggle">${weak.length} weniger passende Treffer anzeigen</a>` : '');
    const tog = box.querySelector('.tiss-weak-toggle');
    if (tog) { let shown = false; tog.addEventListener('click', e => { e.preventDefault(); shown = !shown; box.querySelectorAll('tr.tiss-weak').forEach(tr => tr.classList.toggle('tiss-show', shown)); tog.textContent = shown ? 'Weniger passende Treffer ausblenden' : `${weak.length} weniger passende Treffer anzeigen`; }); }
  }

  // ---------------------------------------------------------------
  // ⚙ settings panel (always available, even with the overhaul switched off)
  // ---------------------------------------------------------------
  function lehreToFavorites() { const a = document.getElementById('lehreLink'); if (a && S.layout) a.href = '/education/favorites.xhtml'; }
  function settingsButton() {
    const nav = document.querySelector('#paperHead ul.toolNav');
    if (!nav || nav.querySelector('.tiss-gear')) return;
    const li = document.createElement('li');
    li.className = 'rightAlign';
    li.innerHTML = '<a href="#" class="tiss-gear" title="TISS Overhaul – Einstellungen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span>Overhaul</span></a>';
    li.querySelector('a').append(li.querySelector('svg'));
    li.querySelector('a').addEventListener('click', e => { e.preventDefault(); openSettings(); });
    const logout = nav.querySelector('li.rightAlign');
    logout ? logout.before(li) : nav.appendChild(li);
  }
  function openSettings() {
    if (document.querySelector('.tiss-set')) return;
    const mask = document.createElement('div'); mask.className = 'tiss-set-mask';
    const panel = document.createElement('div'); panel.className = 'tiss-set' + (S.enabled ? '' : ' off');
    let changed = false;
    const rows = OPTIONS.map(o => {
      if (o.group) return `<div class="tiss-set-group">${o.group}</div>`;
      const ctl = o.text
        ? `<input type="text" data-key="${o.key}" value="${String(S[o.key] ?? '').replace(/"/g, '&quot;')}" placeholder="–">`
        : `<label class="tiss-sw"><input type="checkbox" data-key="${o.key}" ${S[o.key] ? 'checked' : ''}><i></i></label>`;
      return `<div class="tiss-set-row${o.master ? ' master' : ''}"><div><div class="tiss-set-label">${o.label}</div>${o.hint ? `<small>${o.hint}</small>` : ''}</div>${ctl}</div>`;
    }).join('');
    panel.innerHTML = `<div class="tiss-set-head"><b>TISS Overhaul</b><button type="button" title="Schließen">×</button></div>
      <div class="tiss-set-body">${rows}</div>
      <div class="tiss-set-foot"><span>Änderungen gelten nach dem Neuladen der Seite.</span><button type="button">Neu laden</button></div>`;
    const close = () => { mask.remove(); panel.remove(); };
    mask.addEventListener('click', close);
    panel.querySelector('.tiss-set-head button').addEventListener('click', close);
    const reload = panel.querySelector('.tiss-set-foot button');
    reload.addEventListener('click', () => location.reload());
    panel.querySelectorAll('[data-key]').forEach(inp => inp.addEventListener('change', () => {
      S[inp.dataset.key] = inp.type === 'checkbox' ? inp.checked : inp.value.trim();
      saveSettings(); changed = true; reload.classList.add('hot');
      if (inp.dataset.key === 'enabled') panel.classList.toggle('off', !S.enabled);
    }));
    document.body.append(mask, panel);
  }

  // ---------------------------------------------------------------
  // Studienangebot: collapsible faculties + "Meine Studien"
  // ---------------------------------------------------------------
  const PIN_KEY = 'tissOverhaul.myStudies';
  function studyCodes() {
    const form = document.getElementById('studyCodeListForm');
    if (!form || form.dataset.tissDone) return;
    form.dataset.tissDone = '1';
    const pins = store.get(PIN_KEY, []);
    const pinned = key => pins.some(p => p.key === key);
    const state = store.get('tissOverhaul.studyOpen', {});
    const PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';

    // pinned box
    const box = document.createElement('section');
    box.className = 'tiss-study-mine';
    form.prepend(box);
    const renderMine = () => {
      const p = store.get(PIN_KEY, []);
      box.style.display = S.studyPinned && p.length ? '' : 'none';
      box.innerHTML = `<h2>Meine Studien</h2>` + p.map(x => `<div class="tiss-mine-row"><span class="tiss-mine-code">${x.code || ''}</span><a href="${x.href}">${x.title}</a><button type="button" class="tiss-icon tiss-icon-sm tiss-pin on" data-key="${x.key}" title="Aus „Meine Studien“ entfernen">${PIN}</button></div>`).join('');
      box.querySelectorAll('.tiss-pin').forEach(b => b.addEventListener('click', () => togglePin(b.dataset.key)));
    };
    const togglePin = (key, info) => {
      let p = store.get(PIN_KEY, []);
      if (p.some(x => x.key === key)) p = p.filter(x => x.key !== key); else if (info) p.push(info);
      store.set(PIN_KEY, p);
      form.querySelectorAll(`.tiss-pin[data-key="${key}"]`).forEach(b => b.classList.toggle('on', p.some(x => x.key === key)));
      renderMine();
    };

    // filter
    const filter = document.createElement('input');
    filter.type = 'text'; filter.className = 'tiss-study-filter'; filter.placeholder = 'Studium suchen (Titel oder Kennzahl)…';
    box.after(filter);

    Array.from(form.querySelectorAll(':scope > h2')).forEach(h2 => {
      const table = h2.nextElementSibling;
      if (!table || table.tagName !== 'TABLE') return;
      const sec = document.createElement('section');
      sec.className = 'tiss-study';
      h2.before(sec); sec.append(h2, table);
      const id = h2.textContent.trim();
      const n = table.querySelectorAll('tbody tr').length;
      h2.innerHTML = `<span class="tiss-chev">▾</span><span>${id}</span><span class="tiss-fav-meta">${n} Studien</span>`;
      const open = id in state ? state[id] : !S.studyCollapsed;
      sec.classList.toggle('collapsed', !open);
      h2.addEventListener('click', () => { sec.classList.toggle('collapsed'); state[id] = !sec.classList.contains('collapsed'); store.set('tissOverhaul.studyOpen', state); });
      table.querySelectorAll('tbody tr').forEach(tr => {
        const a = tr.querySelector('a[href*="curriculum.xhtml"]'); if (!a) return;
        const key = (a.href.match(/key=(\d+)/) || [])[1] || a.href;
        const info = { key, href: a.getAttribute('href'), title: a.textContent.trim(), code: (tr.querySelector('.studyCodeColumn') || {}).textContent?.trim() || '' };
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'tiss-icon tiss-icon-sm tiss-pin' + (pinned(key) ? ' on' : ''); b.dataset.key = key; b.innerHTML = PIN; b.title = 'Zu „Meine Studien“';
        b.addEventListener('click', () => togglePin(key, info));
        a.parentNode.appendChild(b);
      });
    });
    renderMine();
    filter.addEventListener('input', () => {
      const q = norm(filter.value);
      form.querySelectorAll('.tiss-study').forEach(sec => {
        let hit = 0;
        sec.querySelectorAll('tbody tr').forEach(tr => { const ok = !q || norm(tr.textContent).includes(q); tr.style.display = ok ? '' : 'none'; if (ok) hit++; });
        sec.classList.toggle('tiss-filter-hidden', !!q && !hit);
        sec.classList.toggle('tiss-filter-open', !!q && hit > 0);
      });
    });
  }

  // ---------------------------------------------------------------
  // LVA-Detailseite: the three links (TUWEL, Forum, LVA-Details) as proper buttons
  // ---------------------------------------------------------------
  function courseDetails() {
    const a = document.querySelector('#contentInner ul.bulletList a[href*="educationDetails"]');
    if (!a) return;
    const ul = a.closest('ul');
    if (ul.classList.contains('tiss-quicklinks')) return;
    ul.classList.add('tiss-quicklinks');
    a.classList.add('primary');
    a.textContent = 'LVA-Details (Anmeldung, Gruppen, Prüfungen) →';
  }

  // ---------------------------------------------------------------
  // ⚡ Automatische Anmeldung
  //   Idea and request sequence after "TISS Lightning Registrator" by The-breakbar (GPL-3.0,
  //   https://github.com/The-breakbar/TISS-Lightning-Registrator). Re-implemented here on top of the
  //   same window-id handshake the status badges use. The tab has to stay open until it is done.
  // ---------------------------------------------------------------
  let autoState = null;
  function autoRegister() {
    if (!S.autoReg) return;
    const kind = /courseRegistration/.test(path) ? 'lva' : /groupList/.test(path) ? 'group' : /examDateList/.test(path) ? 'exam' : null;
    if (!kind) return;
    document.querySelectorAll('.groupWrapper').forEach((g, idx) => {
      const header = g.querySelector('.groupHeaderWrapper');
      if (!header || header.querySelector('.tiss-auto')) return;
      const hasBtn = g.querySelector('input[type=submit]');
      const els = header.querySelectorAll('.header_element');
      const status = (els[1] || {}).textContent || '';
      if (hasBtn || !/Anmeldung ab/i.test(status)) return;
      const lab = Array.from(g.querySelectorAll('fieldset label')).find(l => /Beginn der Anmeldung/.test(l.textContent));
      const begin = parseDate(lab && lab.nextElementSibling && lab.nextElementSibling.textContent);
      if (!begin) return;
      const name = (els[0] || {}).textContent.replace(/\s+/g, ' ').trim();
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tiss-auto'; b.textContent = '⚡ Automatisch anmelden';
      b.addEventListener('click', e => { e.stopPropagation(); openAutoPanel({ kind, idx, name, begin }); });
      const right = header.querySelector('.rightLink');
      right ? right.before(b) : header.appendChild(b);
    });
  }
  function openAutoPanel(job) {
    document.querySelector('.tiss-auto-panel')?.remove();
    const p = document.createElement('div');
    p.className = 'tiss-auto-panel';
    const pad = n => String(n).padStart(2, '0');
    const local = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    p.innerHTML = `<div class="tiss-auto-head"><b>⚡ Automatische Anmeldung</b><button type="button" class="tiss-auto-close" title="Schließen">×</button></div>
      <div class="tiss-auto-name">${job.name}</div>
      <label>Anmeldung öffnet <input type="datetime-local" class="tiss-auto-time" value="${local(job.begin)}" step="1"></label>
      ${job.kind === 'exam' ? '<label>Zeitslot enthält (optional) <input type="text" class="tiss-auto-slot" placeholder="z. B. 16:00"></label>' : ''}
      <div class="tiss-auto-note">Dieser Tab muss bis dahin offen bleiben. Ab 2 s vor dem Termin wird die Seite 4× pro Sekunde geprüft und beim ersten sichtbaren Anmelden-Button sofort angemeldet.</div>
      <div class="tiss-auto-log"></div>
      <div class="tiss-auto-foot"><button type="button" class="tiss-auto-start">Starten</button><button type="button" class="tiss-auto-stop" disabled>Abbrechen</button><span class="tiss-auto-count"></span></div>`;
    document.body.appendChild(p);
    const log = p.querySelector('.tiss-auto-log'), count = p.querySelector('.tiss-auto-count');
    const start = p.querySelector('.tiss-auto-start'), stop = p.querySelector('.tiss-auto-stop');
    const say = (m, cls) => { const d = document.createElement('div'); d.className = cls || ''; d.textContent = `${new Date().toLocaleTimeString('de-AT')} – ${m}`; log.appendChild(d); log.scrollTop = log.scrollHeight; };
    p.querySelector('.tiss-auto-close').addEventListener('click', () => { if (autoState && autoState.running && !confirm('Automatische Anmeldung wirklich abbrechen?')) return; stopAuto(); p.remove(); });
    let tick = null;
    const stopAuto = () => { if (autoState) autoState.running = false; clearInterval(tick); autoState = null; start.disabled = false; stop.disabled = true; count.textContent = ''; };
    stop.addEventListener('click', () => { stopAuto(); say('Abgebrochen.'); });
    start.addEventListener('click', async () => {
      const target = new Date(p.querySelector('.tiss-auto-time').value);
      if (isNaN(target)) { say('Ungültige Zeit.', 'err'); return; }
      try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
      autoState = { running: true, job, target, slot: (p.querySelector('.tiss-auto-slot') || {}).value || '' };
      start.disabled = true; stop.disabled = false;
      say(`Warte bis ${target.toLocaleString('de-AT')} …`);
      tick = setInterval(() => { const s = Math.max(0, Math.round((target - Date.now()) / 1000)); count.textContent = s > 0 ? `noch ${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m ${s % 60}s` : 'läuft …'; }, 1000);
      const st = autoState;
      const keep = setInterval(() => { if (!st.running) return clearInterval(keep); fetchDoc(path + location.search.replace(/[?&]ds(w|r)id=[^&]*/g, '').replace(/^&/, '?')).catch(() => {}); }, 20 * 60 * 1000);
      while (st.running && Date.now() < target - 2000) await sleep(Math.min(1000, Math.max(50, target - 2000 - Date.now())));
      if (!st.running) return;
      const res = await runAuto(st, say);
      clearInterval(keep);
      if (res) { say('✅ Angemeldet!', 'ok'); try { new Notification('TISS: angemeldet ✅', { body: job.name }); } catch (e) {} }
      else if (st.running) { say('❌ Anmeldung nicht gelungen – bitte manuell prüfen.', 'err'); try { new Notification('TISS: Anmeldung fehlgeschlagen', { body: job.name }); } catch (e) {} }
      stopAuto();
    });
  }
  async function jsfPost(pathname, params) {
    const token = String(Math.floor(Math.random() * 999));
    document.cookie = `dsrwid-${token}=${bgWindowId}; expires=${new Date(Date.now() + 3000).toUTCString()}; path=/; SameSite=Strict`;
    const body = new URLSearchParams(params);
    body.set('jakarta.faces.ClientWindow', bgWindowId);
    const r = await fetch(`${location.origin}${pathname}?dswid=${bgWindowId}&dsrid=${token}`, { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (r.type === 'opaqueredirect' || r.status >= 300) throw new Error(`HTTP ${r.status || 'redirect'}`);
    return new DOMParser().parseFromString(await r.text(), 'text/html');
  }
  async function runAuto(st, say) {
    const pagePath = path;
    const query = location.search.replace(/[?&]ds(w|r)id=[^&]*/g, '').replace(/^&/, '?');
    const findWrapper = doc => { const ws = Array.from(doc.querySelectorAll('.groupWrapper')); return ws.find(w => (w.querySelector('.groupHeaderWrapper .header_element') || {}).textContent?.replace(/\s+/g, ' ').trim() === st.job.name) || ws[st.job.idx]; };
    const deadline = st.target.getTime() + 15 * 60 * 1000;
    let attempts = 0;
    while (st.running && Date.now() < deadline) {
      let doc;
      try { doc = await fetchDoc(pagePath + query); } catch (e) { await sleep(300); continue; }
      const w = findWrapper(doc);
      if (!w) { say('Gruppe auf der Seite nicht gefunden.', 'err'); return false; }
      if (w.querySelector('input[type=submit][value*="bmeld"]')) { say('Bereits angemeldet.'); return true; }
      const btn = Array.from(w.querySelectorAll('input[type=submit]')).find(b => /anmeld|register/i.test(b.value));
      if (!btn) { await sleep(250); continue; }
      attempts++;
      say(`Anmelden-Button da (Versuch ${attempts}) – sende Anmeldung …`);
      try {
        const form = btn.closest('form');
        const vs = form.querySelector('input[name="jakarta.faces.ViewState"]').value;
        const confirmDoc = await jsfPost(pagePath, { [btn.name]: btn.value, [`${form.id}_SUBMIT`]: '1', 'jakarta.faces.ViewState': vs });
        const regForm = confirmDoc.querySelector('form#regForm') || Array.from(confirmDoc.querySelectorAll('form')).find(f => /regForm/.test(f.id));
        if (!regForm) {
          const msg = (confirmDoc.getElementById('globalMessagesPanel') || {}).textContent?.replace(/\s+/g, ' ').trim();
          say('Keine Bestätigungsseite erhalten' + (msg ? `: ${msg}` : '.'), 'err');
        } else {
          const ok = Array.from(regForm.querySelectorAll('input[type=submit], button[type=submit]')).find(b => /anmeld|register|best/i.test(b.value || b.textContent));
          const params = { [`${regForm.id}_SUBMIT`]: '1', 'jakarta.faces.ViewState': regForm.querySelector('input[name="jakarta.faces.ViewState"]').value };
          if (ok) params[ok.name] = ok.value || '';
          const slots = regForm.querySelector('select[id$="subgrouplist"]');
          if (slots) { const opt = Array.from(slots.options).find(o => st.slot && o.textContent.includes(st.slot)) || slots.options[0]; if (opt) { params[slots.name] = opt.value; say(`Zeitslot: ${opt.textContent.trim()}`); } }
          const sc = regForm.querySelector('select[id$="studyCode"]');
          if (sc) { const opt = Array.from(sc.options).find(o => S.studyCode && o.value.replace(/\s/g, '') === String(S.studyCode).replace(/\s/g, '')) || sc.options[0]; if (opt) { params[sc.name] = opt.value; say(`Studienkennzahl: ${opt.textContent.trim()}`); } }
          await jsfPost('/education/course/register.xhtml', params);
          say('Bestätigung gesendet, prüfe …');
        }
      } catch (e) { say(`Fehler: ${e.message}`, 'err'); }
      try {
        const check = await fetchDoc(pagePath + query);
        const w2 = findWrapper(check);
        if (w2 && w2.querySelector('input[type=submit][value*="bmeld"]')) return true;
        const msg = (check.getElementById('globalMessagesPanel') || {}).textContent?.replace(/\s+/g, ' ').trim();
        if (msg) say(`TISS: ${msg}`);
      } catch (e) {}
      if (attempts >= 5) { say('5 Versuche ohne Erfolg.', 'err'); return false; }
      await sleep(400);
    }
    return false;
  }

  // ---------------------------------------------------------------
  // Kalender
  // ---------------------------------------------------------------
  const COLOR_KEY = 'tissOverhaul.courseColors';
  function colorFor(courseNr, type) {
    const custom = store.get(COLOR_KEY, {});
    if (custom[courseNr]) return custom[courseNr];
    if (COURSE_COLORS[courseNr]) return COURSE_COLORS[courseNr];
    const pal = /^(UE|LU|PR|AU|RU|ZU|KU|EU|FU|MU|PU|SE|PS|EX|UX)$/.test(type || '') ? WARM : /^(VU|VD|VL|VR|VX|RE|KO|KV)$/.test(type || '') ? MID : COLD;
    let h = 0; for (const c of courseNr) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return pal[h % pal.length];
  }
  // which (course, start) pairs are exams: TISS's calendar titles don't say, the ICS feed's description does
  function examKeys() {
    const keys = new Set(); const pad = n => String(n).padStart(2, '0');
    (icsCache || []).forEach(x => {
      if (!/prüfung/i.test((x.desc || '') + ' ' + (x.t || ''))) return;
      const m = x.t.match(/^(\d{3}\.[A-Z0-9]{3})/); if (!m) return;
      const d = new Date(x.s); keys.add(`${m[1]}|${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}|${pad(d.getHours())}:${pad(d.getMinutes())}`);
    });
    return keys;
  }
  function calendar() {
    const myGroups = store.get('tissOverhaul.myGroups', {});
    if (icsCache === null && path.includes('/personSchedule.xhtml')) loadIcs().then(() => calendar());
    const exams = examKeys();
    document.querySelectorAll('.fc-timegrid-event, .fc-daygrid-event').forEach(ev => {
      const title = ev.querySelector('.fc-event-title'); if (!title) return;
      const m = title.textContent.match(/^(\d{3}\.[A-Z0-9]{3})\s*([A-Z]{2})?/); if (!m) return;
      const grp = title.textContent.match(/\s-\s(?:Gruppe\s+)?(.+?)\s*$/);
      const mine = myGroups[m[1]];
      const date = (ev.closest('[data-date]') || {}).dataset?.date || '';
      const hhmm = ((ev.querySelector('.fc-event-time') || {}).textContent || '').match(/\d{2}:\d{2}/);
      const isExam = ev.classList.contains('event_exam') || /prüfung/i.test(title.textContent) || (!!hhmm && exams.has(`${m[1]}|${date}|${hhmm[0]}`));
      ev.classList.toggle('tiss-examev', isExam);
      ev.classList.toggle('tiss-othergroup', !isExam && !!(S.calOwnGroup && grp && mine && grp[1].replace(/^Gruppe\s+/, '') !== mine.replace(/^Gruppe\s+/, '')));
      if (!S.calColors) return;
      const col = colorFor(m[1], m[2]);
      if (ev.dataset.tissColor === col) return;
      ev.dataset.tissColor = col;
      ev.style.setProperty('--tiss-ev', col);
    });
    if (S.calBlurToken) document.querySelectorAll('p').forEach(p => { if (/token=/.test(p.textContent) && !p.classList.contains('tiss-token-blur')) p.classList.add('tiss-token-blur'); });
    if (S.calColors) calendarLegend();
  }
  // legend = the courses of the shown period, with hours, as toggles that hide/show their events
  const HIDE_KEY = 'tissOverhaul.calHidden';
  function calendarLegend() {
    const old = document.querySelector('dl.legend');
    if (!old) return;
    if (old.previousElementSibling && old.previousElementSibling.tagName === 'H3') old.previousElementSibling.style.display = 'none';
    const hidden = new Set(store.get(HIDE_KEY, []));
    const courses = new Map();
    document.querySelectorAll('.fc-event[data-tiss-color]:not(.tiss-othergroup)').forEach(ev => {
      const t = ev.querySelector('.fc-event-title'); if (!t) return;
      const m = t.textContent.match(/^(\d{3}\.[A-Z0-9]{3})\s+([A-Z]{2})\s+(.*?)(\s+-\s+.*)?$/); if (!m) return;
      const tm = (ev.querySelector('.fc-event-time') || {}).textContent?.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
      const h = tm ? ((+tm[3] * 60 + +tm[4]) - (+tm[1] * 60 + +tm[2])) / 60 : 0;
      const c = courses.get(m[1]) || { nr: m[1], type: m[2], title: m[3], col: ev.dataset.tissColor, hours: 0, n: 0 };
      c.hours += h; c.n++; courses.set(m[1], c);
      ev.classList.toggle('tiss-hidden', hidden.has(m[1]));
    });
    const key = Array.from(courses.entries()).map(([k, c]) => k + c.n + c.col).join(',');
    let box = document.querySelector('.tiss-legend');
    if (box && box.dataset.key === key) return;
    if (!box) { box = document.createElement('div'); box.className = 'tiss-legend'; old.before(box); }
    box.dataset.key = key;
    const order = { VO: 0, VU: 1, UE: 2 };
    const list = Array.from(courses.values()).sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9) || a.title.localeCompare(b.title));
    const total = list.reduce((s, c) => s + (hidden.has(c.nr) ? 0 : c.hours), 0);
    const fmtH = h => (Math.round(h * 10) / 10).toLocaleString('de-AT') + ' h';
    box.innerHTML = `<div class="tiss-legend-head"><b>Legende</b><span>${list.length} LVAs · ${fmtH(total)} in diesem Zeitraum</span><a href="#" class="tiss-legend-all">${hidden.size ? 'alle einblenden' : ''}</a></div>
      <div class="tiss-legend-grid">${list.map(c => `<div class="tiss-chip${hidden.has(c.nr) ? ' off' : ''}" data-nr="${c.nr}" title="Klicken, um diese LVA im Kalender aus-/einzublenden"><i style="background:${c.col}"></i><span class="t"><small>${c.nr} ${c.type}</small>${c.title}</span><span class="h">${c.n}× · ${fmtH(c.hours)}</span></div>`).join('')}</div>
      <div class="tiss-legend-foot"><span><i class="exam"></i>Prüfungstermin</span><span><i class="online"></i>nur online</span><span>Klick auf eine LVA blendet sie aus.</span></div>`;
    box.querySelectorAll('.tiss-chip').forEach(ch => ch.addEventListener('click', () => {
      const h = new Set(store.get(HIDE_KEY, [])); h.has(ch.dataset.nr) ? h.delete(ch.dataset.nr) : h.add(ch.dataset.nr); store.set(HIDE_KEY, Array.from(h));
      box.dataset.key = ''; calendarLegend();
    }));
    box.querySelector('.tiss-legend-all').addEventListener('click', e => { e.preventDefault(); store.set(HIDE_KEY, []); box.dataset.key = ''; calendarLegend(); });
  }

  // ---------------------------------------------------------------
  // sidebar: rarely used sections under "Extras"
  // ---------------------------------------------------------------
  function sidebarExtras() {
    if (!S.navExtras) return;
    const ul = document.querySelector('#supNavBody > ul');
    if (!ul || ul.querySelector('.tiss-extras')) return;
    const names = /Best Teaching|Vorregistrierung|Mobility|Unterstützungsangebote/i;
    const items = Array.from(ul.children).filter(li => names.test((li.querySelector('a.supNavMenuHeader') || {}).textContent || ''));
    if (!items.length) return;
    const li = document.createElement('li');
    li.className = 'tiss-extras' + (store.get('tissOverhaul.extrasOpen', false) ? ' open' : '');
    li.innerHTML = '<span><a href="#" class="supNavMenuHeader tiss-extras-head">Extras <i class="tiss-chev">▾</i></a></span><ul class="tiss-extras-list"></ul>';
    const list = li.querySelector('ul');
    items.forEach(i => list.appendChild(i));
    ul.appendChild(li);
    li.querySelector('.tiss-extras-head').addEventListener('click', e => { e.preventDefault(); li.classList.toggle('open'); store.set('tissOverhaul.extrasOpen', li.classList.contains('open')); });
  }

  // ---------------------------------------------------------------
  // calendar extras: ICS feed (rooms), next-event bar, popup, hour range, compact, exams, overlap
  // ---------------------------------------------------------------
  const fcWidget = () => { try { return Object.values(W.PrimeFaces.widgets).find(w => w && w.id === 'calendarForm:schedule'); } catch (e) { return null; } };
  const fcCal = () => { const w = fcWidget(); return w && w.calendar; };
  let icsCache = null;
  async function loadIcs() {
    if (icsCache) return icsCache;
    const txtAll = Array.from(document.querySelectorAll('#contentInner p')).map(p => p.textContent).join(' ');
    const m = txtAll.match(/https:\/\/tiss\.tuwien\.ac\.at\/events\/rest\/calendar\/personal\?\S*token=[0-9a-f-]+/);
    if (!m) return (icsCache = []);
    const c = store.get('tissOverhaul.ics', null);
    if (c && Date.now() - c.t < 10 * 60 * 1000 && c.url === m[0]) return (icsCache = c.ev);
    try {
      const txt = await (await fetch(m[0], { credentials: 'same-origin', cache: 'no-store' })).text();
      const ev = [];
      txt.replace(/\r?\n[ \t]/g, '').split('BEGIN:VEVENT').slice(1).forEach(b => {
        const g = k => { const x = b.match(new RegExp('^' + k + '([^:\\n]*):(.*)$', 'm')); return x ? { p: x[1], v: x[2].replace(/\\,/g, ',').replace(/\;/g, ';').replace(/\\n/g, ' ').trim() } : null; };
        const d = o => { if (!o) return null; const x = o.v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/); if (!x) return null; return x[7] ? Date.UTC(+x[1], +x[2] - 1, +x[3], +x[4], +x[5]) : new Date(+x[1], +x[2] - 1, +x[3], +(x[4] || 0), +(x[5] || 0)).getTime(); };
        ev.push({ s: d(g('DTSTART')), e: d(g('DTEND')), t: (g('SUMMARY') || {}).v || '', loc: (g('LOCATION') || {}).v || '', desc: (g('DESCRIPTION') || {}).v || '' });
      });
      store.set('tissOverhaul.ics', { t: Date.now(), url: m[0], ev });
      vault.set('tiss.icsSnapshot', { t: Date.now(), ev, raw: txt });
      return (icsCache = ev);
    } catch (e) { diag('ICS: ' + e.message); return (icsCache = []); }
  }
  const ICON_MAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>';
  const ROOM_KEY = 'tissOverhaul.rooms';
  const roomsDb = () => store.get(ROOM_KEY, { byName: {}, byCode: {} });
  const saveRooms = db => { store.set(ROOM_KEY, db); vault.set('tiss.rooms', db); };
  // TISS's own event dialog carries the room link (roomSchedule.xhtml?roomCode=…); open it invisibly and read it
  function peekRoomLink(ev) {
    return new Promise(res => {
      const sel = '.ui-dialog a[href*="roomSchedule.xhtml"][href*="roomCode="]';
      const before = new Set(document.querySelectorAll(sel));
      const found = () => Array.from(document.querySelectorAll(sel)).filter(a => !before.has(a)).map(a => ({ code: decodeURIComponent((a.getAttribute('href').match(/roomCode=([^&]+)/) || [])[1] || ''), name: a.textContent.trim() })).filter(x => x.code);
      document.body.classList.add('tiss-peek');
      let mo, to;
      const done = r => {
        clearTimeout(to); mo.disconnect();
        setTimeout(() => {
          try { Object.values(W.PrimeFaces.widgets).forEach(w => { if (w && w.jq && w.jq.hasClass('ui-dialog') && w.jq.is(':visible') && w.hide) w.hide(); }); } catch (e) {}
          document.body.classList.remove('tiss-peek');
        }, 150);
        res(r);
      };
      mo = new MutationObserver(() => { const f = found(); if (f.length) done(f); });
      mo.observe(document.body, { childList: true, subtree: true });
      to = setTimeout(() => done([]), 5000);
      const ce = new MouseEvent('click', { bubbles: true, cancelable: true }); ce.tissBypass = true; ev.dispatchEvent(ce);
    });
  }
  async function roomDetails(code) {
    const db = roomsDb();
    if (db.byCode[code] && db.byCode[code].maps) return db.byCode[code];
    try {
      const d = await fetchDoc(`/events/roomSchedule.xhtml?roomCode=${encodeURIComponent(code)}`);
      const a = d.querySelector('#subHeader a[href*="maps.tuwien.ac.at"]');
      const info = { code, maps: a ? a.getAttribute('href') : '', addr: ((d.querySelector('#subHeader') || {}).textContent || '').trim().split('\n')[0].trim() };
      db.byCode[code] = info; saveRooms(db); return info;
    } catch (e) { diag('Raum ' + code + ': ' + e.message); return null; }
  }
  // name (as in the ICS feed / TISS dialog) → { code, maps }; peeks the TISS dialog once per room
  async function resolveRoom(ev, name) {
    const db = roomsDb();
    let code = name && db.byName[name];
    if (!code && ev && !(name && name in db.byName)) {
      const links = await peekRoomLink(ev);
      links.forEach(l => { db.byName[l.name] = l.code; if (name) db.byName[name] = db.byName[name] || l.code; });
      if (name && !db.byName[name]) db.byName[name] = ''; // remember the miss, don't peek again
      saveRooms(db);
      code = (name && db.byName[name]) || (links[0] || {}).code;
    }
    if (!code) return null;
    const info = await roomDetails(code);
    return info ? { code, maps: info.maps, addr: info.addr } : { code, maps: '', addr: '' };
  }
  const mapsUrl = loc => { const db = roomsDb(); const c = db.byName[loc]; if (c && db.byCode[c] && db.byCode[c].maps) return db.byCode[c].maps; const code = (loc.match(/\b[A-Z]{2}\d{2}[A-Z]\d{2,3}\b/) || [])[0]; return `https://maps.tuwien.ac.at/?q=${encodeURIComponent(code || loc)}#map`; };
  const fmtMin = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? `${m} Min` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} Min` : `${Math.floor(m / 1440)} Tag${m >= 2880 ? 'en' : ''}`; };
  let nextTimer = null;
  async function nextEventBar() {
    if (!S.calNext || !path.includes('/personSchedule.xhtml')) return;
    const anchor = document.getElementById('calendarForm');
    if (!anchor || document.querySelector('.tiss-next')) return;
    const bar = document.createElement('div'); bar.className = 'tiss-next'; bar.textContent = 'Nächster Termin wird gesucht …';
    anchor.before(bar);
    const ev = await loadIcs();
    const render = () => {
      const now = Date.now();
      const live = ev.filter(x => x.s <= now && x.e > now).sort((a, b) => a.e - b.e)[0];
      const next = ev.filter(x => x.s > now).sort((a, b) => a.s - b.s)[0];
      const x = live || next;
      if (!x) { bar.textContent = 'Keine weiteren Termine im Kalender.'; return; }
      bar.classList.toggle('live', !!live);
      const day = new Date(x.s).toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' ' + new Date(x.s).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
      bar.innerHTML = `<div><div class="k">${live ? 'Läuft · endet in' : 'Nächster Termin in'}</div><div class="v">${live ? fmtMin(x.e - now) : fmtMin(x.s - now)}</div></div>
        <div><div class="room">${x.loc || 'kein Raum angegeben'}</div><div class="when">${day}</div></div>` + (x.loc ? `<a class="map" href="${mapsUrl(x.loc)}" target="_blank" rel="noopener" title="Raum auf der TU-Karte">${ICON_MAP}</a>` : '<span></span>');
    };
    render();
    clearInterval(nextTimer); nextTimer = setInterval(render, 30000);
  }
  function eventPopup() {
    if (!S.calPopup || document.body.dataset.tissPop) return;
    document.body.dataset.tissPop = '1';
    document.addEventListener('click', async e => {
      const ev = e.target.closest('.fc-event'); if (!ev || !ev.closest('#calendarForm\\:schedule') || e.tissBypass) return;
      e.stopPropagation(); e.preventDefault();
      document.querySelector('.tiss-pop')?.remove();
      if (ev.classList.contains('tiss-exam-ev')) {
        const cal = fcCal(); const fe = cal && cal.getEvents().find(x => x.classNames.includes('tiss-exam-ev') && x.startStr === (ev.closest('[data-date]') || {}).dataset?.date);
        const items = (fe && fe.extendedProps.items) || [];
        const pop = document.createElement('div'); pop.className = 'tiss-pop';
        pop.innerHTML = `<div class="tiss-pop-head"><i style="background:#b91c1c"></i><div><b>Prüfungen am ${fe ? new Date(fe.start).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit' }) : ''}</b></div></div><ul>${items.map(x => `<li><a href="/education/course/examDateList.xhtml?courseNr=${x.nr.replace('.', '')}&semester=${x.sem}">${x.title}</a> <span style="color:var(--t-muted)">· ${x.name.replace(/\d{2}\.\d{2}\.\d{4}/, '').trim()} · ${x.status}</span></li>`).join('')}</ul>`;
        const r = ev.getBoundingClientRect(); pop.style.top = (r.bottom + window.scrollY + 6) + 'px'; pop.style.left = Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - 340)) + 'px';
        document.body.appendChild(pop);
        const close = x => { if (!pop.contains(x.target)) { pop.remove(); document.removeEventListener('click', close, true); } };
        setTimeout(() => document.addEventListener('click', close, true), 0);
        return;
      }
      const title = (ev.querySelector('.fc-event-title') || {}).textContent || '';
      const m = title.match(/^(\d{3}\.[A-Z0-9]{3})\s+([A-Z]{2})\s+(.*?)(\s+-\s+(.*))?$/);
      const time = (ev.querySelector('.fc-event-time') || {}).textContent || '';
      const date = (ev.closest('[data-date]') || {}).dataset?.date || '';
      const ics = await loadIcs();
      const hhmm = (time.match(/(\d{2}):(\d{2})/) || []);
      const start = date && hhmm.length ? new Date(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), +hhmm[1], +hhmm[2]).getTime() : null;
      const hit = ics.find(x => start && Math.abs(x.s - start) < 60000 && (!m || x.t.startsWith(m[1]))) || ics.find(x => m && x.t.startsWith(m[1]) && new Date(x.s).toISOString().slice(0, 10) === date);
      const sem = date ? (+date.slice(5, 7) >= 10 ? date.slice(0, 4) + 'W' : +date.slice(5, 7) <= 2 ? (+date.slice(0, 4) - 1) + 'W' : date.slice(0, 4) + 'S') : '';
      const nr = m ? m[1].replace('.', '') : '';
      const cache = store.get(CACHE_KEY, {});
      const cached = m ? Object.values(cache).map(x => x.d).find(d => d && d.nr === m[1]) : null;
      const tuwel = cached && cached.tuwel ? cached.tuwel : (nr ? `https://tuwel.tuwien.ac.at/course/search.php?q=${encodeURIComponent(m[1])}` : '');
      const pop = document.createElement('div'); pop.className = 'tiss-pop';
      pop.innerHTML = `<div class="tiss-pop-head"><i class="tiss-pop-color" style="background:${ev.dataset.tissColor || '#999'}" title="Farbe ändern"></i><div><b>${m ? m[3] : title}</b><div style="color:var(--t-muted)">${m ? `${m[1]} · ${m[2]}` : ''}${m && m[5] ? ` · ${m[5]}` : ''}</div></div>${hit && hit.loc ? `<a class="map" href="${mapsUrl(hit.loc)}" target="_blank" rel="noopener" title="Raum auf der TU-Karte">${ICON_MAP}</a>` : ''}</div>
        <div class="tiss-pop-row"><span>Zeit</span><span>${date ? new Date(date).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit' }) : ''} ${time}</span></div>
        <div class="tiss-pop-row"><span>Raum</span><span class="tiss-pop-room">${hit && hit.loc ? hit.loc : '–'}</span></div>
        ${hit && hit.desc ? `<div class="tiss-pop-row"><span>Info</span><span>${hit.desc.slice(0, 120)}</span></div>` : ''}
        <div class="tiss-pop-links">${nr ? `<a class="primary" href="/course/educationDetails.xhtml?courseNr=${nr}&semester=${sem}">LVA-Seite</a><a href="${tuwel}" target="_blank" rel="noopener">TUWEL ↗</a><a href="/education/course/courseRegistration.xhtml?courseNr=${nr}&semester=${sem}">Anmeldung</a><a href="/education/course/examDateList.xhtml?courseNr=${nr}&semester=${sem}">Prüfungen</a>` : ''}<a href="#" class="tiss-pop-tiss">TISS-Details</a></div>`;
      if (m) pop.querySelector('.tiss-pop-color').addEventListener('click', x => { x.stopPropagation(); openColorMenu(x.target, m[1], m[2], col => { x.target.style.background = col; calendar(); }); });
      resolveRoom(ev, hit && hit.loc).then(info => {
        if (!info || !pop.isConnected) return;
        const roomEl = pop.querySelector('.tiss-pop-room'); const name = (hit && hit.loc) || info.code;
        roomEl.innerHTML = `<a href="/events/roomSchedule.xhtml?roomCode=${encodeURIComponent(info.code)}" title="Raumbelegung">${name}</a>${info.addr ? `<br><small style="color:var(--t-muted)">${info.addr}</small>` : ''}`;
        if (info.maps) { let a = pop.querySelector('.tiss-pop-head a.map'); if (!a) { a = document.createElement('a'); a.className = 'map'; a.target = '_blank'; a.rel = 'noopener'; a.title = 'Raum auf der TU-Karte'; a.innerHTML = ICON_MAP; pop.querySelector('.tiss-pop-head').appendChild(a); } a.href = info.maps; }
      }).catch(() => {});
      const r = ev.getBoundingClientRect();
      pop.style.top = (r.top + window.scrollY) + 'px';
      pop.style.left = Math.max(8, Math.min(r.right + window.scrollX + 8, window.innerWidth - 340)) + 'px';
      document.body.appendChild(pop);
      pop.querySelector('.tiss-pop-tiss').addEventListener('click', x => { x.preventDefault(); pop.remove(); const ce = new MouseEvent('click', { bubbles: true, cancelable: true }); ce.tissBypass = true; ev.dispatchEvent(ce); });
      const close = x => { if (!pop.contains(x.target)) { pop.remove(); document.removeEventListener('click', close, true); } };
      setTimeout(() => document.addEventListener('click', close, true), 0);
    }, true);
  }
  function calendarOptions() {
    const cal = fcCal(); if (!cal) return;
    try {
      const startH = Math.max(0, Math.min(12, parseInt(S.calStart, 10) || 7));
      const minT = `${String(startH).padStart(2, '0')}:00:00`;
      let endH = 20;
      cal.getEvents().forEach(ev => { if (ev.end && !ev.allDay) endH = Math.max(endH, ev.end.getHours() + (ev.end.getMinutes() ? 1 : 0)); });
      const maxT = `${String(Math.min(24, endH)).padStart(2, '0')}:00:00`;
      if (cal.getOption('slotMinTime') !== minT) cal.setOption('slotMinTime', minT);
      if (cal.getOption('slotMaxTime') !== maxT) cal.setOption('slotMaxTime', maxT);
      if (cal.getOption('slotEventOverlap') !== !S.calNoOverlap) cal.setOption('slotEventOverlap', !S.calNoOverlap);
    } catch (e) { diag('Kalender-Optionen: ' + e.message); }
  }
  function compactToggle() {
    const chunk = document.querySelector('#calendarForm\\:schedule .fc-toolbar-chunk:last-child');
    if (!chunk || chunk.querySelector('.tiss-compact-btn')) return;
    const fc = document.getElementById('calendarForm:schedule');
    const apply = on => {
      fc.classList.toggle('tiss-compact', on);
      try {
        const cal = fcCal();
        if (on) { cal.setOption('expandRows', true); cal.setOption('contentHeight', Math.max(480, window.innerHeight - fc.getBoundingClientRect().top - 90)); }
        else { cal.setOption('expandRows', false); cal.setOption('contentHeight', 'auto'); }
      } catch (e) { diag('Kompakt: ' + e.message); }
    };
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fc-button fc-button-primary tiss-compact-btn'; b.textContent = 'Kompakt';
    let on = !!S.calCompact; apply(on); b.classList.toggle('fc-button-active', on);
    b.addEventListener('click', () => { on = !on; apply(on); b.classList.toggle('fc-button-active', on); S.calCompact = on; saveSettings(); });
    chunk.appendChild(b);
  }
  // TISS lists every parallel exam slot as its own event → keep one per course+time, count the rest
  function mergeExams() {
    const cal = fcCal(); if (!cal) return;
    const seen = new Map();
    cal.getEvents().forEach(ev => {
      if (ev.allDay || ev.display === 'background') return;
      const base = ev.extendedProps.tissBase || ev.title || '';
      const m = base.match(/^(\d{3}\.[A-Z0-9]{3})/); if (!m) return;
      const exam = ev.classNames.includes('event_exam') || /prüfung/i.test(base);
      // exams: one per course + time slot (parallel slots); everything else: only exact duplicates
      const key = `${exam ? m[1] : base}|${ev.start ? ev.start.getTime() : ''}|${ev.end ? ev.end.getTime() : ''}`;
      const first = seen.get(key);
      if (!first) { seen.set(key, { ev, n: 1 }); return; }
      first.n++;
      if (ev.display !== 'none') ev.setProp('display', 'none');
    });
    seen.forEach(({ ev, n }) => {
      const base = ev.extendedProps.tissBase || ev.title;
      if (!ev.extendedProps.tissBase) ev.setExtendedProp('tissBase', base);
      const t = n > 1 ? (/\(Prüfung\)/.test(base) ? base.replace('(Prüfung)', `(Prüfung ×${n})`) : `${base} ×${n}`) : base;
      if (ev.title !== t) ev.setProp('title', t);
    });
  }
  function calendarRefreshInside() {
    const fs = document.querySelector('#calendarForm fieldset.tableFilter'); if (!fs) return;
    const cal = fs.querySelector('.ui-calendar'); if (!cal || fs.querySelector('.tiss-datefield')) return;
    const btn = Array.from(fs.querySelectorAll('button.ui-button')).find(b => /Aktualisieren/.test(b.textContent)); if (!btn) return;
    const li = btn.closest('li');
    const wrap = document.createElement('span'); wrap.className = 'tiss-datefield';
    cal.replaceWith(wrap); wrap.append(cal, btn);
    btn.classList.add('tiss-refresh'); btn.title = 'Aktualisieren';
    if (li && !li.textContent.trim() && !li.querySelector('input,select,button')) li.classList.add('tiss-empty');
  }
  function examsInCalendar() {
    if (!S.calExams) return;
    const cal = fcCal(); if (!cal) return;
    const cache = store.get(CACHE_KEY, {});
    const byDay = new Map();
    Object.entries(cache).forEach(([key, { d }]) => {
      if (!d || !d.exam || !d.title) return;
      const sem = key.split(':')[1] || '';
      d.exam.forEach(x => {
        const dm = x.name.match(/(\d{2})\.(\d{2})\.(\d{4})/); if (!dm) return;
        const day = `${dm[3]}-${dm[2]}-${dm[1]}`;
        (byDay.get(day) || byDay.set(day, []).get(day)).push({ nr: d.nr, title: d.title, sem, name: x.name, status: x.status, reg: /angemeldet/i.test(x.status) });
      });
    });
    byDay.forEach((items, day) => {
      const id = `tiss-exam-${day}`;
      const seen = new Map(); items.forEach(i => { if (!seen.has(i.nr)) seen.set(i.nr, i); });
      const list = Array.from(seen.values());
      const title = list.length === 1 ? `Prüfung · ${list[0].title}${list[0].reg ? ' ✓' : ''}` : `${list.length} Prüfungen${list.some(i => i.reg) ? ' ✓' : ''}`;
      const ex = cal.getEventById(id);
      if (ex) { if (ex.title !== title) ex.setProp('title', title); ex.setExtendedProp('items', list); return; }
      cal.addEvent({ id, title, start: day, allDay: true, classNames: ['tiss-exam-ev'], extendedProps: { items: list } });
    });
  }
  function icsSection() {
    const h2 = Array.from(document.querySelectorAll('#contentInner form h2')).find(h => /externem Kalender/i.test(h.textContent));
    if (!h2 || h2.closest('form').classList.contains('tiss-ics-form')) return;
    const form = h2.closest('form');
    const body = document.createElement('div'); body.className = 'tiss-ics-body';
    Array.from(form.children).filter(c => c !== h2).forEach(c => body.appendChild(c));
    form.appendChild(body);
    form.classList.add('tiss-ics-form', store.get('tissOverhaul.icsOpen', false) ? 'open' : 'collapsed');
    h2.innerHTML = '<span class="tiss-chev">▾</span>Externer Kalender';
    const dl = document.createElement('a'); dl.href = '#'; dl.className = 'tiss-ics-dl'; dl.textContent = '.ics herunterladen';
    dl.addEventListener('click', async e => { e.preventDefault(); e.stopPropagation(); await loadIcs(); const snap = vault.get('tiss.icsSnapshot', null); const raw = snap && snap.raw; if (!raw) return alert('Kalender-Feed konnte nicht geladen werden.'); const u = URL.createObjectURL(new Blob([raw], { type: 'text/calendar' })); const a = document.createElement('a'); a.href = u; a.download = `tiss-kalender-${new Date().toISOString().slice(0, 10)}.ics`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); });
    const off = document.createElement('a'); off.href = 'https://www.tuwien.at/tiss-offline'; off.className = 'tiss-ics-dl'; off.textContent = 'Offline-Kalender öffnen ↗'; off.target = '_blank';
    h2.after(dl, off);
    body.before(dl, off);
    h2.addEventListener('click', () => { form.classList.toggle('collapsed'); store.set('tissOverhaul.icsOpen', !form.classList.contains('collapsed')); });
  }

  // ---------------------------------------------------------------
  // run + re-run after AJAX updates
  // ---------------------------------------------------------------
  // keep the TISS session from idling out while any TISS tab is open (one ping per 5 min across tabs)
  const KEEP_KEY = 'tissOverhaul.keepAlive';
  function keepAlive() {
    if (!S.enabled || !S.keepAlive || OFFLINE) return;
    const EVERY = 5 * 60 * 1000;
    const tick = async () => {
      const st = store.get(KEEP_KEY, { last: 0, dead: 0 });
      if (st.dead && Date.now() - st.dead < 60 * 60 * 1000) return; // session was gone – don't hammer the login page
      if (Date.now() - st.last < EVERY - 5000) return;            // another tab pinged recently
      store.set(KEEP_KEY, { last: Date.now(), dead: 0 });
      try {
        const token = String(Math.floor(Math.random() * 999));
        document.cookie = `dsrwid-${token}=${bgWindowId}; expires=${new Date(Date.now() + 3000).toUTCString()}; path=/; SameSite=Strict`;
        const r = await fetch(`${location.origin}/education/favorites.xhtml?dswid=${bgWindowId}&dsrid=${token}`, { credentials: 'same-origin', cache: 'no-store', redirect: 'follow' });
        const gone = new URL(r.url).hostname !== location.hostname || r.status === 401 || r.status === 403;
        if (gone) { store.set(KEEP_KEY, { last: Date.now(), dead: Date.now() }); diag('Keep-alive: Sitzung abgelaufen, bitte neu anmelden'); }
      } catch (e) { /* offline or TISS down – next tick tries again */ }
    };
    // first ping only after the page has been open a while; ticks are throttled by the browser in background tabs, that's fine
    setTimeout(tick, 60 * 1000);
    setInterval(tick, 60 * 1000);
  }
  function run() {
    vault.set('tiss.colors', store.get(COLOR_KEY, {})); vault.set('tiss.settings', S); vault.set('tiss.myGroups', store.get('tissOverhaul.myGroups', {})); vault.set('tiss.rooms', roomsDb());
    settingsButton();
    if (!S.enabled) return;
    lehreToFavorites();
    sidebarExtras();
    if (S.regCountdown && path.includes('/courseRegistration.xhtml')) courseRegistration();
    if (/\/(courseRegistration|examDateList|groupList)\.xhtml/.test(path)) { if (S.regHeaderButton) moveSignupButtons(); autoRegister(); }
    if (path.includes('/favorites.xhtml')) favorites();
    if (/\/(personSchedule|roomSchedule)\.xhtml/.test(path)) { calendar(); mergeExams(); calendarOptions(); compactToggle(); calendarRefreshInside(); }
    if (path.includes('/personSchedule.xhtml')) { nextEventBar(); eventPopup(); examsInCalendar(); icsSection(); }
    if (path.includes('/courseList.xhtml')) courseSearch();
    if (path.includes('/studyCodes.xhtml')) studyCodes();
    if (path.includes('/courseDetails.xhtml')) courseDetails();
  }
  function start() {
    run();
    keepAlive();
    if (!S.enabled) return;
    const content = document.getElementById('contentInner') || document.body;
    let t;
    const ours = n => n.nodeType === 3 ? ours(n.parentNode) : !!(n.nodeType === 1 && (n.className?.toString().startsWith('tiss-') || n.closest?.('[class^="tiss-"], .tiss-fav-toolbar, .tiss-merge-row, .tiss-legend, .tiss-menu')));
    new MutationObserver(muts => {
      const foreign = muts.some(m => !ours(m.target) && [...m.addedNodes, ...m.removedNodes].some(n => !ours(n)));
      if (!foreign) return;
      clearTimeout(t); t = setTimeout(run, 30);
    }).observe(content, { childList: true, subtree: true });
  }
  // ---------------------------------------------------------------
  // Offline calendar (https://www.tuwien.at/tiss-offline) – rendered from the last snapshot, no TISS needed
  // ---------------------------------------------------------------
  function offlinePage() {
    try { window.stop(); } catch (e) {}
    const snap = vault.get('tiss.icsSnapshot', null);
    const colors = vault.get('tiss.colors', {});
    const myGroups = vault.get('tiss.myGroups', {});
    const rooms = vault.get('tiss.rooms', { byName: {}, byCode: {} });
    const col = (nr, type) => colors[nr] || (() => { const pal = /^(UE|LU|PR|AU|RU|ZU|KU|EU|FU|MU|PU|SE|PS|EX|UX)$/.test(type || '') ? WARM : /^(VU|VD|VL|VR|VX|RE|KO|KV)$/.test(type || '') ? MID : COLD; let h = 0; for (const c of nr) h = (h * 31 + c.charCodeAt(0)) >>> 0; return pal[h % pal.length]; })();
    const ev = (snap && snap.ev || []).map(x => { const m = x.t.match(/^(\d{3}\.[A-Z0-9]{3})\s+([A-Z]{2})\s+(.*?)(\s+-\s+(.*))?$/); const grp = m && m[5] ? m[5].replace(/^Gruppe\s+/, '') : ''; return { ...x, nr: m ? m[1] : '', type: m ? m[2] : '', title: m ? m[3] : x.t, grp }; })
      .filter(x => x.s && x.e && !(x.grp && myGroups[x.nr] && myGroups[x.nr].replace(/^Gruppe\s+/, '') !== x.grp))
      .filter((x, i, arr) => arr.findIndex(y => y.t === x.t && y.s === x.s && y.e === x.e) === i);
    // side-by-side columns for overlapping events (same idea as FullCalendar's slot layout)
    const layout = list => { const sorted = list.slice().sort((a, b) => a.s - b.s || b.e - a.e); let cluster = null; const out = [];
      sorted.forEach(x => { if (!cluster || x.s >= cluster.end) { cluster = { end: x.e, cols: [], items: [] }; out.push(cluster); }
        let ci = cluster.cols.findIndex(end => end <= x.s); if (ci < 0) { ci = cluster.cols.length; cluster.cols.push(0); }
        cluster.cols[ci] = x.e; cluster.end = Math.max(cluster.end, x.e); cluster.items.push({ x, ci }); });
      return out.flatMap(c => c.items.map(({ x, ci }) => ({ ...x, src: x, ci, cn: c.cols.length }))); };
    const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    let week = monday(new Date());
    document.documentElement.innerHTML = `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TISS Offline-Kalender</title><style>
      body{margin:0;background:#f4f6f8;color:#1f2933;font:14px/1.4 "Segoe UI",Roboto,Arial,sans-serif}
      .wrap{max-width:1400px;margin:0 auto;padding:18px}
      header{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px}
      header h1{font-size:22px;margin:0;font-weight:600}
      header .stand{color:#6b7280;font-size:13px}
      .btn{padding:8px 16px;border-radius:999px;border:0;background:#eef1f4;font-weight:600;cursor:pointer;font-size:14px}
      .btn.blue{background:#006699;color:#fff}
      .next{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:4px 22px;padding:12px 18px;border-radius:14px;background:#e6f0f6;color:#004d73;margin-bottom:12px}
      .next .k{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;opacity:.75}.next .v{font-size:24px;font-weight:700}.next .room{font-size:17px;font-weight:600}.next .when{font-size:13px;opacity:.8}
      .next a.map{width:46px;height:46px;border-radius:50%;background:#006699;display:inline-flex;align-items:center;justify-content:center;color:#fff}.next a.map svg{width:24px;height:24px}
      .card{background:#fff;border:1px solid #e3e7eb;border-radius:14px;padding:14px 18px}
      .tb{display:flex;align-items:center;gap:8px;margin-bottom:12px}.tb h2{flex:1;text-align:center;margin:0;font-size:20px}
      .grid{display:grid;grid-template-columns:52px repeat(7,1fr);border:1px solid #e3e7eb;border-radius:10px;overflow:hidden}
      .dh{padding:8px 4px;text-align:center;font-weight:600;background:#f8fafc;border-bottom:1px solid #e3e7eb;font-size:13px}.dh.today span{background:#006699;color:#fff;border-radius:999px;padding:3px 10px}
      .col{position:relative;border-left:1px solid #eef1f4;background:repeating-linear-gradient(to bottom,#fff 0,#fff calc(var(--h) - 1px),#eef1f4 calc(var(--h) - 1px),#eef1f4 var(--h))}
      .col.today{background-color:#fffaf0}.axis{position:relative}.axis div{position:absolute;right:6px;font-size:12px;color:#6b7280;transform:translateY(-50%)}
      .ev{position:absolute;left:2px;right:2px;box-sizing:border-box;border-radius:6px;color:#fff;padding:3px 5px;font-size:11px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.15)}.ev b{display:block;font-weight:600}.ev small{opacity:.9}
      .empty{padding:40px;text-align:center;color:#6b7280}
      .ev{cursor:pointer}.ev u{text-decoration:none;font-weight:600;opacity:1}
      .pop{position:absolute;z-index:50;width:330px;max-width:calc(100vw - 16px);background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.2);padding:14px 16px;font-size:14px;box-sizing:border-box}
      .pop .ph{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}.pop .ph i{width:14px;height:14px;border-radius:50%;flex:none;margin-top:4px}.pop .ph b{font-size:16px}.pop .mu{color:#6b7280;font-size:13px}
      .pop .ph a.map{margin-left:auto;width:40px;height:40px;border-radius:50%;background:#006699;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}.pop .ph a.map svg{width:22px;height:22px}
      .pop .pr{display:grid;grid-template-columns:52px 1fr;gap:8px;padding:4px 0}.pop .pr>span:first-child{color:#6b7280}.pop a{color:#006699;font-weight:600;text-decoration:none}
      .pop .pl{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.pop .pl a{padding:7px 14px;border-radius:999px;background:#eef1f4;color:#1f2933}.pop .pl a.b{background:#006699;color:#fff}
    </style></head><body><div class="wrap">
      <header><h1>TISS Offline-Kalender</h1><span class="stand">${snap ? 'Stand: ' + new Date(snap.t).toLocaleString('de-AT') : 'Noch kein Snapshot – einmal den TISS-Kalender öffnen.'}</span><a class="btn" href="https://tiss.tuwien.ac.at/events/personSchedule.xhtml" style="margin-left:auto;text-decoration:none;color:#1f2933">Zu TISS</a></header>
      <div id="next"></div><div class="card"><div class="tb"><button class="btn" id="prev">‹</button><button class="btn" id="next-w">›</button><button class="btn" id="today">Heute</button><h2 id="title"></h2></div><div id="grid" class="grid"></div></div></div></body>`;
    const fmtMin = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? `${m} Min` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} Min` : `${Math.floor(m / 1440)} Tag${m >= 2880 ? 'en' : ''}`; };
    const roomCode = loc => rooms.byName[loc] || '';
    const mapsUrl = loc => { const c = roomCode(loc); if (c && rooms.byCode[c] && rooms.byCode[c].maps) return rooms.byCode[c].maps; const code = (loc.match(/\b[A-Z]{2}\d{2}[A-Z]\d{2,3}\b/) || [])[0]; return `https://maps.tuwien.ac.at/?q=${encodeURIComponent(code || loc)}#map`; };
    const renderNext = () => {
      const now = Date.now(); const live = ev.filter(x => x.s <= now && x.e > now).sort((a, b) => a.e - b.e)[0]; const nx = ev.filter(x => x.s > now).sort((a, b) => a.s - b.s)[0]; const x = live || nx;
      const el = document.getElementById('next'); if (!x) { el.innerHTML = ''; return; }
      const day = new Date(x.s).toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' ' + new Date(x.s).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `<div class="next" style="${live ? 'background:#fff4e5;color:#9a4d07' : ''}"><div><div class="k">${live ? 'Läuft · endet in' : 'Nächster Termin in'}</div><div class="v">${fmtMin((live ? x.e : x.s) - now)}</div></div><div><div class="room">${x.loc || x.title}</div><div class="when">${x.title} · ${day}</div></div>${x.loc ? `<a class="map" href="${mapsUrl(x.loc)}" target="_blank">${ICON_MAP}</a>` : '<span></span>'}</div>`;
    };
    const render = () => {
      const H = 44, start = 7, end = 20, days = [...Array(7)].map((_, i) => { const d = new Date(week); d.setDate(d.getDate() + i); return d; });
      const inWeek = ev.filter(x => x.s >= week.getTime() && x.s < week.getTime() + 7 * 864e5);
      const endH = Math.max(end, ...inWeek.map(x => new Date(x.e).getHours() + (new Date(x.e).getMinutes() ? 1 : 0)));
      const todayStr = new Date().toDateString();
      document.getElementById('title').textContent = `${days[0].toLocaleDateString('de-AT', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      let html = `<div class="dh">KW ${(() => { const d = new Date(week); d.setDate(d.getDate() + 3); const y = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - y) / 864e5 - 3 + ((y.getDay() + 6) % 7)) / 7); })()}</div>` + days.map(d => `<div class="dh${d.toDateString() === todayStr ? ' today' : ''}"><span>${d.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span></div>`).join('');
      html += `<div class="axis" style="height:${(endH - start) * H}px">${[...Array(endH - start)].map((_, i) => `<div style="top:${i * H}px">${String(start + i).padStart(2, '0')}:00</div>`).join('')}</div>`;
      days.forEach(d => {
        const dayEv = layout(inWeek.filter(x => new Date(x.s).toDateString() === d.toDateString()));
        html += `<div class="col${d.toDateString() === todayStr ? ' today' : ''}" style="--h:${H}px;height:${(endH - start) * H}px">` + dayEv.map(x => { const sh = new Date(x.s).getHours() + new Date(x.s).getMinutes() / 60, eh = new Date(x.e).getHours() + new Date(x.e).getMinutes() / 60; return `<div class="ev" style="top:${(sh - start) * H}px;height:${Math.max(18, (eh - sh) * H - 2)}px;left:calc(${x.ci * 100 / x.cn}% + 2px);width:calc(${100 / x.cn}% - 4px);background:${col(x.nr, x.type)}" data-i="${ev.indexOf(x.src)}"><small>${new Date(x.s).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}–${new Date(x.e).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}${x.loc ? ' · <u>' + x.loc + '</u>' : ''}</small><b>${x.nr} ${x.type} ${x.title}</b></div>`; }).join('') + '</div>';
      });
      document.getElementById('grid').innerHTML = ev.length ? html : '<div class="empty">Kein Snapshot vorhanden. Öffne einmal den Kalender in TISS – danach steht er hier auch offline zur Verfügung.</div>';
    };
    const showPop = (x, anchor) => {
      document.querySelector('.pop')?.remove();
      const day = new Date(x.s).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit' });
      const t = `${new Date(x.s).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })} – ${new Date(x.e).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`;
      const code = x.loc ? roomCode(x.loc) : ''; const addr = code && rooms.byCode[code] ? rooms.byCode[code].addr : '';
      const sem = new Date(x.s).getMonth() >= 9 ? new Date(x.s).getFullYear() + 'W' : new Date(x.s).getMonth() <= 1 ? (new Date(x.s).getFullYear() - 1) + 'W' : new Date(x.s).getFullYear() + 'S';
      const pop = document.createElement('div'); pop.className = 'pop';
      pop.innerHTML = `<div class="ph"><i style="background:${col(x.nr, x.type)}"></i><div><b>${x.title}</b><div class="mu">${x.nr} · ${x.type}${x.grp ? ' · ' + x.grp : ''}</div></div>${x.loc ? `<a class="map" href="${mapsUrl(x.loc)}" target="_blank" rel="noopener">${ICON_MAP}</a>` : ''}</div>
        <div class="pr"><span>Zeit</span><span>${day} ${t}</span></div>
        <div class="pr"><span>Raum</span><span>${x.loc ? (code ? `<a href="https://tiss.tuwien.ac.at/events/roomSchedule.xhtml?roomCode=${encodeURIComponent(code)}" target="_blank">${x.loc}</a>` : x.loc) : '–'}${addr ? `<br><small class="mu">${addr}</small>` : ''}</span></div>
        ${x.desc ? `<div class="pr"><span>Info</span><span>${x.desc.slice(0, 160)}</span></div>` : ''}
        <div class="pl">${x.nr ? `<a class="b" href="https://tiss.tuwien.ac.at/course/educationDetails.xhtml?courseNr=${x.nr.replace('.', '')}&semester=${sem}" target="_blank">LVA-Seite</a><a href="https://tuwel.tuwien.ac.at/course/search.php?q=${encodeURIComponent(x.nr)}" target="_blank">TUWEL ↗</a>` : ''}</div>`;
      document.body.appendChild(pop);
      const r = anchor.getBoundingClientRect();
      pop.style.top = (r.top + window.scrollY) + 'px'; pop.style.left = Math.max(8, Math.min(r.right + window.scrollX + 8, document.documentElement.clientWidth - 340)) + 'px';
      const close = e => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', close, true); } };
      setTimeout(() => document.addEventListener('click', close, true), 0);
    };
    document.getElementById('grid').addEventListener('click', e => { const el = e.target.closest('.ev'); if (!el) return; const x = ev[+el.dataset.i]; if (x) showPop(x, el); });
    document.getElementById('prev').onclick = () => { week.setDate(week.getDate() - 7); render(); };
    document.getElementById('next-w').onclick = () => { week.setDate(week.getDate() + 7); render(); };
    document.getElementById('today').onclick = () => { week = monday(new Date()); render(); };
    render(); renderNext(); setInterval(renderNext, 30000);
  }

  if (OFFLINE) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', offlinePage); else offlinePage(); return; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
