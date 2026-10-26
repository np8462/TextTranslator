# TextTranslator Chrome Extension

**Status:** Local prototype, version 0.2.0. This is a test build, not a published Chrome Web Store release.

این افزونهٔ آزمایشی مستقل از برنامهٔ قدیمی ویندوزی است. در این نسخه با انتخاب یک کلمهٔ انگلیسی، معنی فارسیِ چند واژهٔ نمونه در یک پنجرهٔ کوچک نمایش داده می‌شود.

## Compatibility

- Target browser: Google Chrome 109 and later.
- Uses Manifest V3.
- No build step or third-party package is required.
- Uses a small local demo dictionary; online lookup is not implemented yet.

## Install locally

1. Download the repository using Code → Download ZIP, then extract it.
2. In Chrome, open chrome://extensions.
3. Turn on Developer mode.
4. Choose Load unpacked.
5. Select the src/extension folder (the folder containing manifest.json).
6. Open a regular webpage, select one English word, and inspect the small meaning card.
7. Click the extension icon to enable or disable the feature.

If the extension was already installed, press Reload on its card after replacing the files. Refresh webpages that were open before the extension was loaded.

## Notes

- The prototype responds to a selected single English word. It does not yet translate sentences or support every word.
- Some browser-internal pages, the Chrome Web Store, and restricted pages do not allow content scripts to run.
- The old files in legacy-files/ are kept separate and are not modified by this prototype.

---

## راهنمای نصب و استفاده

۱. از GitHub گزینهٔ Code → Download ZIP را بزنید و فایل را از حالت فشرده خارج کنید.
۲. در Chrome آدرس chrome://extensions را باز کنید.
۳. گزینهٔ Developer mode را فعال کنید.
۴. روی Load unpacked بزنید و پوشهٔ src/extension را انتخاب کنید.
۵. یک صفحهٔ وب معمولی را باز کنید و یک کلمهٔ انگلیسی را انتخاب کنید؛ پنجرهٔ کوچک معنی کنار آن ظاهر می‌شود.
۶. از آیکون افزونه می‌توانید قابلیت را فعال یا خاموش کنید. اگر افزونه از قبل نصب بوده، ابتدا Reload را بزنید و سپس صفحهٔ وب را تازه‌سازی کنید.

این نسخه فقط یک واژه‌نامهٔ کوچک آفلاین برای آزمایش دارد؛ جست‌وجوی آنلاین و معنی همهٔ کلمات هنوز اضافه نشده است. فایل‌های قدیمی داخل legacy-files دست‌نخورده باقی می‌مانند.
