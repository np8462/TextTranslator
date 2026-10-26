# TextTranslator Chrome Extension

**Status:** Initial project scaffold; the word-lookup feature is not implemented yet.

این پوشه برای توسعه افزونه مستقل Google Chrome است و از برنامه قدیمی ویندوزی جدا نگه داشته می‌شود.

## Compatibility

- Target browser: Google Chrome 109 and later.
- Uses Manifest V3.
- No build step or third-party package is required for this initial scaffold.

## Install locally

1. Download the repository, or use **Code → Download ZIP** on GitHub.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked**.
5. Select the `src/extension` folder (the folder containing `manifest.json`).

## Current state

This commit creates the extension's starting structure only. Word selection, the meaning popup, online lookup, and an offline dictionary will be added and tested in later steps.

---

## راهنمای نصب فارسی

۱. مخزن را دانلود کنید یا از GitHub گزینه **Code → Download ZIP** را بزنید.  
۲. در کروم آدرس `chrome://extensions` را باز کنید.  
۳. گزینه **Developer mode** را فعال کنید.  
۴. روی **Load unpacked** بزنید.  
۵. پوشه `src/extension` را انتخاب کنید؛ همان پوشه‌ای که فایل `manifest.json` در آن قرار دارد.

در این مرحله فقط ساختار اولیه افزونه ایجاد شده است. قابلیت انتخاب کلمه، نمایش معنی، جست‌وجوی آنلاین و واژه‌نامه آفلاین در مراحل بعدی پیاده‌سازی و آزمایش می‌شوند.
