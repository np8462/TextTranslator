# TextTranslator Chrome Extension

**Status:** Local prototype, version 0.3.0. Test branch only; not a published Chrome Web Store release.

این افزونهٔ آزمایشی مستقل از برنامهٔ قدیمی ویندوزی است. با انتخاب یک واژهٔ انگلیسی، معنی آفلاین در پنجره‌ای کوچک نمایش داده می‌شود. از پنجرهٔ افزونه هم می‌توان کلمه را جست‌وجو کرد؛ اگر در دیکشنری آفلاین نبود، افزونه سرویس آنلاین را امتحان می‌کند.

## Features

- Offline dictionary stored in `dictionary.json` (editable JSON file).
- Saved words are stored locally in Chrome extension storage and remain available offline on that browser.
- Default online endpoint: `https://api.mymemory.translated.net/get?q={word}&langpair=en|fa`.
- The endpoint can be changed in the extension popup. The URL must contain `{word}`.
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
7. Select one English word on a regular webpage to see its offline meaning, or open the extension popup and type a word into **جست‌وجوی معنی**.
8. When an online meaning appears, click **افزودن معنی به دیکشنری آفلاین** to save it for future offline use.
9. To use another online service, edit the endpoint URL in the popup. It must contain `{word}` and return JSON in one of the supported shapes above. Save it or run a lookup to grant permission for that host.

## Notes

- The initial JSON file is the bundled offline dictionary. Add more entries using the same format: `"word": "معنی فارسی"`.
- Newly saved words go into Chrome's local extension storage, not back into the repository's `dictionary.json`.
- Online lookup requires an internet connection and permission to contact the selected host. Availability of the default third-party service may vary.
- This prototype looks up individual English words, not full sentences.
- Some browser-internal pages, the Chrome Web Store, and restricted pages do not allow content scripts to run.
- The old files in `legacy-files/` are kept separate and are not modified by this prototype.

## راهنمای فارسی

۱. در Chrome آدرس `chrome://extensions` را باز کنید، Developer mode را روشن کنید و با Load unpacked پوشهٔ `src/extension` را انتخاب کنید.
۲. اگر افزونه نصب است، Reload را بزنید و صفحه‌های وب باز را تازه‌سازی کنید.
۳. برای معنی سریع یک کلمه را در صفحه انتخاب کنید. برای جست‌وجوی مستقیم، پنجرهٔ افزونه را باز کنید و کلمه را وارد کنید.
۴. اگر معنی فقط از اینترنت پیدا شد، دکمهٔ **افزودن معنی به دیکشنری آفلاین** را بزنید تا در همین مرورگر ذخیره شود.
۵. آدرس دیکشنری آنلاین در قسمت تنظیمات قابل تغییر است. آدرس باید `{word}` داشته باشد و پاسخ JSON با یکی از فیلدهای پشتیبانی‌شده برگرداند.
۶. واژه‌نامهٔ پایه در فایل `dictionary.json` قرار دارد؛ می‌توانید آن را ویرایش کنید. واژه‌های ذخیره‌شده از داخل افزونه در حافظهٔ محلی Chrome می‌مانند.

این تغییرات فقط در شاخهٔ آزمایشی انجام شده‌اند؛ شاخهٔ `main` و فایل‌های قدیمی دست‌نخورده‌اند.
