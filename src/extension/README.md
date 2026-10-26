# TextTranslator Chrome Extension

**Status:** Local prototype, version 0.3.0. Test branch only; not a published Chrome Web Store release.

این افزونه هنگام انتخاب واژه در صفحه، معنی آفلاین را در کارت کوچکی نشان می‌دهد. در پنجرهٔ افزونه، یک دکمهٔ واحد حالت دیکشنری را بین آنلاین و آفلاین تغییر می‌دهد.

## Features

- Offline dictionary stored in `dictionary.json`.
- One **online/offline mode toggle** for word lookup in the popup; default mode is online.
- Online mode uses the configured endpoint; offline mode only searches saved entries.
- A green **＋ افزودن معنی به دیکشنری آفلاین** button is enabled after an online meaning is found. It saves the word and meaning in local Chrome extension storage.
- Saved words are available offline in the same browser.
- Default online endpoint: `https://api.mymemory.translated.net/get?q={word}&langpair=en|fa`.
- The endpoint can be changed in the popup. The URL must contain `{word}`.
- Online JSON responses support `responseData.translatedText`, `meaning`, `translation`, or `translatedText`.
- The extension asks permission for the online service's host before contacting it.
- No build step or third-party package is required. Uses Manifest V3.

## Install locally

1. Download the repository using Code → Download ZIP, then extract it.
2. In Chrome, open `chrome://extensions`.
3. Turn on Developer mode.
4. Choose Load unpacked.
5. Select the `src/extension` folder (the folder containing `manifest.json`).
6. If already installed, press Reload on the extension card and refresh any open webpages.
7. Open the extension popup and switch between **حالت دیکشنری: آنلاین** and **حالت دیکشنری: آفلاین**.
8. Type one English word and choose **پیدا کردن معنی**.
9. After an online meaning appears, click **＋ افزودن معنی به دیکشنری آفلاین** to save it.
10. To use another online service, edit the endpoint URL in the popup. It must contain `{word}` and return JSON in one of the supported shapes above.

## Notes

- The bundled dictionary includes `apple: سیب` as the common fruit meaning.
- Newly saved words go into Chrome's local extension storage, not back into the repository's `dictionary.json`.
- Online lookup requires an internet connection and permission to contact the selected host. Availability of the default third-party service may vary.
- Machine translation may confuse proper names and common nouns; the prototype includes a small safeguard for the common `apple` → `سیب` case, but ambiguous words in general may need a proper dictionary source.
- This prototype looks up individual English words, not full sentences.
- Some browser-internal pages, the Chrome Web Store, and restricted pages do not allow content scripts to run.
- The old files in `legacy-files/` are kept separate and are not modified by this prototype.

## راهنمای فارسی

۱. در Chrome آدرس `chrome://extensions` را باز کنید، Developer mode را روشن کنید و با Load unpacked پوشهٔ `src/extension` را انتخاب کنید.
۲. اگر افزونه نصب است، Reload را بزنید.
۳. در پنجرهٔ افزونه با یک دکمه بین حالت آنلاین و آفلاین جابه‌جا شوید.
۴. در حالت آنلاین، معنی از آدرس ذخیره‌شده گرفته می‌شود؛ در حالت آفلاین فقط واژه‌های ذخیره‌شده جست‌وجو می‌شوند.
۵. بعد از پیدا شدن معنی آنلاین، روی **＋ افزودن معنی به دیکشنری آفلاین** بزنید تا آن واژه در همین مرورگر ذخیره شود.
۶. آدرس دیکشنری آنلاین در قسمت تنظیمات قابل تغییر است. آدرس باید `{word}` داشته باشد و پاسخ JSON با یکی از فیلدهای پشتیبانی‌شده برگرداند.

این تغییرات فقط در شاخهٔ آزمایشی انجام شده‌اند؛ شاخهٔ `main` و فایل‌های قدیمی دست‌نخورده‌اند.
