# TextTranslator — Firefox Add-on

**Firefox-only package · Version 0.7.5 · Test build**

This branch is dedicated to the Firefox extension. Its repository root is the extension package root: `manifest.json` is located directly beside `background.js`, `content.js`, `popup.html`, and the resource folders. Create the upload ZIP from the contents of this branch's root; do not ZIP the containing repository folder.

## Compatibility

- Manifest V3.
- Firefox 128.0 or later (declared in `browser_specific_settings.gecko.strict_min_version`).
- Uses the Firefox-compatible Manifest V3 background script declaration (`background.scripts`), not Chromium's `background.service_worker`.
- The extension code uses the `chrome.*` compatibility namespace supported by Firefox WebExtensions.

## Features

- Hover and text-selection translation.
- Online and offline modes.
- Separate language-pair dictionaries, including English ↔ Persian.
- Local personal dictionary entries, import, export, and update support.
- Adjustable hover tooltip duration.

## Build / upload to Mozilla Add-ons

1. Download this branch as a ZIP, or clone the branch.
2. If downloaded from GitHub, extract it first.
3. Select all files and folders *inside this branch root* and ZIP those items together.
4. Confirm that opening the ZIP shows `manifest.json` immediately at the top level (not inside another directory).
5. Upload that ZIP to Mozilla Add-ons for validation.

The ZIP should contain entries such as:
```
manifest.json
background.js
content.js
popup.html
popup.js
styles.css
dictionaries/
icons/
```

## Permissions and privacy

The extension needs storage for settings and local dictionaries. It runs a content script on webpages so hover and selection translation can work. Online translation and dictionary updates contact the configured external services. Only the submitted word or selected phrase and language pair are sent for online translation. Review the project's privacy policy before publishing.

## Important testing note

This is a Firefox-specific packaging branch, not a claim that the add-on has already passed Mozilla validation or has been tested in every Firefox version. Test installation, hover, selection, online lookup, offline lookup, dictionary import/export, and update behavior in Firefox before submitting a public release.
