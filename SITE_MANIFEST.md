# LEGION Website — Site Manifest & Architecture Documentation

> **Version**: 1.3.0  
> **Projekt**: LEGION (machine LEarninG-enabled Identification of archaeological Objects in the middle daNube river basin)  
> **Repository**: [legion-hsa-2-0.github.io](https://github.com/LEGION-HSA-2-0/legion-hsa-2-0.github.io)  
> **Zweck dieser Dokumentation**: Vollständiges Manifest zur Gestaltung, dem technischen Aufbau, den visuellen Tokens, den interaktiven Funktionen, den Systemgrenzen und einer schrittweisen Bauanleitung zur exakten Reproduktion der Website (z. B. in Kimi, ChatGPT oder Claude).

---

## 1. Übersicht & Systemarchitektur

Die LEGION-Website ist eine **moderne, hochperformante statische Webanwendung**, die ohne Build-Tools (wie Webpack, Vite oder React) auskommt. Sie setzt auf native Webstandards und CDN-eingebundene Libraries.

### Tech Stack
* **HTML5**: Semantisches Markup, Schema.org Structured Data (`ResearchProject`), Open Graph / Twitter Card Meta-Tags.
* **Vanilla CSS3**: Eigenes Design-System mit CSS Custom Properties (Variables), Flexbox, CSS Grid, Glassmorphic Layering, CSS-Masking (`mask-image`).
* **Vanilla JavaScript (ES6+)**: Keine Frameworks. Leichtgewichtiges Skript (`main.js`) für Animationen, Scroll-Sync, 3D-Kamerasteuerung und Scroll-Spy.
* **Google `<model-viewer>` (v3.x)**: Web Component für interaktives 3D-Rendering von GLB-Modellen inklusive AR-Unterstützung und Beleuchtungsanpassungen via CDN.
* **Leaflet JS (v1.9.4)**: Für die interaktive GIS-Karte (`carnuntum-map.html`).
* **Google Fonts**: *Zilla Slab* (Serif für Headlines) & *Inter* (Sans-Serif für Fließtext).
* **Hosting**: GitHub Pages (Static Site Hosting).

### Ordner- & Dateistruktur
```
legion-hsa-2-0.github.io/
├── index.html                  # Hauptseite (Landing Page, News, Team, 3D-Viewer, Partner)
├── carnuntum-map.html          # Interaktive GIS-Karte (Draft / Auslagerung)
├── legal.html                  # Impressum & Datenschutz (Legal Notice)
├── style.css                   # Zentrales Stylesheet (Design System, Layout, Komponenten)
├── main.js                     # Hauptinteraktionsskript (3D-Lerp, Scroll-Spy, Progress-Bar)
├── robots.txt & sitemap.xml    # SEO & Indexierungs-Vorgaben
├── README.md                   # Repository-Überblick
├── SITE_MANIFEST.md            # Diese Architektur- & Design-Dokumentation
└── assets/                     # Medien & 3D-Modelle
    ├── logo.webp               # LEGION Branding Logo
    ├── jug1k.glb               # 3D-Modell Krug (Hero Section)
    ├── folded_beaker1k.glb     # 3D-Modell Faltenbecher (Challenge Section)
    ├── incense_bowl1k.glb      # 3D-Modell Räucherschale (Challenge Section)
    ├── pot1k.glb               # 3D-Modell Topf (Challenge Section)
    ├── hero-jug.webp           # 3D-Poster Fallback Image
    └── news_*.webp             # News- & Methodik-Bilder
```

---

## 2. Design System & Visuelle Tokens

Das visuelle Erscheinungsbild ist ein **futuristischer Dark Mode mit archäologischem Bezug** (Terracotta-Töne kombiniert mit modernem Cyan & Navy).

### CSS Custom Properties (`style.css`)
```css
:root {
    /* Marken-Farbpalette */
    --bg-dark: #0a0a0a;             /* Haupt-Hintergrund */
    --navy: #1A2B3C;                /* Dunkler Kontrast / Karten-Details */
    --terracotta: #D46A43;          /* Primäre Akzentfarbe (vom Keramik-Logo) */
    --cyan: #00B5CC;                /* Sekundäre Akzentfarbe (Tech / AI-Aspekt) */
    --brand-bridge: #6A8F87;        /* Überbrückungsfarbe (Brücke zwischen Erdtönen & Tech) */
    
    /* Verläufe & Glow-Effekte */
    --brand-gradient: linear-gradient(135deg, var(--terracotta) 0%, var(--cyan) 100%);
    --brand-glow: rgba(212, 106, 67, 0.4);
    --terracotta-glow: rgba(212, 106, 67, 0.5);
    --brand-bridge-glow: rgba(106, 143, 135, 0.5);
    --cyan-glow: rgba(0, 181, 204, 0.5);
    
    /* Text & Oberflächen */
    --text-main: #f0f0f0;           /* Primärer Hellgrau-Text */
    --text-dim: #a0a0a0;            /* Gedämpfter Sekundärtext */
    --card-bg: rgba(255, 255, 255, 0.03); /* Glassmorphism Kartenhintergrund */
    
    /* Animationen */
    --transition-smooth: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Typografie
* **Überschriften (`h1`, `h2`, `h3`, `h4`)**: `'Zilla Slab', serif; font-weight: 600/700;`
  * Verleiht der Seite einen wissenschaftlich-eleganten Buchdruck- & Epigraphik-Charakter.
* **Fließtext & UI-Elemente**: `'Inter', sans-serif; font-weight: 300/400/500/600;`
  * Maximale Lesbarkeit für Daten, Listen und Navigation.

### Visuelle Stilmittel & Effekte
* **Glassmorphism**: Karten nutzen `background: var(--card-bg)`, dezente Ränder (`border: 1px solid rgba(255, 255, 255, 0.05)`) und teils `backdrop-filter: blur()`.
* **Farbcodierte Unterränder**: News- und Challenge-Karten besitzen Akzent-Bordüren an der Unterseite (`border-bottom: 4px solid var(--terracotta)` etc.).
* **Hintergrund-Blobs**: Weiche, animierte Farbverläufe im Hintergrund (`.gradient-blob`), die Tiefe erzeugen.

---

## 3. Seiten- & Komponenten-Breakdown

Die Hauptseite (`index.html`) gliedert sich in folgende logische Abschnitte:

### A. Navigation (`<nav>` & `.side-nav`)
* **Top Navigation (`#navbar`)**:
  * Fixiert am oberen Bildschirmrand.
  * Wechselt beim Scrollen (>50px) dynamisch den Hintergrund zu einem abgedunkelten Glasseffekt (`.scrolled`).
  * Hamburger-Button (`.mobile-menu-btn`) öffnet mobiles Fullscreen-Menü (`.mobile-nav`).
* **Side-Dot Navigation (`.side-nav`)**:
  * Vertikal zentrierte Punktnavigation am rechten Bildschirmrand.
  * Zeigt bei Hover den Namen des Abschnitts als Tooltip an (`data-label`).
  * Werden via Scroll-Spy automatisch als `.active` markiert.

### B. Hero Section (`#hero`)
* **Links**: Titel ("LEGION"), Untertitel, Kurzbeschreibung & CTA-Button ("EXPLORE PROJECT").
* **Rechts**: Interaktiver 3D Model Viewer (`<model-viewer src="assets/jug1k.glb">`).
  * **Ladeanzeige**: Eigener Ladebalken (`.model-loader-container`), der den Asynchron-Ladefortschritt in % anzeigt.
  * **Scroll-Sync**: Dreht sich sanft bei Scrollen der Seite.
* **Unten**: Animierter Scroll-Indikator (Maus-Symbol).

### C. News Section (`#news`)
* Raster-Grid (`.grid`) aus News-Karten.
* Jede Karte enthält:
  * 16:9 Vorschaubild mit Hover-Tooltip für Bildrechte (`.photocredit-tooltip`).
  * Datum / Tag, Überschrift, verlinkten Text und Buttons.
  * **Scrollbarer Textbereich (`.news-text-scrollable`)**: Besitzt eine dynamische CSS-Maske (`mask-image`), die den Text oben/unten weich ausblendet, wenn Inhalt übersteht.

### D. Challenge / About Section (`#about`)
* Vorstellen des archäologischen Problems (Data Overload & Manual Bottleneck).
* 3 Karten mit integrierten 3D Model Viewern (`folded_beaker1k.glb`, `incense_bowl1k.glb`, `pot1k.glb`), jeweils mit eigener Markenfarbe akzentuiert.

### E. Methodology & Impact Sections (`#methodology`, `#impact`)
* Visualisierung der Semi-supervised Computer Vision Pipeline, Human-in-the-Loop (HITL), Open Source Tools & typochronologischen Auswertungen.

### F. Open Science & Code Section (`#opensource`)
* Prominenter **GitHub Organization Banner** mit Direktlinks zur Organisation [`LEGION-HSA-2-0`](https://github.com/LEGION-HSA-2-0), Badges und Einladung zur wissenschaftlichen Open-Source-Zusammenarbeit.

### G. Team Section (`#contact`)
* Zwei institutionelle Spalten:
  1. **OeAI Team** (Austrian Archaeological Institute / OeAW)
  2. **CVL Team** (Computer Vision Lab / TU Wien)
* Enthält Einzelprofile mit SVG-Icons für **ORCID** und **LinkedIn**.

### H. Partners Section (`#partners`)
* Auto-fit Grid mit 7 Partner-Logos (OeAI, CVL, ACDH-CH, LSNÖ, Carnuntum, Wien Museum, UWK).

### I. Footer (`<footer>`)
* **Funding Card**: Angaben zum Förderprogramm *Heritage Science Austria 2.0* (OeAW, Grant `Heritage_2024-12_LEGION`, 2026–2028).
* **Sketchfab 3D Asset Credit**: Attribution für bereitgestellte 3D-Scans (LSNÖ, CC BY-NC).
* **Lizenz-Shields**: CC BY 4.0 (Inhalte) & MIT License (Code).
* **Antigravity Badge**: "Vibecoded using Google Antigravity (Gemini 3.7 Flash)".

---

## 4. Interaktive Fähigkeiten & JS-Logik (`main.js`)

| Funktion | Mechanismus | Beschreibung |
| :--- | :--- | :--- |
| **3D Scroll Camera Orbit** | `requestAnimationFrame` + LERP (`0.05`) | Synchronisiert die Drehung des Hero-3D-Modells (`cameraOrbit`) mit der Scroll-Position. Pausiert 3s lang, wenn der Nutzer das Modell manuell dreht. |
| **3D Model Loader** | `viewer.addEventListener('progress')` | Berechnet den Ladefortschritt und aktualisiert die `.model-loader-fill`-Breite sowie Prozentanzeige, bevor das Modell eingeblendet wird. |
| **Scroll Reveal** | `revealOnScroll()` | Überprüft `getBoundingClientRect().top` und fügt `.active` zu `.reveal`-Elementen hinzu, wenn sie ins Sichtfeld rollen. |
| **Scroll Spy** | `scrollSpy()` | Berechnet die aktiven Sektionen und setzt die Klasse `.active` auf die Header-Links und Side-Dots. |
| **News Scroll Fade Masking** | `updateNewsScrollFades()` | Prüft `scrollTop` und `clientHeight` von `.news-text-scrollable`. Erzeugt dynamische `linear-gradient` Transparenzen oben/unten. |
| **Mobile Drawer Toggle** | Event-Listener auf `.mobile-menu-btn` | Schaltet die Klasse `.active` der mobilen Navigation um und wechselt das Icon zwischen ☰ und ✕. |

---

## 5. Grenzen & Einschränkungen (What it CAN & CANNOT do)

### Was die Website KANN:
✅ Interaktive 3D-Modelle ohne Plugins im Browser darstellen (WebGL).  
✅ Vollständig responsiv auf Smartphones, Tablets und Widescreen-Monitoren agieren.  
✅ Äußerst schnelle Ladezeiten erzielen (da kein JavaScript-Framework gebündelt werden muss).  
✅ SEO-Ergebnisse maximieren durch strukturierte JSON-LD Schema.org Metadaten.  
✅ Über GitHub Pages kostenfrei und wartungsarm gehostet werden.

### Was die Website NICHT KANN (Grenzen):
❌ **Kein CMS / Backend**: Inhalte (z. B. neue News-Beiträge) können nicht über eine Admin-Oberfläche eingepflegt werden, sondern erfordern direkte Änderungen im HTML-Code.  
❌ **Keine serverseitige Dynamik**: Es gibt kein Kontaktformular-Backend, keine Datenbankabfragen und kein dynamisches Filtern von Fundobjekten.  
❌ **WebGL-Abhängigkeit**: Auf sehr alten Mobilgeräten ohne WebGL-Unterstützung rendert `<model-viewer>` nicht interaktiv, sondern zeigt das definierte `poster`-Bild an.

---

## 6. Bauanleitung zur exakten Reproduktion (Prompt Blueprint für Kimi / LLMs)

Um diese Website in einem KI-Generator wie Kimi, ChatGPT oder Claude 1:1 nachzubauen, kann folgender Prompt genutzt werden:

```text
Erstelle eine einseitige Landingpage für ein wissenschaftliches KI-Archäologie-Projekt ("LEGION") mit folgendem Tech-Stack und Design-System:

1. TECH STACK:
- HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+).
- Einbindung von Google <model-viewer> (CDN: https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js) für 3D GLB-Modelle.
- Google Fonts: 'Zilla Slab' (Headlines) und 'Inter' (Fließtext).

2. DESIGN SYSTEM (CSS Variables):
- Dark Mode Background: #0a0a0a
- Terracotta (Akzent 1): #D46A43
- Cyan (Akzent 2): #00B5CC
- Brand Bridge (Akzent 3): #6A8F87
- Cards: Glassmorphism (background: rgba(255,255,255,0.03), border: 1px solid rgba(255,255,255,0.05))
- Card Bottom Borders: 4px solid Akzentfarben.

3. SEITENSTRUKTUR:
- Fixed Nav mit Logo, Ankerlinks und Hamburger-Menü für Mobile.
- Hero Section: Titel, Untertitel, CTA-Button und 3D <model-viewer> mit Prozent-Ladebalken.
- News Grid: Cards mit 16:9 Bild, Fotocredit-Tooltip und scrollbarem Textbereich mit mask-image Fade.
- Challenge Section: 3-Grid mit je einem interaktiven <model-viewer>.
- Team Section: Zuweisung OeAI vs CVL mit ORCID & LinkedIn SVG Links.
- Partners Section: Auto-fit Grid für Partner-Logos.
- Footer: Funding Details (Heritage Science Austria 2.0), 3D-Credits, CC BY 4.0 & MIT Shields, Side-Dot Navigation rechts.

4. JAVASCRIPT LOGIK:
- Smooth LERP Scroll-Sync für die Drehung des Hero-3D-Modells.
- Progress-Listener für den 3D-Ladebalken.
- Scroll-Spy für Navigations-Links & Side-Dots.
- Dynamische updateNewsScrollFades() für vertikale Masken-Fades in Text-Cards.
```

---
*Ende des Manifests — Erstellt für das LEGION-Projekt (Heritage Science Austria 2.0).*
