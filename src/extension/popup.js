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
  var saveWord = document.getElementById("save-word");
  var endpoint = document.getElementById("endpoint");
  var saveEndpoint = document.getElementById("save-endpoint");
  var displayDuration = document.getElementById("display-duration");
  var dictionaryToolsResult = document.getElementById("dictionary-tools-result");
  var importFile = document.getElementById("import-file");
  var exportDictionary = document.getElementById("export-dictionary");
  var importDictionary = document.getElementById("import-dictionary");
  var checkDictionary = document.getElementById("check-dictionary");
  var updateDictionary = document.getElementById("update-dictionary");
  var currentWord = "";
  var currentMeaning = "";
  var dictionaryMode = "online";
  var sourceLanguage = "en";
  var targetLanguage = "fa";
  var offline = {};
  var offlineLoaded = false;

  function pairKey() { return sourceLanguage + "-" + targetLanguage; }
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
    if (!word || word.length > 40 || /\s/.test(word)) {
      result.textContent = "لطفاً یک واژهٔ منفرد و حداکثر ۴۰ نویسه‌ای وارد کن.";
      saveWord.disabled = true;
      return "";
    }
    return word;
  }
  function showMeaning(word, meaning, source) {
    currentWord = word;
    currentMeaning = meaning;
    result.textContent = (source === "online" ? "معنی آنلاین: " : "معنی آفلاین: ") + meaning;
    saveWord.disabled = source !== "online";
  }
  function lookupOfflineWord(word) {
    if (!offlineLoaded) {
      result.textContent = "واژه‌نامهٔ آفلاین در حال بارگذاری است؛ یک لحظه دیگر امتحان کن.";
      return;
    }
    var meaning = offline[word.toLowerCase()];
    if (meaning) showMeaning(word, meaning, "offline");
    else {
      currentWord = word; currentMeaning = ""; saveWord.disabled = true;
      result.textContent = "این واژه در دیکشنری آفلاین «" + LANGUAGE_NAMES[sourceLanguage] + " به " + LANGUAGE_NAMES[targetLanguage] + "» نیست.";
    }
  }
  function lookupOnlineWord(word) {
    var urlText = normalizeEndpoint(endpoint.value.trim());
    endpoint.value = urlText;
    var pattern = getHostPattern(urlText);
    if (!pattern) {
      result.textContent = "آدرس نامعتبر است؛ باید HTTP/HTTPS باشد و {word}، {source} و {target} را داشته باشد.";
      saveWord.disabled = true; return;
    }
    currentWord = word; currentMeaning = ""; saveWord.disabled = true;
    result.textContent = "در حال جست‌وجوی آنلاین...";
    chrome.permissions.request({ origins: [pattern] }, function (granted) {
      if (!granted) { result.textContent = "اجازهٔ دسترسی به این سرویس داده نشد."; return; }
      chrome.storage.local.set({ onlineDictionaryUrl: urlText }, function () {
        chrome.runtime.sendMessage({ type: "ONLINE_LOOKUP", word: word, source: sourceLanguage, target: targetLanguage }, function (response) {
          if (chrome.runtime.lastError) { result.textContent = "خطا در ارتباط با افزونهٔ پس‌زمینه: " + chrome.runtime.lastError.message; return; }
          if (!response || !response.ok) { result.textContent = response && response.error ? response.error : "معنی آنلاین پیدا نشد."; return; }
          showMeaning(word, response.meaning, response.offlineFallback ? "offline" : "online");
        });
      });
    });
  }
  function runLookup() {
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
      if (parsed.sourceLanguage && parsed.targetLanguage &&
          parsed.sourceLanguage + "-" + parsed.targetLanguage !== expectedPair) {
        return { ok: false, error: "جفت‌زبان فایل (" + parsed.sourceLanguage + "-" + parsed.targetLanguage + ") با جفت‌زبان انتخاب‌شده (" + expectedPair + ") یکسان نیست." };
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

  function readSelectedFile(callback) {
    var file = importFile.files && importFile.files[0];
    if (!file) { dictionaryToolsResult.textContent = "ابتدا یک فایل JSON انتخاب کن."; return; }
    var reader = new FileReader();
    reader.onload = function () { callback(String(reader.result || "")); };
    reader.onerror = function () { dictionaryToolsResult.textContent = "خواندن فایل ناموفق بود."; };
    reader.readAsText(file, "UTF-8");
  }

  exportDictionary.addEventListener("click", function () {
    if (!offlineLoaded) { dictionaryToolsResult.textContent = "دیکشنری هنوز بارگذاری نشده؛ کمی صبر کن."; return; }
    var payload = { format: "texttranslator-dictionary", version: 1, sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage, exportedAt: new Date().toISOString(), entries: offline };
    var blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = "texttranslator-" + pairKey() + ".json";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    dictionaryToolsResult.textContent = "خروجی " + Object.keys(offline).length + " واژه از جفت‌زبان " + pairKey() + " آماده شد.";
  });

  checkDictionary.addEventListener("click", function () {
    if (!offlineLoaded) { dictionaryToolsResult.textContent = "دیکشنری هنوز بارگذاری نشده؛ کمی صبر کن."; return; }
    var report = validateDictionaryText(JSON.stringify(offline), pairKey());
    dictionaryToolsResult.textContent = report.ok
      ? "بررسی موفق: " + report.count + " واژه، معنی‌های متنی و غیرخالی، بدون کلید تکراری."
      : "موارد نیازمند اصلاح: " + report.issues.join("؛ ");
  });

  importDictionary.addEventListener("click", function () {
    readSelectedFile(function (rawText) {
      var report = validateDictionaryText(rawText, pairKey());
      if (!report.ok) {
        dictionaryToolsResult.textContent = "فایل وارد نشد. " + (report.error || report.issues.join("؛ "));
        return;
      }
      var imported = report.entries;
      chrome.storage.local.get({ customDictionaries: {} }, function (saved) {
        var all = saved.customDictionaries || {}, existing = all[pairKey()] || {}, added = 0, conflicts = 0;
        Object.keys(imported).forEach(function (word) {
          var normalized = word.trim().toLowerCase(), meaning = imported[word];
          if (Object.prototype.hasOwnProperty.call(existing, normalized)) { conflicts++; return; }
          existing[normalized] = meaning.trim(); added++;
        });
        all[pairKey()] = existing;
        chrome.storage.local.set({ customDictionaries: all }, function () {
          loadOffline();
          dictionaryToolsResult.textContent = "واردکردن موفق: " + added + " واژهٔ تازه اضافه شد؛ " + conflicts + " واژهٔ هم‌نام موجود حفظ شد. جفت‌زبان: " + pairKey() + ".";
        });
      });
    });
  });

  updateDictionary.addEventListener("click", function () {
    updateDictionary.disabled = true;
    dictionaryToolsResult.textContent = "در حال بررسی مخزن به‌روزرسانی...";
    fetch(UPDATE_MANIFEST_URL, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("فهرست به‌روزرسانی HTTP " + response.status);
      return response.json();
    }).then(function (manifest) {
      var pair = pairKey(), info = manifest && manifest.pairs && manifest.pairs[pair];
      if (!info || !info.file || !Number(info.version)) throw new Error("فعلاً به‌روزرسانی منتشرشده‌ای برای جفت‌زبان " + pair + " وجود ندارد.");
      chrome.storage.local.get({ dictionaryUpdateVersions: {}, updatedDictionaries: {} }, function (saved) {
        var versions = saved.dictionaryUpdateVersions || {}, oldVersion = Number(versions[pair] || 0);
        if (Number(info.version) <= oldVersion) {
          dictionaryToolsResult.textContent = "این جفت‌زبان از قبل به‌روز است (نسخهٔ " + oldVersion + ").";
          updateDictionary.disabled = false;
          return;
        }
        var fileUrl = new URL(info.file, UPDATE_MANIFEST_URL).toString();
        fetch(fileUrl, { cache: "no-store" }).then(function (response) {
          if (!response.ok) throw new Error("فایل واژه‌ها HTTP " + response.status);
          return response.text();
        }).then(function (rawText) {
          var report = validateDictionaryText(rawText, pair);
          if (!report.ok) throw new Error("بررسی کیفیت به‌روزرسانی رد شد: " + (report.error || report.issues.join("؛ ")));
          var allUpdates = saved.updatedDictionaries || {}, pairUpdates = allUpdates[pair] || {};
          Object.keys(report.entries).forEach(function (word) { pairUpdates[word.trim().toLowerCase()] = report.entries[word].trim(); });
          allUpdates[pair] = pairUpdates;
          versions[pair] = Number(info.version);
          chrome.storage.local.set({ updatedDictionaries: allUpdates, dictionaryUpdateVersions: versions }, function () {
            loadOffline();
            dictionaryToolsResult.textContent = "به‌روزرسانی موفق: نسخهٔ " + info.version + " برای " + pair + "؛ " + report.count + " واژه بررسی شد. واژه‌های شخصی شما حفظ شدند.";
            updateDictionary.disabled = false;
          });
        }).catch(function (error) {
          dictionaryToolsResult.textContent = "به‌روزرسانی انجام نشد: " + error.message;
          updateDictionary.disabled = false;
        });
      });
    }).catch(function (error) {
      dictionaryToolsResult.textContent = "دریافت به‌روزرسانی ناموفق بود: " + error.message;
      updateDictionary.disabled = false;
    });
  });

  chrome.storage.local.get({
    textTranslatorEnabled: true, onlineDictionaryUrl: DEFAULT_URL, dictionaryMode: "online",
    sourceLanguage: "en", targetLanguage: "fa", tooltipDurationSeconds: 2
  }, function (data) {
    render(data.textTranslatorEnabled !== false);
    endpoint.value = normalizeEndpoint(data.onlineDictionaryUrl || DEFAULT_URL);
    if (endpoint.value !== data.onlineDictionaryUrl) chrome.storage.local.set({ onlineDictionaryUrl: endpoint.value });
    dictionaryMode = data.dictionaryMode === "offline" ? "offline" : "online";
    sourceLanguage = LANGUAGE_NAMES[data.sourceLanguage] ? data.sourceLanguage : "en";
    targetLanguage = LANGUAGE_NAMES[data.targetLanguage] ? data.targetLanguage : "fa";
    sourceSelect.value = sourceLanguage; targetSelect.value = targetLanguage;
    displayDuration.value = String(Number(data.tooltipDurationSeconds) >= 1 && Number(data.tooltipDurationSeconds) <= 60 ? Math.floor(Number(data.tooltipDurationSeconds)) : 2);
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
    if (!currentWord || !currentMeaning) return;
    var wordToSave = currentWord.toLowerCase(), meaningToSave = currentMeaning, key = pairKey();
    chrome.storage.local.get({ customDictionaries: {} }, function (data) {
      var dictionaries = data.customDictionaries || {};
      if (!dictionaries[key]) dictionaries[key] = {};
      dictionaries[key][wordToSave] = meaningToSave;
      chrome.storage.local.set({ customDictionaries: dictionaries }, function () {
        offline[wordToSave] = meaningToSave; offlineLoaded = true;
        result.textContent = "＋ ذخیره شد! معنی در دیکشنری آفلاین «" + key + "» ذخیره شد.";
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