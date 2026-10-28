# TextTranslator Chrome Extension

**Status:** Local prototype, version 0.7.4. Changes are limited to the test branch; this is not a published Chrome Web Store release.

این افزونه می‌تواند هنگام بردن ماوس روی یک واژه یا انتخاب آن در صفحه، معنی آن را در یک کارت کوچک نشان دهد. حالت آنلاین/آفلاین و جفت‌زبان انتخاب‌شده در پنجرهٔ افزونه برای کلمات هایلایت‌شده نیز اعمال می‌شود.

## Features

- Separate source and target language selectors: English, German, French, Spanish, Italian, Greek, Turkish, Arabic, Russian, Japanese, Simplified Chinese, and Persian.
- Separate local saved dictionary for each language pair (for example, \`en-fa\` and \`de-fa\`).
- Import one or multiple JSON dictionary files in one action. The language pair is inferred from file metadata or a pair-tagged filename (for example `en-fa.json`); existing matching entries are updated with the imported meaning.
- Export supports one selected pair or all pairs together as a ZIP archive containing one JSON file per pair. Quality checks run against the selected JSON file(s), and manual remote updates check every pair available in the remote manifest.
- Dictionary quality check validates JSON structure, pair metadata, duplicate keys in imported JSON, non-empty text values, and basic key/value length rules.
- Incremental dictionary updates are fetched from a versioned public repository manifest. The first small reviewed update batch currently supports English ↔ Persian; downloaded entries are stored separately and personal entries retain priority.
- Starter offline dictionaries are included for Persian ↔ English, German, French, Spanish, Italian, Greek, Turkish, Arabic, Russian, Japanese, and Simplified Chinese. Each language pair has its own JSON file under `dictionaries/` (for example `en-fa.json`, `fa-en.json`, `el-fa.json`, and `fa-el.json`); user-added entries override starter meanings in Chrome local storage.
- One online/offline toggle shared by popup lookup and highlighted-word lookup.
- A dictionary management panel provides multi-file import, pair-selected JSON export and all-dictionaries ZIP backup, selected-file quality checks, and a manual button to check all available incremental updates.
- When the default Google endpoint returns HTTP 429 or another network error, the extension tries MyMemory as a secondary online translation service before using the offline dictionary. MyMemory has its own usage limits and may not always be available.
- The default online endpoint is \`https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={word}\`.
- This endpoint is a public, unofficial Google Translate interface; it is not a documented, guaranteed Google Cloud Translation API and may change or stop working.
- The official Google Cloud Translation API requires Google Cloud configuration/authentication and may incur charges.
- In online mode, a successful meaning from the online provider (including the seven-day online-result cache) is automatically saved to the matching personal offline dictionary only if the word is not already present in the bundled starter dictionary, downloaded updates, or personal entries. A brief green confirmation appears only when a new entry is saved. Existing offline entries are never overwritten by this automatic save. Offline mode checks only the selected pair and does not request an online meaning when the word is absent. The **＋** button remains available for manual saving when needed. Successful online results are cached locally for seven days; when the service returns HTTP 429, repeated calls are paused for one minute and MyMemory is tried as a secondary online source. If both online sources fail, an error is shown instead of substituting an offline meaning. The popup does not list dictionary contents. Tooltip duration can be set manually from 1 to 60 seconds (default 2 seconds). Hovering the same word again after the tooltip closes should trigger another lookup.
- No build step or third-party package is required. Uses Manifest V3.

## Install locally

1. Download the repository ZIP and extract it.
2. In Chrome, open \`chrome://extensions\`.
3. Turn on Developer mode and choose **Load unpacked**.
4. Select the \`src/extension\` folder (the folder containing \`manifest.json\`).
5. If already installed, press Reload on the extension card and refresh open webpages.
6. Choose the source and target languages, then click **اعمال زبان‌ها**.
7. Select online or offline mode and search a word, or hover over a single word or select it on a webpage.
8. In online mode, a successful result is automatically saved to the matching offline pair if missing. In offline mode, the extension does not query the online service.

## Dictionary updates and release notes

- The initial update repository is currently pinned to the `test/hover-meaning-prototype` branch for testing. Before publishing a public Chrome Web Store release, change the update manifest URL in `popup.js` to the stable `main` branch and verify the files there.
- The update button checks all pairs listed in the remote manifest. The initial batches contain 20 reviewed entries for `en-fa` and 20 for `fa-en`.
- Remote updates do not overwrite saved personal entries. Exported JSON includes language-pair metadata. Import infers the destination pair from metadata or the filename; files without a detectable pair are skipped to avoid mixing dictionaries.
- This is a manually triggered update, not a background auto-update. The bundled starter dictionary continues to work without an internet connection.

## Notes

- The Greek ↔ Persian starter dictionaries contain a small set of common words and are intended for initial testing, not as complete dictionaries. Italian ↔ Persian starter dictionaries are also included.\n- The bundled English → Persian dictionary includes \`apple: سیب\` for the common fruit meaning.
- Custom saved dictionaries are stored locally in Chrome and do not modify the pair JSON files in the repository.
- The online endpoint requires internet access and permission to contact its host. It is unofficial and may change without notice. HTTP 429 means the service is rate-limiting requests; caching reduces repeat requests but cannot guarantee the endpoint will always work.
- Machine translation is not a full educational dictionary and can give context-dependent results.
- The prototype looks up individual selected words, not phrases with spaces.
- Browser-internal pages, the Chrome Web Store, and restricted pages do not allow content scripts to run.
- Existing legacy files and the \`main\` branch are not changed by this test-branch work.

## راهنمای فارسی

۱. در Chrome آدرس \`chrome://extensions\` را باز کنید، Developer mode را روشن کنید و پوشهٔ \`src/extension\` را با Load unpacked بارگذاری کنید.
۲. زبان مبدأ و مقصد را انتخاب و «اعمال زبان‌ها» را بزنید.
۳. حالت آنلاین یا آفلاین را انتخاب کنید؛ این حالت برای کلمات انتخاب‌شده در صفحات وب هم اعمال می‌شود.
۴. برای حالت آفلاین، واژه‌های موجود در دیکشنری پایه یا واژه‌هایی که با **＋** ذخیره کرده‌اید در دسترس‌اند.
۵. هر جفت‌زبان واژه‌نامهٔ ذخیره‌شدهٔ جداگانه دارد.
۶. آدرس پیش‌فرض از رابط عمومی و غیررسمی ترجمهٔ گوگل استفاده می‌کند و تضمین رسمی یا پایداری ندارد.

## Version 0.7.3 test notes

- Import accepts multiple JSON files. Pair metadata or a recognized pair suffix in the filename identifies the destination. A file with no detectable pair is skipped rather than guessed.
- Imported meanings update matching personal entries; new words are added. Personal entries remain separate from bundled starter files and remote update files.
- Export pair is selected explicitly. Chrome controls the download location/prompt according to its download settings.
- Quality check validates the currently selected file(s), not the active lookup dictionary.
- Tooltip hover logic now permits the same word to trigger a lookup again when its prior card is no longer present.
- Static syntax checks do not replace a real Chrome 109 browser test; follow the staged test checklist before release.


## Version 0.7.3 test notes

- The export selector includes an “all dictionaries” option that downloads `texttranslator-all-dictionaries.zip`.
- The ZIP contains one JSON file for each of the 22 supported language pairs plus a README. Each JSON preserves language-pair metadata and merges bundled starter words, downloaded updates, and personal custom entries.
- The ZIP is generated locally in the popup without a third-party library. Extract it and select all JSON files together in the multi-file Import control to restore them.
- ZIP creation is implemented with stored (uncompressed) entries for compatibility; real Chrome 109 download and re-import testing is still required.


## Version 0.7.4 test notes

- In online mode, the extension uses an online result (or its seven-day cache) even if the word already exists in the offline dictionary. It checks the matching pair across bundled starter words, downloaded updates, and personal entries.
- If the word is absent and an online meaning is successfully received, the meaning is automatically saved to that pair's personal dictionary. Existing offline entries are not overwritten, and no success notice appears for an existing word.
- Popup lookup and page tooltips display a short green save confirmation only after a successful save. A failed online lookup does not silently switch to an offline meaning while online mode is selected.
- Offline mode remains local-only: when a word is absent, it reports that it is missing and does not request an online translation.
- Static syntax and manifest checks passed; real Chrome 109 interaction testing is still required.
