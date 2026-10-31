# TextTranslator Chrome Extension

**Status:** Release-preparation branch, version 0.7.5. This is still a test build, not a published store release.

This extension can show the meaning of a word when you hover over it or select text on a webpage. The selected online/offline mode and language pair are also used for page lookups.

## Features

- Separate source and target language selectors for 12 languages.
- Pair-specific local dictionaries, including English ↔ Persian.
- Online and offline lookup modes.
- Hover and text-selection triggers can be enabled independently.
- Adjustable tooltip duration.
- Add personal words and manage dictionaries through JSON import, quality check, and export.
- Optional developer-support link in the popup; the extension remains free and has no ads.
- Compact, expandable usage guide in the popup.
- No analytics or tracking code.

## Install locally

1. Download the repository ZIP and extract it.
2. In Chrome, open chrome://extensions.
3. Turn on Developer mode and choose Load unpacked.
4. Select the src/extension folder (the folder containing manifest.json).
5. If already installed, press Reload on the extension card and refresh open webpages.
6. Choose the source and target languages, then click «اعمال زبان‌ها».
7. Select online or offline mode and search a word, or hover over a single word or select it on a webpage.

## Privacy and permissions

Read the bilingual [Privacy Policy](../../PRIVACY.md). The extension stores preferences, personal dictionary entries, downloaded updates, and translation cache locally. Online lookup sends only the submitted word or selected phrase and language pair to the configured provider.

Manifest permissions are intentionally limited to the storage permission plus the host access required for translation providers, dictionary updates, and user-configured custom endpoints. The content script runs on webpages because hover and text-selection translation are core features. This broad page access must be clearly disclosed in the store listing and privacy policy.

## Store preparation assets

- Extension icons: icons/icon-16.png, icon-32.png, icon-48.png, and icon-128.png.
- Promotional artwork source: ../../assets/store-promo.svg.
- Bilingual store listing draft: ../../STORE_LISTING.md.
- Optional support information: ../../DONATE.md.

The SVG is editable promotional artwork, not a screenshot of the running extension. Before submitting to a store, capture genuine screenshots from the tested browser build and export any required promotional artwork to the store's accepted raster format.

## Online service limitations

The default endpoint uses a public, unofficial Google Translate interface. It is not a documented, guaranteed Google Cloud Translation API and may change or stop working. If the primary provider is rate-limited or unavailable, the extension may try MyMemory as a secondary provider. External services have their own terms and privacy practices.

## Release checklist

- [ ] Test the popup after loading the unpacked extension in Chrome 109.
- [ ] Test hover and selection translation on ordinary HTTPS webpages.
- [ ] Test offline lookup with both English → Persian and Persian → English dictionaries.
- [ ] Test online lookup, HTTP 429 fallback, and the no-internet case.
- [ ] Test adding, importing, validating, exporting, and restoring dictionaries.
- [ ] Confirm the support and privacy links open correctly.
- [ ] Confirm every icon path in manifest.json exists and displays.
- [ ] Review host permissions and store privacy declarations against the final build.
- [ ] Capture actual product screenshots and prepare store artwork in the required dimensions.
- [ ] Update the dictionary update manifest URL from the test branch to the stable branch before a public release.
- [ ] Create and test the final ZIP from the src/extension folder only.

