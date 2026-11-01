# TextTranslator Privacy Policy

**Last updated: 31 October 2026**

TextTranslator is a browser extension for word lookup, online translation, and pair-specific offline dictionaries. It does not include advertising, analytics, or user-tracking code.

## Information stored on your device

TextTranslator uses the browser's local extension storage for:
- Language-pair and online/offline preferences.
- Hover and text-selection settings, including tooltip duration.
- Dictionary entries you add or import.
- Downloaded dictionary updates and cached translation results.

This information stays in your browser profile and is not sent to the project maintainer. Custom entries remain until you remove them, clear the extension's data, or uninstall the extension. Cached online translations are considered valid for seven days.

## Information sent to external services

When you use online lookup, the submitted word or selected phrase and the source/target language codes are sent to the configured translation provider. The default configuration uses a public, unofficial Google Translate interface at translate.googleapis.com. If the primary request fails or is rate-limited, the extension may try MyMemory at api.mymemory.translated.net. If you configure a different endpoint, the lookup is sent to that endpoint instead.

The extension does not intentionally send the full webpage, browsing history, account details, or your locally stored dictionary to these providers. Only the text submitted for translation and the language pair are included in a lookup request. External providers' privacy practices apply to data they receive; review their policies before using online mode.

When you manually request dictionary updates, the extension downloads public dictionary update files from this project's GitHub repository. Import and export operations process selected files locally in the browser and do not upload them to the project maintainer.

## Permissions and webpage access

The content script is configured to run on webpages so that hover and text-selection translation can work. It checks the word under the pointer or the text you select only when the corresponding feature is enabled. It does not collect or transmit page content in the background.

The storage permission is used for local settings, dictionaries, and translation cache. Access to translation providers is declared in host_permissions. Optional HTTP/HTTPS host access allows a user to choose a custom translation endpoint; the browser may ask for host access when a custom endpoint is saved.

## Sharing, sale, and advertising

The project maintainer does not sell or share locally stored extension data. TextTranslator does not display third-party ads and does not use analytics or tracking technologies.

## Your choices

- Use offline mode to look up only local dictionary entries without contacting a translation provider.
- Turn off hover lookup and/or text-selection lookup independently.
- Avoid online lookup or remove a custom endpoint if you do not want text sent to an external translation service.
- Export dictionary entries before clearing browser data if you want a backup.
- Clear the extension's stored data or uninstall the extension to remove local settings and entries.

## Contact

For privacy questions or to report an issue, open an issue in the public project repository:

https://github.com/np8462/TextTranslator/issues

---

# سیاست حریم خصوصی TextTranslator

**آخرین به‌روزرسانی: ۱۰ آبان ۱۴۰۵**

TextTranslator افزونه‌ای برای جست‌وجوی معنی واژه، ترجمهٔ آنلاین و استفاده از دیکشنری‌های آفلاین مستقل برای هر جفت‌زبان است. این افزونه تبلیغات، ابزار تحلیل رفتار یا کد ردیابی کاربران ندارد.

## اطلاعات ذخیره‌شده روی دستگاه

تنظیمات زبان و حالت ترجمه، تنظیمات انتخاب متن و حرکت ماوس، مدت نمایش راهنما، واژه‌هایی که خودتان اضافه یا وارد می‌کنید، به‌روزرسانی‌های دیکشنری و نتیجه‌های موقت ترجمه در حافظهٔ محلی افزونه در مرورگر ذخیره می‌شوند. این اطلاعات به توسعه‌دهنده ارسال نمی‌شوند. واژه‌های شخصی تا زمان حذف داده‌های افزونه یا حذف خود افزونه باقی می‌مانند. نتیجه‌های ترجمهٔ موقت برای هفت روز معتبر در نظر گرفته می‌شوند.

## اطلاعات ارسالی به سرویس‌های بیرونی

هنگام استفاده از ترجمهٔ آنلاین، فقط واژه یا عبارت انتخاب‌شده و کد زبان مبدأ و مقصد برای سرویس ترجمه ارسال می‌شود. سرویس پیش‌فرض، رابط عمومی و غیررسمی Google Translate در translate.googleapis.com است. اگر درخواست اصلی ناموفق یا محدود شود، افزونه ممکن است MyMemory را در api.mymemory.translated.net امتحان کند. اگر آدرس دیگری در تنظیمات وارد کنید، درخواست به همان سرویس انتخابی ارسال می‌شود.

افزونه عمداً کل محتوای صفحه، تاریخچهٔ مرور، اطلاعات حساب یا دیکشنری محلی شما را برای این سرویس‌ها ارسال نمی‌کند. سیاست حریم خصوصی سرویس بیرونی دربارهٔ اطلاعات دریافتی خودش اعمال می‌شود؛ پیش از استفاده از حالت آنلاین، آن سیاست‌ها را بررسی کنید.

با درخواست دستی به‌روزرسانی دیکشنری، فایل‌های عمومی مخزن GitHub پروژه دریافت می‌شوند. عملیات Import و Export در خود مرورگر انجام می‌شود و فایل‌های انتخابی برای توسعه‌دهنده ارسال نمی‌شوند.

## مجوزها و دسترسی به صفحات

اسکریپت افزونه برای ارائهٔ قابلیت ترجمه هنگام حرکت ماوس و انتخاب متن، روی صفحات وب اجرا می‌شود. فقط واژهٔ زیر نشانگر یا متنی که کاربر انتخاب کرده است، هنگام فعال بودن قابلیت مربوط بررسی می‌شود. افزونه محتوای صفحات را در پس‌زمینه جمع‌آوری یا ارسال نمی‌کند.

مجوز storage برای نگهداری محلی تنظیمات، دیکشنری‌ها و حافظهٔ موقت ترجمه استفاده می‌شود. دسترسی به سرویس‌های ترجمه و میزبان‌های اختیاری HTTP/HTTPS نیز برای امکان انتخاب آدرس سرویس ترجمهٔ دلخواه در نظر گرفته شده است.

## اشتراک‌گذاری، فروش و تبلیغات

توسعه‌دهنده اطلاعات محلی افزونه را نمی‌فروشد یا به اشتراک نمی‌گذارد. TextTranslator تبلیغات شخص ثالث، ابزار تحلیل رفتار یا فناوری ردیابی ندارد.

## انتخاب‌های کاربر

- با انتخاب حالت آفلاین، فقط واژه‌های موجود در دیکشنری محلی بررسی می‌شوند و درخواست ترجمهٔ آنلاین ارسال نمی‌شود.
- می‌توانید ترجمه با حرکت ماوس یا انتخاب متن را جداگانه خاموش کنید.
- برای جلوگیری از ارسال متن به سرویس بیرونی، از حالت آفلاین استفاده کنید یا آدرس سرویس آنلاین سفارشی را حذف کنید.
- پیش از پاک کردن داده‌های مرورگر، در صورت نیاز از دیکشنری خود خروجی بگیرید.
- با پاک کردن داده‌های افزونه یا حذف آن، تنظیمات و واژه‌های محلی نیز حذف می‌شوند.

## تماس

برای پرسش‌های مربوط به حریم خصوصی یا گزارش مشکل، در مخزن عمومی پروژه Issue ثبت کنید:

https://github.com/np8462/TextTranslator/issues
