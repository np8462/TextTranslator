var DEFAULT_URL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={word}";
var LANGUAGE_NAMES = { en: "انگلیسی", de: "آلمانی", fr: "فرانسوی", es: "اسپانیایی", it: "ایتالیایی", tr: "ترکی", ar: "عربی", ru: "روسی", ja: "ژاپنی", "zh-CN": "چینی ساده‌شده", fa: "فارسی" };

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
  var currentWord = "";
  var currentMeaning = "";
  var dictionaryMode = "online";
  var sourceLanguage = "en";
  var targetLanguage = "fa";
  var offline = {};
  var baseOffline = {};
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
          showMeaning(word, response.meaning, "online");
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
    if (sourceLanguage === "en" && targetLanguage === "fa") {
      Object.keys(baseOffline).forEach(function (key) { offline[key] = baseOffline[key]; });
    }
    chrome.storage.local.get({ customDictionaries: {}, customDictionary: {} }, function (saved) {
      var dictionaries = saved.customDictionaries || {};
      if (!dictionaries["en-fa"] && saved.customDictionary && Object.keys(saved.customDictionary).length) {
        dictionaries["en-fa"] = saved.customDictionary;
        chrome.storage.local.set({ customDictionaries: dictionaries });
      }
      var pairWords = dictionaries[pairKey()] || {};
      Object.keys(pairWords).forEach(function (key) {
        if (typeof pairWords[key] === "string") offline[key.toLowerCase()] = pairWords[key];
      });
      offlineLoaded = true;
    });
  }
  fetch(chrome.runtime.getURL("dictionary.json")).then(function (response) {
    if (!response.ok) throw new Error("dictionary load failed");
    return response.json();
  }).then(function (data) {
    Object.keys(data || {}).forEach(function (key) { if (typeof data[key] === "string") baseOffline[key.toLowerCase()] = data[key]; });
    loadOffline();
  }).catch(function () { loadOffline(); });

  chrome.storage.local.get({
    textTranslatorEnabled: true, onlineDictionaryUrl: DEFAULT_URL, dictionaryMode: "online",
    sourceLanguage: "en", targetLanguage: "fa"
  }, function (data) {
    render(data.textTranslatorEnabled !== false);
    endpoint.value = normalizeEndpoint(data.onlineDictionaryUrl || DEFAULT_URL);
    if (endpoint.value !== data.onlineDictionaryUrl) chrome.storage.local.set({ onlineDictionaryUrl: endpoint.value });
    dictionaryMode = data.dictionaryMode === "offline" ? "offline" : "online";
    sourceLanguage = LANGUAGE_NAMES[data.sourceLanguage] ? data.sourceLanguage : "en";
    targetLanguage = LANGUAGE_NAMES[data.targetLanguage] ? data.targetLanguage : "fa";
    sourceSelect.value = sourceLanguage; targetSelect.value = targetLanguage;
    renderMode(); loadOffline();
  });

  toggle.addEventListener("click", function () {
    chrome.storage.local.get({ textTranslatorEnabled: true }, function (data) {
      var nextEnabled = data.textTranslatorEnabled === false;
      chrome.storage.local.set({ textTranslatorEnabled: nextEnabled }, function () { render(nextEnabled); });
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
        result.textContent = "＋ ذخیره شد! این واژه در دیکشنری آفلاین همین جفت‌زبان هم موجود است.";
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