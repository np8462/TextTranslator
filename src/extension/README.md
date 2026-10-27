# TextTranslator Chrome Extension

**Status:** Local prototype, version 0.6.0. Changes are limited to the test branch; this is not a published Chrome Web Store release.

این افزونه می‌تواند هنگام بردن ماوس روی یک واژه یا انتخاب آن در صفحه، معنی آن را در یک کارت کوچک نشان دهد. حالت آنلاین/آفلاین و جفت‌زبان انتخاب‌شده در پنجرهٔ افزونه برای کلمات هایلایت‌شده نیز اعمال می‌شود.

## Features

- Separate source and target language selectors: English, German, French, Spanish, Italian, Greek, Turkish, Arabic, Russian, Japanese, Simplified Chinese, and Persian.
- Separate local saved dictionary for each language pair (for example, \`en-fa\` and \`de-fa\`).
- Starter offline dictionaries are included for Persian ↔ English, German, French, Spanish, Italian, Greek, Turkish, Arabic, Russian, Japanese, and Simplified Chinese. Each language pair has its own JSON file under `dictionaries/` (for example `en-fa.json`, `fa-en.json`, `el-fa.json`, and `fa-el.json`); user-added entries override starter meanings in Chrome local storage.
- One online/offline toggle shared by popup lookup and highlighted-word lookup.
- The default online endpoint is \`https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={word}\`.
- This endpoint is a public, unofficial Google Translate interface; it is not a documented, guaranteed Google Cloud Translation API and may change or stop working.
- The official Google Cloud Translation API requires Google Cloud configuration/authentication and may incur charges.
- After an online lookup, the **＋** button saves that word and meaning in Chrome local storage under the currently selected language pair. Successful online results are cached locally for seven days; when the service returns HTTP 429, repeated calls are paused for one minute and the extension tries the pair's offline dictionary. The popup does not list dictionary contents. Tooltip duration can be set manually from 1 to 60 seconds (default 2 seconds).
- No build step or third-party package is required. Uses Manifest V3.

## Install locally

1. Download the repository ZIP and extract it.
2. In Chrome, open \`chrome://extensions\`.
3. Turn on Developer mode and choose **Load unpacked**.
4. Select the \`src/extension\` folder (the folder containing \`manifest.json\`).
5. If already installed, press Reload on the extension card and refresh open webpages.
6. Choose the source and target languages, then click **اعمال زبان‌ها**.
7. Select online or offline mode and search a word, or hover over a single word or select it on a webpage.
8. After an online meaning appears, click **＋** in the popup to save it for offline use in the same language pair.

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