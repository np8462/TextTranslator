var DEFAULT_URL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={word}";
var LANGUAGE_NAMES = { en: "انگلیسی", de: "آلمانی", fr: "فرانسوی", es: "اسپانیایی", it: "ایتالیایی", el: "یونانی", tr: "ترکی", ar: "عربی", ru: "روسی", ja: "ژاپنی", "zh-CN": "چینی ساده‌شده", fa: "فارسی" };

document.addEventListener("DOMContentLoaded", function () {
  var status = document.getElementById("status");
  var toggle = document.getElementById("toggle");
  var modeToggle = document.getElementById("mode-toggle");
  var modeHelp = document.getElementById("mode-help");
  var sourceSelect = document.getElementById("source-language");
  var targetSelect = document.getElementById("target-language");
  var saveLanguages = document.getElementById("save-languages");
  var wordInput = document.getElementById("word");
  var lookup = document.getElementById("lookup");
  var result = document.getElementById("result");
  var saveNotice = document.getElementById("save-notice");
  var saveNoticeTimer = null;
  var saveWord = document.getElementById("save-word");
  var endpoint = document.getElementById("endpoint");
  var saveEndpoint = document.getElementById("save-endpoint");
  var displayDuration = document.getElementById("display-duration");
  var selectionToggle = document.getElementById("translate-on-selection");
  var hoverToggle = document.getElementById("translate-on-hover");
  var offlineSuggestion = document.getElementById("offline-suggestion");
  var dictionaryToolsResult = document.getElementById("dictionary-tools-result");
  var importFile = document.getElementById("import-file");
  var exportDictionary = document.getElementById("export-dictionary");
  var importDictionary = document.getElementById("import-dictionary");
  var checkDictionary = document.getElementById("check-dictionary");
  var updateDictionary = document.getElementById("update-dictionary");
  var exportPairSelect = document.getElementById("export-pair");

  var currentWord = "";
  var currentMeaning = "";
  var dictionaryMode = "online";
  var sourceLanguage = "en";
  var targetLanguage = "fa";
  var offline = {};
  var offlineLoaded = false;

  function pairKey() { return sourceLanguage + "-" + targetLanguage; }
  var SUPPORTED_PAIRS = ["en-fa","fa-en","de-fa","fa-de","fr-fa","fa-fr","es-fa","fa-es","it-fa","fa-it","el-fa","fa-el","tr-fa","fa-tr","ar-fa","fa-ar","ru-fa","fa-ru","ja-fa","fa-ja","zh-CN-fa","fa-zh-CN"];
  function pairFromMetadata(parsed) {
    if (parsed && parsed.sourceLanguage && parsed.targetLanguage) {
      var key = parsed.sourceLanguage + "-" + parsed.targetLanguage;
      if (SUPPORTED_PAIRS.indexOf(key) >= 0) return key;
    }
    return "";
  }
  function pairFromFile(file, parsed) {
    var fromMetadata = pairFromMetadata(parsed);
    if (fromMetadata) return fromMetadata;
    var name = String(file && file.name || "").replace(/\.json$/i, "").toLowerCase();
    var pairs = SUPPORTED_PAIRS.slice(0).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < pairs.length; i++) {
      var candidate = pairs[i].toLowerCase();
      if (name === candidate || name.slice(-(candidate.length + 1)) === "-" + candidate || name.slice(-(candidate.length + 1)) === "_" + candidate) return pairs[i];
    }
    return "";
  }
  function loadDictionaryForPair(key, callback) {
    var combined = {};
    fetch(chrome.runtime.getURL("dictionaries/" + key + ".json")).then(function (response) {
      if (!response.ok) return {};
      return response.json();
    }).catch(function () { return {}; }).then(function (seeded) {
      Object.keys(seeded || {}).forEach(function (word) { if (typeof seeded[word] === "string") combined[word.toLowerCase()] = seeded[word]; });
      chrome.storage.local.get({ customDictionaries: {}, updatedDictionaries: {}, customDictionary: {} }, function (saved) {
        var updated = (saved.updatedDictionaries || {})[key] || {};
        Object.keys(updated).forEach(function (word) { if (typeof updated[word] === "string") combined[word.toLowerCase()] = updated[word]; });
        var custom = (saved.customDictionaries || {})[key] || {};
        if (key === "en-fa" && !Object.keys(custom).length && saved.customDictionary) custom = saved.customDictionary;
        Object.keys(custom).forEach(function (word) { if (typeof custom[word] === "string") combined[word.toLowerCase()] = custom[word]; });
        callback(combined);
      });
    });
  }
  function render(enabled) {
    status.textContent = enabled ? "وضعیت: افزونه فعال است." : "وضعیت: افزونه خاموش است.";
    toggle.textContent = enabled ? "خاموش کردن افزونه" : "فعال کردن افزونه";
    toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  }
  function renderMode() {
    var online = dictionaryMode === "online";
    modeToggle.textContent = online ? "حالت دیکشنری: آنلاین" : "حالت دیکشنری: آفلاین";
    modeToggle.setAttribute("aria-pressed", online ? "true" : "false");
    modeHelp.textContent = online
      ? "حالت آنلاین: معنی از سرویس اینترنتی گرفته می‌شود؛ این تنظیم در هایلایت صفحات هم اعمال می‌شود."
      : "حالت آفلاین: فقط دیکشنری پایه و واژه‌های ذخیره‌شدهٔ همین جفت‌زبان جست‌وجو می‌شوند.";
  }
  function normalizeEndpoint(urlText) {
    if (!urlText || urlText.indexOf("{word}") === -1 || urlText.indexOf("{source}") === -1 || urlText.indexOf("{target}") === -1) return DEFAULT_URL;
    return urlText;
  }
  function getHostPattern(urlText) {
    try {
      var testUrl = urlText.replace(/\{word\}/g, "hello").replace(/\{source\}/g, "en").replace(/\{target\}/g, "fa");
      var parsed = new URL(testUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      return parsed.origin + "/*";
    } catch (e) { return null; }
  }
  function validWord() {
    var word = wordInput.value.trim();
    if (!word || word.length > 80) {
      setResult("لطفاً یک واژه یا عبارت حداکثر ۸۰ نویسه‌ای وارد کن.", "error");
      saveWord.disabled = true;
      return "";
    }
    return word;
  }
  function setResult(message, type) {
    result.textContent = message;
    result.className = "result-message" + (type ? " " + type : "");
    if (offlineSuggestion) offlineSuggestion.hidden = true;
  }
  function showMeaning(word, meaning, source) {
    currentWord = word;
    currentMeaning = meaning;
    setResult((source === "online" ? "معنی آنلاین: " : "معنی آفلاین: ") + meaning, source === "online" ? "info" : "success");
    saveWord.disabled = source !== "online";
  }
  function showSaveNotice(message, isError) {
    if (!saveNotice) return;
    if (saveNoticeTimer) window.clearTimeout(saveNoticeTimer);
    saveNotice.textContent = message;
    saveNotice.className = isError ? "save-notice error" : "save-notice";
    saveNotice.hidden = false;
    saveNoticeTimer = window.setTimeout(function () {
      saveNotice.hidden = true;
      saveNoticeTimer = null;
    }, 2500);
  }
  function hideSaveNotice() {
    if (saveNoticeTimer) window.clearTimeout(saveNoticeTimer);
    saveNoticeTimer = null;
    if (saveNotice) saveNotice.hidden = true;
  }
  function lookupOfflineWord(word) {
    if (!offlineLoaded) {
      setResult("واژه‌نامهٔ آفلاین در حال بارگذاری است؛ یک لحظه دیگر امتحان کن.", "info");
      return;
    }
    var meaning = offline[word.toLowerCase()];
    if (meaning) showMeaning(word, meaning, "offline");
    else {
      currentWord = word; currentMeaning = ""; saveWord.disabled = true;
      setResult("این واژه در دیکشنری آفلاین «" + LANGUAGE_NAMES[sourceLanguage] + " به " + LANGUAGE_NAMES[targetLanguage] + "» نیست.", "warning");
    }
  }
  function showOnlineFailure(word, error) {
    var offlineMeaning = offlineLoaded ? offline[String(word || "").toLowerCase()] : "";
    setResult("خطای آنلاین: " + error, "error");
    if (offlineMeaning && offlineSuggestion) {
      offlineSuggestion.textContent = "پیشنهاد جداگانهٔ معنی آفلاین: " + offlineMeaning;
      offlineSuggestion.hidden = false;
    }
    saveWord.disabled = true;
  }
  function lookupOnlineWord(word) {
    var urlText = normalizeEndpoint(endpoint.value.trim());
    endpoint.value = urlText;
    var pattern = getHostPattern(urlText);
    if (!pattern) {
      setResult("آدرس نامعتبر است؛ باید HTTP/HTTPS باشد و {word}، {source} و {target} را داشته باشد.", "error");
      saveWord.disabled = true; return;
    }
    currentWord = word; currentMeaning = ""; saveWord.disabled = true;
    setResult("در حال جست‌وجوی آنلاین...", "info");
    chrome.permissions.request({ origins: [pattern] }, function (granted) {
      if (!granted) { var permissionError = "اجازهٔ دسترسی به این سرویس داده نشد."; setResult(permissionError, "error"); showSaveNotice(permissionError, true); return; }
      chrome.storage.local.set({ onlineDictionaryUrl: urlText }, function () {
        chrome.runtime.sendMessage({ type: "ONLINE_LOOKUP", word: word, source: sourceLanguage, target: targetLanguage }, function (response) {
          if (chrome.runtime.lastError) { showOnlineFailure(word, "ارتباط با افزونهٔ پس‌زمینه ناموفق بود: " + chrome.runtime.lastError.message); return; }
          if (!response || !response.ok) { showOnlineFailure(word, response && response.error ? response.error : "معنی آنلاین پیدا نشد."); return; }
          showMeaning(word, response.meaning, response.offlineFallback ? "offline" : "online");
          if (response.autoSaved === true || response.alreadyOffline === true) {
            saveWord.disabled = true;
          } else if (response.saveFailed === true) {
            setResult("معنی آنلاین: " + response.meaning + "\nذخیره‌سازی خودکار آفلاین ناموفق بود.", "warning");
          }
        });
      });
    });
  }
  function runLookup() {
    hideSaveNotice();
    var word = validWord();
    if (!word) return;
    if (dictionaryMode === "online") lookupOnlineWord(word);
    else lookupOfflineWord(word);
  }
  function loadOffline() {
    offlineLoaded = false;
    offline = {};
    var key = pairKey();
    fetch(chrome.runtime.getURL("dictionaries/" + key + ".json")).then(function (response) {
      if (!response.ok) throw new Error("pair dictionary not found");
      return response.json();
    }).catch(function () { return {}; }).then(function (seeded) {
      if (key !== pairKey()) return;
      Object.keys(seeded || {}).forEach(function (word) {
        if (typeof seeded[word] === "string") offline[word.toLowerCase()] = seeded[word];
      });
      chrome.storage.local.get({ customDictionaries: {}, customDictionary: {}, updatedDictionaries: {} }, function (saved) {
        if (key !== pairKey()) return;
        var dictionaries = saved.customDictionaries || {};
        if (!dictionaries["en-fa"] && saved.customDictionary && Object.keys(saved.customDictionary).length) {
          dictionaries["en-fa"] = saved.customDictionary;
          chrome.storage.local.set({ customDictionaries: dictionaries });
        }
        var updatedWords = (saved.updatedDictionaries || {})[key] || {};
        Object.keys(updatedWords).forEach(function (word) { if (typeof updatedWords[word] === "string") offline[word.toLowerCase()] = updatedWords[word]; });
        var pairWords = dictionaries[key] || {};
        Object.keys(pairWords).forEach(function (word) {
          if (typeof pairWords[word] === "string") offline[word.toLowerCase()] = pairWords[word];
        });
        offlineLoaded = true;
      });
    });
  }
  var UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/np8462/TextTranslator/test/hover-meaning-prototype/src/extension/dictionary-updates/manifest.json";

  function validateDictionaryText(rawText, expectedPair) {
    var parsed;
    try { parsed = JSON.parse(rawText); }
    catch (e) { return { ok: false, error: "JSON معتبر نیست: " + e.message }; }
    var duplicateKeys = [];
    var seen = {};
    var keyPattern = /("(?:\\.|[^"\\])*")\s*:/g;
    var match;
    while ((match = keyPattern.exec(rawText)) !== null) {
      try {
        var key = JSON.parse(match[1]);
        if (Object.prototype.hasOwnProperty.call(seen, key)) duplicateKeys.push(key);
        seen[key] = true;
      } catch (ignore) {}
    }
    var entries = parsed;
    if (parsed && typeof parsed === "object" && parsed.entries && typeof parsed.entries === "object" && !Array.isArray(parsed.entries)) {
      if (expectedPair && parsed.sourceLanguage && parsed.targetLanguage &&
          parsed.sourceLanguage + "-" + parsed.targetLanguage !== expectedPair) {
        return { ok: false, error: "جفت‌زبان فایل (" + parsed.sourceLanguage + "-" + parsed.targetLanguage + ") با جفت‌زبان مورد انتظار (" + expectedPair + ") یکسان نیست." };
      }
      entries = parsed.entries;
    }
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) return { ok: false, error: "ساختار باید یک شیء JSON از واژه‌ها و معنی‌ها باشد." };
    var keys = Object.keys(entries), issues = [];
    if (!keys.length) issues.push("فایل هیچ واژه‌ای ندارد");
    keys.forEach(function (key) {
      if (!key.trim()) issues.push("کلید خالی وجود دارد");
      if (key.length > 80) issues.push("کلید بیش از ۸۰ نویسه دارد: " + key.slice(0, 20));
      if (typeof entries[key] !== "string" || !entries[key].trim()) issues.push("معنی خالی یا غیرمتنی برای: " + key);
      else if (entries[key].length > 500) issues.push("معنی بیش از ۵۰۰ نویسه دارد: " + key);
      if (/\s{2,}/.test(key)) issues.push("فاصلهٔ تکراری در کلید: " + key);
    });
    if (duplicateKeys.length) issues.push("کلید تکراری در متن JSON: " + duplicateKeys.join("، "));
    return { ok: issues.length === 0, entries: entries, count: keys.length, issues: issues, duplicateKeys: duplicateKeys };
  }

  function readSelectedFiles(files, callback) {
    var selected = Array.prototype.slice.call(files || []);
    if (!selected.length) { dictionaryToolsResult.textContent = "ابتدا یک یا چند فایل JSON انتخاب کن."; return; }
    var results = [], index = 0;
    function next() {
      if (index >= selected.length) { callback(results); return; }
      var file = selected[index++], reader = new FileReader();
      reader.onload = function () {
        var rawText = String(reader.result || ""), parsed = null;
        try { parsed = JSON.parse(rawText); } catch (ignore) {}
        results.push({ file: file, rawText: rawText, parsed: parsed });
        next();
      };
      reader.onerror = function () {
        results.push({ file: file, rawText: "", parsed: null, readError: true });
        next();
      };
      reader.readAsText(file, "UTF-8");
    }
    next();
  }

  function makeZipBlob(files) {
    var encoder = new TextEncoder(), crcTable = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      crcTable[n] = c >>> 0;
    }
    function crc32(bytes) {
      var crc = 0xFFFFFFFF;
      for (var i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    function put16(view, offset, value) { view.setUint16(offset, value, true); }
    function put32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }
    var localParts = [], centralParts = [], offset = 0;
    files.forEach(function (file) {
      var name = encoder.encode(file.name), data = encoder.encode(file.content), crc = crc32(data);
      var local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
      put32(lv, 0, 0x04034b50); put16(lv, 4, 20); put16(lv, 6, 0x0800); put16(lv, 8, 0);
      put16(lv, 10, 0); put16(lv, 12, 0); put32(lv, 14, crc); put32(lv, 18, data.length);
      put32(lv, 22, data.length); put16(lv, 26, name.length); put16(lv, 28, 0); local.set(name, 30);
      localParts.push(local, data);
      var central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
      put32(cv, 0, 0x02014b50); put16(cv, 4, 20); put16(cv, 6, 20); put16(cv, 8, 0x0800); put16(cv, 10, 0);
      put16(cv, 12, 0); put16(cv, 14, 0); put32(cv, 16, crc); put32(cv, 20, data.length);
      put32(cv, 24, data.length); put16(cv, 28, name.length); put16(cv, 30, 0); put16(cv, 32, 0);
      put16(cv, 34, 0); put16(cv, 36, 0); put32(cv, 38, 0); put32(cv, 42, offset); central.set(name, 46);
      centralParts.push(central); offset += local.length + data.length;
    });
    var centralSize = centralParts.reduce(function (sum, part) { return sum + part.length; }, 0);
    var end = new Uint8Array(22), ev = new DataView(end.buffer);
    put32(ev, 0, 0x06054b50); put16(ev, 4, 0); put16(ev, 6, 0);
    put16(ev, 8, files.length); put16(ev, 10, files.length);
    put32(ev, 12, centralSize); put32(ev, 16, offset); put16(ev, 20, 0);
    return new Blob(localParts.concat(centralParts, [end]), { type: "application/zip" });
  }
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function payloadForPair(key, entries) {
    var source = "", target = "";
    var codes = ["zh-CN","en","de","fr","es","it","el","tr","ar","ru","ja","fa"];
    for (var i = 0; i < codes.length; i++) {
      if (key.indexOf(codes[i] + "-") === 0) { source = codes[i]; target = key.slice(codes[i].length + 1); break; }
    }
    return { format: "texttranslator-dictionary", version: 1, sourceLanguage: source,
      targetLanguage: target, exportedAt: new Date().toISOString(), entries: entries };
  }
  function exportAllDictionaries() {
    dictionaryToolsResult.textContent = "در حال آماده‌سازی ZIP از همهٔ جفت‌زبان‌ها...";
    var files = [], index = 0, totalWords = 0;
    function nextPair() {
      if (index >= SUPPORTED_PAIRS.length) {
        files.push({ name: "README.txt", content: "TextTranslator dictionary backup\nContains one JSON file per supported language pair.\nImport each JSON file using the extension's multi-file Import option.\nPersonal entries, downloaded updates, and bundled starter entries are merged in each file.\n" });
        var blob = makeZipBlob(files);
        downloadBlob(blob, "texttranslator-all-dictionaries.zip");
        dictionaryToolsResult.textContent = "پشتیبان ZIP آماده شد: " + SUPPORTED_PAIRS.length + " دیکشنری، " + totalWords + " واژه. هر جفت‌زبان فایل JSON مستقل دارد و می‌توانی همهٔ فایل‌ها را باهم Import کنی.";
        return;
      }
      var key = SUPPORTED_PAIRS[index++];
      loadDictionaryForPair(key, function (entries) {
        var payload = payloadForPair(key, entries);
        totalWords += Object.keys(entries).length;
        files.push({ name: key + ".json", content: JSON.stringify(payload, null, 2) + "\n" });
        nextPair();
      });
    }
    nextPair();
  }
  exportDictionary.addEventListener("click", function () {
    var key = exportPairSelect.value;
    if (key === "__all_zip__") { exportAllDictionaries(); return; }
    if (SUPPORTED_PAIRS.indexOf(key) < 0) { dictionaryToolsResult.textContent = "یک جفت‌زبان معتبر برای خروجی انتخاب کن."; return; }
    loadDictionaryForPair(key, function (entries) {
      var payload = payloadForPair(key, entries);
      var blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, "texttranslator-" + key + ".json");
      dictionaryToolsResult.textContent = "خروجی " + Object.keys(entries).length + " واژه از " + key + " آماده شد. محل ذخیره را از پنجرهٔ دانلود مرورگر یا تنظیمات Chrome تعیین کن.";
    });
  });

  checkDictionary.addEventListener("click", function () {
    readSelectedFiles(importFile.files, function (files) {
      var messages = [];
      files.forEach(function (item) {
        if (item.readError) { messages.push(item.file.name + ": خواندن فایل ناموفق بود."); return; }
        var key = pairFromFile(item.file, item.parsed);
        var report = validateDictionaryText(item.rawText, key || null);
        messages.push(item.file.name + ": " + (report.ok
          ? "معتبر، " + report.count + " واژه" + (key ? "، جفت‌زبان " + key : "، جفت‌زبان از نام/فراداده تشخیص داده نشد")
          : "نامعتبر؛ " + (report.error || report.issues.join("؛ "))));
      });
      dictionaryToolsResult.textContent = messages.join(" | ");
    });
  });

  importDictionary.addEventListener("click", function () {
    readSelectedFiles(importFile.files, function (files) {
      var allReports = [], importable = [];
      files.forEach(function (item) {
        if (item.readError) { allReports.push(item.file.name + ": خطای خواندن"); return; }
        var key = pairFromFile(item.file, item.parsed);
        if (!key) { allReports.push(item.file.name + ": جفت‌زبان تشخیص داده نشد؛ نام فایل را مثل en-fa.json بگذار یا فرادادهٔ زبان داشته باشد."); return; }
        var report = validateDictionaryText(item.rawText, key);
        if (!report.ok) { allReports.push(item.file.name + ": رد شد؛ " + (report.error || report.issues.join("؛ "))); return; }
        importable.push({ file: item.file, key: key, entries: report.entries });
      });
      if (!importable.length) {
        dictionaryToolsResult.textContent = allReports.join(" | ") || "هیچ فایل معتبری برای واردکردن پیدا نشد.";
        return;
      }
      chrome.storage.local.get({ customDictionaries: {} }, function (saved) {
        var all = saved.customDictionaries || {}, added = 0, updated = 0, total = 0;
        importable.forEach(function (item) {
          var existing = all[item.key] || {};
          Object.keys(item.entries).forEach(function (word) {
            var normalized = word.trim().toLowerCase(), meaning = item.entries[word].trim();
            if (Object.prototype.hasOwnProperty.call(existing, normalized)) updated++;
            else added++;
            existing[normalized] = meaning;
            total++;
          });
          all[item.key] = existing;
          allReports.push(item.file.name + " → " + item.key + " (" + Object.keys(item.entries).length + " واژه)");
        });
        chrome.storage.local.set({ customDictionaries: all }, function () {
          loadOffline();
          dictionaryToolsResult.textContent = "Import تمام شد: " + importable.length + " فایل، " + added + " واژهٔ تازه، " + updated + " واژهٔ به‌روزشده. " + allReports.join(" | ");
        });
      });
    });
  });

  updateDictionary.addEventListener("click", function () {
    updateDictionary.disabled = true;
    dictionaryToolsResult.textContent = "در حال بررسی همهٔ بسته‌های به‌روزرسانی...";
    fetch(UPDATE_MANIFEST_URL, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("فهرست به‌روزرسانی HTTP " + response.status);
      return response.json();
    }).then(function (manifest) {
      chrome.storage.local.get({ dictionaryUpdateVersions: {}, updatedDictionaries: {} }, function (saved) {
        var versions = saved.dictionaryUpdateVersions || {};
        var allUpdates = saved.updatedDictionaries || {};
        var pairs = Object.keys(manifest && manifest.pairs || {});
        var changed = [], skipped = [], failures = [];
        function processPair(index) {
          if (index >= pairs.length) {
            chrome.storage.local.set({ updatedDictionaries: allUpdates, dictionaryUpdateVersions: versions }, function () {
              loadOffline();
              dictionaryToolsResult.textContent = changed.length
                ? "به‌روزرسانی انجام شد: " + changed.join("؛ ") + (skipped.length ? " | بدون تغییر: " + skipped.join("، ") : "") + (failures.length ? " | خطا: " + failures.join("؛ ") : "") + ". واژه‌های شخصی حفظ شدند."
                : "بستهٔ تازه‌ای برای دریافت نبود." + (skipped.length ? " نسخه‌های فعلی: " + skipped.join("، ") : "") + (failures.length ? " | خطا: " + failures.join("؛ ") : "");
              updateDictionary.disabled = false;
            });
            return;
          }
          var pair = pairs[index], info = manifest.pairs[pair], oldVersion = Number(versions[pair] || 0);
          if (!info || !info.file || !Number(info.version)) { failures.push(pair + ": اطلاعات بسته نامعتبر است"); processPair(index + 1); return; }
          if (Number(info.version) <= oldVersion) { skipped.push(pair + " نسخهٔ " + oldVersion); processPair(index + 1); return; }
          fetch(new URL(info.file, UPDATE_MANIFEST_URL).toString(), { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.text();
          }).then(function (rawText) {
            var report = validateDictionaryText(rawText, pair);
            if (!report.ok) throw new Error(report.error || report.issues.join("؛ "));
            var pairUpdates = allUpdates[pair] || {};
            Object.keys(report.entries).forEach(function (word) { pairUpdates[word.trim().toLowerCase()] = report.entries[word].trim(); });
            allUpdates[pair] = pairUpdates;
            versions[pair] = Number(info.version);
            changed.push(pair + " نسخهٔ " + info.version + " (" + report.count + " واژه)");
          }).catch(function (error) { failures.push(pair + ": " + error.message); }).then(function () { processPair(index + 1); });
        }
        processPair(0);
      });
    }).catch(function (error) {
      dictionaryToolsResult.textContent = "دریافت فهرست به‌روزرسانی ناموفق بود: " + error.message;
      updateDictionary.disabled = false;
    });
  });

  chrome.storage.local.get({
    textTranslatorEnabled: true, translateOnSelection: true, translateOnHover: true,
    onlineDictionaryUrl: DEFAULT_URL, dictionaryMode: "online",
    sourceLanguage: "en", targetLanguage: "fa", tooltipDurationSeconds: 2
  }, function (data) {
    render(data.textTranslatorEnabled !== false);
    endpoint.value = normalizeEndpoint(data.onlineDictionaryUrl || DEFAULT_URL);
    if (endpoint.value !== data.onlineDictionaryUrl) chrome.storage.local.set({ onlineDictionaryUrl: endpoint.value });
    dictionaryMode = data.dictionaryMode === "offline" ? "offline" : "online";
    sourceLanguage = LANGUAGE_NAMES[data.sourceLanguage] ? data.sourceLanguage : "en";
    targetLanguage = LANGUAGE_NAMES[data.targetLanguage] ? data.targetLanguage : "fa";
    sourceSelect.value = sourceLanguage; targetSelect.value = targetLanguage;
    exportPairSelect.value = "en-fa";
    displayDuration.value = String(Number(data.tooltipDurationSeconds) >= 1 && Number(data.tooltipDurationSeconds) <= 60 ? Math.floor(Number(data.tooltipDurationSeconds)) : 2);
    selectionToggle.checked = data.translateOnSelection !== false;
    hoverToggle.checked = data.translateOnHover !== false;
    renderMode(); loadOffline();
  });

  toggle.addEventListener("click", function () {
    chrome.storage.local.get({ textTranslatorEnabled: true }, function (data) {
      var nextEnabled = data.textTranslatorEnabled === false;
      chrome.storage.local.set({ textTranslatorEnabled: nextEnabled }, function () { render(nextEnabled); });
    });
  });
  displayDuration.addEventListener("change", function () {
    var seconds = Number(displayDuration.value);
    if (!isFinite(seconds) || seconds < 1) seconds = 1;
    if (seconds > 60) seconds = 60;
    seconds = Math.floor(seconds);
    displayDuration.value = String(seconds);
    chrome.storage.local.set({ tooltipDurationSeconds: seconds }, function () {
      result.textContent = "مدت نمایش معنی روی " + seconds + " ثانیه تنظیم شد.";
    });
  });
  selectionToggle.addEventListener("change", function () {
    chrome.storage.local.set({ translateOnSelection: selectionToggle.checked }, function () {
      setResult(selectionToggle.checked ? "ترجمه با انتخاب متن فعال شد." : "ترجمه با انتخاب متن خاموش شد.", "info");
    });
  });
  hoverToggle.addEventListener("change", function () {
    chrome.storage.local.set({ translateOnHover: hoverToggle.checked }, function () {
      setResult(hoverToggle.checked ? "ترجمه با حرکت ماوس فعال شد." : "ترجمه با حرکت ماوس خاموش شد.", "info");
    });
  });
  modeToggle.addEventListener("click", function () {
    dictionaryMode = dictionaryMode === "online" ? "offline" : "online";
    chrome.storage.local.set({ dictionaryMode: dictionaryMode }, function () {
      renderMode();
      result.textContent = dictionaryMode === "online" ? "حالت آنلاین فعال شد." : "حالت آفلاین فعال شد.";
      currentMeaning = ""; saveWord.disabled = true;
    });
  });
  saveLanguages.addEventListener("click", function () {
    sourceLanguage = sourceSelect.value; targetLanguage = targetSelect.value;
    chrome.storage.local.set({ sourceLanguage: sourceLanguage, targetLanguage: targetLanguage }, function () {
      loadOffline(); currentMeaning = ""; saveWord.disabled = true;
      result.textContent = "زبان‌ها اعمال شدند: " + LANGUAGE_NAMES[sourceLanguage] + " ← " + LANGUAGE_NAMES[targetLanguage] + ". واژه‌نامهٔ این جفت‌زبان جداست.";
    });
  });
  lookup.addEventListener("click", runLookup);
  wordInput.addEventListener("keydown", function (event) { if (event.key === "Enter") runLookup(); });
  saveWord.addEventListener("click", function () {
    hideSaveNotice();
    if (!currentWord || !currentMeaning) return;
    var wordToSave = currentWord.toLowerCase(), meaningToSave = currentMeaning, key = pairKey();
    chrome.storage.local.get({ customDictionaries: {} }, function (data) {
      var dictionaries = data.customDictionaries || {};
      if (!dictionaries[key]) dictionaries[key] = {};
      dictionaries[key][wordToSave] = meaningToSave;
      chrome.storage.local.set({ customDictionaries: dictionaries }, function () {
        if (chrome.runtime.lastError) { var manualSaveError = "ذخیره‌سازی انجام نشد؛ دوباره تلاش کن."; setResult(manualSaveError, "error"); showSaveNotice(manualSaveError, true); return; }
        offline[wordToSave] = meaningToSave; offlineLoaded = true;
        setResult("＋ ذخیره شد! معنی در دیکشنری آفلاین «" + key + "» ذخیره شد.", "info");
        saveWord.disabled = true;
      });
    });
  });
  saveEndpoint.addEventListener("click", function () {
    var urlText = normalizeEndpoint(endpoint.value.trim()), pattern = getHostPattern(urlText);
    endpoint.value = urlText;
    if (!pattern) {
      result.textContent = "آدرس باید HTTP/HTTPS باشد و {word}، {source} و {target} را داشته باشد."; return;
    }
    chrome.permissions.request({ origins: [pattern] }, function (granted) {
      if (!granted) { result.textContent = "برای این آدرس اجازه داده نشد؛ آدرس ذخیره نشد."; return; }
      chrome.storage.local.set({ onlineDictionaryUrl: urlText }, function () { result.textContent = "آدرس دیکشنری آنلاین ذخیره شد."; });
    });
  });
});