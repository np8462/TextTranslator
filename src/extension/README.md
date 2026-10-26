# TextTranslator Chrome Extension

**Status:** Local prototype, version 0.3.0. Test branch only; not a published Chrome Web Store release.

این افزونه با انتخاب یک واژهٔ انگلیسی معنی آفلاین را در پنجره‌ای کوچک نشان می‌دهد. در پنجرهٔ افزونه هم دو دکمهٔ جدا برای جست‌وجوی آفلاین و آنلاین وجود دارد.

## Features

- Offline dictionary stored in `dictionary.json`.
- Separate **offline lookup** and **online lookup** buttons.
- A green **＋ افزودن به دیکشنری آفلاین** button appears after a meaning is found; it saves the word and meaning in local Chrome extension storage.
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
7. Select one English word on a regular webpage to see its offline meaning, or open the extension popup and type a word.
8. Choose **جست‌وجوی آفلاین** to check saved words, or **جست‌وجوی آنلاین** to query the configured service.
9. After an online meaning appears, click **＋ افزودن به دیکشنری آفلاین** to save it.
10. To use another online service, edit the endpoint URL in the popup. It must contain `{word}` and return JSON in one of the supported shapes above.

## Notes

- Add entries to the bundled dictionary using this format: `"word": "معنی فارسی"`.
- Newly saved words go into Chrome's local extension storage, not back into the repository's `dictionary.json`.
- Online lookup requires an internet connection and permission to contact the selected host. Availability of the default third-party service may vary.
- This prototype looks up individual English words, not full sentences.
- Some browser-internal pages, the Chrome Web Store, and restricted pages do not allow content scripts to run.
- The old files in `legacy-files/` are kept separate and are not modified by this prototype.

## راهنمای فارسی

۱. در Chrome آدرس `chrome://extensions` را باز کنید، Developer mode را روشن کنید و با Load unpacked پوشهٔ `src/extension` را انتخاب کنید.
۲. اگر افزونه نصب است، Reload را بزنید و صفحه‌های وب باز را تازه‌سازی کنید.
۳. برای معنی سریع یک کلمه را در صفحه انتخاب کنید. برای جست‌وجوی مستقیم، پنجرهٔ افزونه را باز کنید.
۴. دکمهٔ **جست‌وجوی آفلاین** فقط واژه‌های ذخیره‌شده را می‌گردد؛ دکمهٔ **جست‌وجوی آنلاین** از سرویس اینترنتی استفاده می‌کند.
۵. بعد از پیدا شدن معنی، روی **＋ افزودن به دیکشنری آفلاین** بزنید تا آن واژه در همین مرورگر ذخیره شود و بعداً بدون اینترنت هم قابل استفاده باشد.
۶. آدرس دیکشنری آنلاین در قسمت تنظیمات قابل تغییر است. آدرس باید `{word}` داشته باشد و پاسخ JSON با یکی از فیلدهای پشتیبانی‌شده برگرداند.
۷. واژه‌نامهٔ پایه در فایل `dictionary.json` قرار دارد؛ واژه‌های ذخیره‌شده از داخل افزونه در حافظهٔ محلی Chrome می‌مانند.

این تغییرات فقط در شاخهٔ آزمایشی انجام شده‌اند؛ شاخهٔ `main` و فایل‌های قدیمی دست‌نخورده‌اند.
