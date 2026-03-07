# DataSnap Pro

**Enterprise Web Scraper Chrome Extension** — extract structured data from any webpage with a single click, powered by intelligent auto-detection and a React-based popup UI.

---

## Features

- **Auto-detection** — automatically identifies tables, product listings, articles, pricing grids, and lists on any page
- **Custom selectors** — define CSS selectors to pinpoint exactly the elements you want
- **Visual element selector** — click elements on the page to build selectors interactively
- **Multiple export formats** — download scraped data as CSV, JSON, or Excel
- **Session management** — save and restore scraping sessions across browser restarts
- **Pagination support** — detects and follows paginated content
- **Dynamic content handling** — observes DOM mutations to capture data loaded after the initial page render
- **Rate limiting** — built-in throttle to avoid hammering target servers
- **Dark/light theme** — theme-aware popup UI

---

## Installation

### Load the unpacked extension (development)

1. Run `npm install` then `npm run build` (see [Build Instructions](#build-instructions))
2. Open **Chrome** → `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `dist/` folder
5. The DataSnap Pro icon appears in your toolbar

### Production
A packed `.crx` file can be created from the `dist/` folder via the Chrome Extensions page.

---

## Development Setup

**Requirements:** Node.js ≥ 18, npm ≥ 9

```bash
# Clone and install
git clone <repo-url>
cd webScrap
npm install

# Generate placeholder icons (required before first build)
node scripts/icons.js

# Start webpack in watch mode (rebuilds on file save)
npm run dev
```

---

## Build Instructions

```bash
# One-off production / development build
npm run build
```

Output lands in `dist/`. The build bundles three entry points:

| Entry point | Output |
|---|---|
| `src/background/app.js` | `dist/background/app.js` |
| `src/content/index.js` | `dist/content/index.js` |
| `src/popup/index.jsx` | `dist/popup/index.js` + `dist/popup/index.html` |

Icons and `manifest.json` are copied from `public/` and the repo root respectively.

---

## Project Structure

```
webScrap/
├── manifest.json            # Chrome Extension Manifest V3
├── webpack.config.js        # Webpack build configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── scripts/
│   └── icons.js             # Icon generation script
├── public/
│   └── icons/               # Generated PNG icons (16, 48, 128 px)
├── src/
│   ├── background/          # Service worker (MV3)
│   │   ├── app.js           # Entry point; message router
│   │   ├── controllers/     # scraperController, exportController, sessionController, settingsController
│   │   ├── services/        # extractionService, exportService, storageService, validationService
│   │   ├── middleware/       # errorHandler, validator, logger, rateLimiter
│   │   ├── models/          # Session, ExtractionJob, Selector, ScrapedData
│   │   └── utils/           # messageFormatter, chromeApiWrapper, idGenerator
│   ├── content/             # Content script (injected into every page)
│   │   ├── index.js         # Entry point; message listener
│   │   ├── extractors/      # tableExtractor, productExtractor, articleExtractor, listExtractor, pricingExtractor, customExtractor
│   │   ├── selectors/       # visualSelector, highlighter, selectorGenerator, similarityDetector
│   │   ├── detectors/       # patternDetector, paginationDetector, selectorDetector, dynamicContentDetector
│   │   ├── handlers/        # scrollHandler, clickHandler, formHandler, domObserver
│   │   └── utils/           # domUtils, selectorUtils, waitUtils
│   ├── popup/               # React popup UI
│   │   ├── index.jsx        # React entry point
│   │   ├── index.html       # HTML template
│   │   ├── pages/           # _app.jsx (providers), index.jsx (main page)
│   │   ├── components/
│   │   │   ├── common/      # Button, Input, Modal, Toast, Spinner
│   │   │   ├── layout/      # Header, Footer, Sidebar
│   │   │   ├── scraper/     # ScraperControls, SelectorPanel, ProgressIndicator, StatusBadge
│   │   │   ├── data/        # DataPreview, DataGrid, DataTable, DataStats
│   │   │   └── export/      # ExportButtons, ExportOptions, FormatSelector
│   │   ├── context/         # ScraperContext, ThemeContext, SettingsContext
│   │   ├── hooks/           # useScraper, useExport, useStorage, useChromeApi, useMessageListener
│   │   ├── services/        # apiService, storageService, formattingService
│   │   ├── utils/           # formatters, validators, constants
│   │   └── styles/          # globals.css (Tailwind base)
│   └── shared/              # Code shared across all three entry points
│       ├── constants/       # config.js, messages.js, errors.js
│       └── utils/           # validation.js, encryption.js, logging.js
└── dist/                    # Build output (git-ignored)
    ├── manifest.json
    ├── icons/
    ├── background/app.js
    ├── content/index.js
    └── popup/
        ├── index.html
        └── index.js
```

---

## How to Use the Extension

1. Navigate to any webpage you want to scrape
2. Click the **DataSnap Pro** toolbar icon to open the popup
3. Choose an extraction mode:
   - **Auto** — let the extension detect data patterns automatically
   - **Custom** — add CSS selectors in the Selector Panel to target specific elements
   - **Visual** — click the crosshair button, then click elements on the page to build selectors
4. Click **Start Scraping** — the progress indicator shows live status
5. Review extracted data in the **Data Preview** tab
6. Select an export format (CSV / JSON / Excel) and click **Export**

---

## Architecture Overview

### Background Service Worker (`src/background/`)
Runs as a Manifest V3 service worker. Receives all messages from the popup and content script via `chrome.runtime.onMessage`. Routes them through middleware (rate limiter → validator → logger → error handler) to the appropriate controller, which delegates to a service layer for storage and export operations.

### Content Scripts (`src/content/`)
Injected at `document_idle` on every page. Listens for extraction commands from the background worker. The **extractors** parse DOM structures into normalised row/column data. The **visual selector** overlays a highlight UI so users can interactively pick elements. The **DOM observer** watches for dynamically loaded content.

### Popup UI (`src/popup/`)
A React 18 single-page application bundled by Webpack. State is managed through three React contexts: `ScraperContext` (extraction state and results), `ThemeContext` (dark/light preference), and `SettingsContext` (user preferences). Custom hooks wrap `chrome.*` APIs so components stay testable without a real browser environment.

---

## Scripts

| Command | Description |
|---|---|
| `npm install` | Install all dependencies |
| `node scripts/icons.js` | Generate PNG icons in `public/icons/` |
| `npm run build` | One-off Webpack build to `dist/` |
| `npm run dev` | Webpack watch mode (rebuilds on save) |
| `npm run lint` | ESLint the `src/` directory |
| `npm test` | Run Jest test suite |
