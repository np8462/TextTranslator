var DEFAULT_DICTIONARY_URL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={word}";
var inFlight = {};

function cacheKey(source, target, word) {
  return source + "|" + target + "|" + String(word || "").toLowerCase();
}

function sendOfflineFallback(message, reason, sendResponse) {
  var source = message.source || "en";
  var target = message.target || "fa";
  var pair = source + "-" + target;
  var word = String(message.word || "").toLowerCase();
  chrome.storage.local.get({ customDictionaries: {}, updatedDictionaries: {} }, function (saved) {
    var custom = (saved.customDictionaries || {})[pair] || {};
    var customMeaning = custom[word];
    if (typeof customMeaning === "string" && customMeaning) {
      sendResponse({ ok: true, word: message.word, meaning: customMeaning, offlineFallback: true });
      return;
    }
    fetch(chrome.runtime.getURL("dictionaries/" + pair + ".json")).then(function (response) {
      if (!response.ok) throw new Error("pair dictionary not found");
      return response.json();
    }).then(function (dict) {
      var updated = (saved.updatedDictionaries || {})[pair] || {};
      var meaning = Object.prototype.hasOwnProperty.call(updated, word) ? updated[word] : (dict && dict[word]);
      if (typeof meaning === "string" && meaning) {
        sendResponse({ ok: true, word: message.word, meaning: meaning, offlineFallback: true });
      } else {
        sendResponse({ ok: false, error: reason || "معنی آنلاین در دسترس نیست و این واژه در دیکشنری آفلاین این جفت‌زبان هم وجود ندارد." });
      }
    }).catch(function () {
      sendResponse({ ok: false, error: reason || "سرویس آنلاین در دسترس نیست و فایل دیکشنری آفلاین بارگذاری نشد." });
    });
  });
}

function trySecondaryOnline(message, reason, sendResponse) {
  var source = message.source || "en";
  var target = message.target || "fa";
  var word = String(message.word || "").trim();
  var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(word) +
    "&langpair=" + encodeURIComponent(source + "|" + target) + "&mt=1";
  fetch(url, { headers: { "Accept": "application/json" } }).then(function (response) {
    if (!response.ok) throw new Error("MyMemory HTTP " + response.status);
    return response.json();
  }).then(function (data) {
    var meaning = data && data.responseData && data.responseData.translatedText;
    if (Number(data && data.responseStatus) !== 200 || typeof meaning !== "string" ||
        !meaning.trim() || meaning.trim().toLowerCase() === word.toLowerCase()) {
      throw new Error(data && data.responseDetails ? data.responseDetails : "MyMemory did not return a translation");
    }
    meaning = meaning.trim();
    var key = cacheKey(source, target, word);
    chrome.storage.local.get({ onlineMeaningCache: {} }, function (saved) {
      var cache = saved.onlineMeaningCache || {};
      cache[key] = { meaning: meaning, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
      chrome.storage.local.set({ onlineMeaningCache: cache });
    });
    sendResponse({ ok: true, word: word, meaning: meaning, provider: "mymemory", fallbackProvider: true });
  }).catch(function (secondaryError) {
    var combined = reason + " سرویس جایگزین هم موفق نشد؛ " +
      (secondaryError && secondaryError.message ? secondaryError.message : "خطای نامشخص") +
      ". دیکشنری آفلاین بررسی می‌شود.";
    sendOfflineFallback(message, combined, sendResponse);
  });
}

function performLookup(message, sendResponse) {
  var source = message.source || "en";
  var target = message.target || "fa";
  var word = String(message.word || "").trim();
  var key = cacheKey(source, target, word);
  chrome.storage.local.get({ onlineDictionaryUrl: DEFAULT_DICTIONARY_URL, onlineMeaningCache: {}, onlineCooldownUntil: 0 }, function (settings) {
    var cached = settings.onlineMeaningCache[key];
    if (cached && cached.meaning && cached.expiresAt > Date.now()) {
      sendResponse({ ok: true, word: word, meaning: cached.meaning, cached: true });
      return;
    }
    if (settings.onlineCooldownUntil > Date.now()) {
      trySecondaryOnline(message, "سرویس اصلی آنلاین موقتاً در محدودیت است.", sendResponse);
      return;
    }
    var template = (settings.onlineDictionaryUrl || DEFAULT_DICTIONARY_URL).trim();
    if (template.indexOf("{word}") === -1 || template.indexOf("{source}") === -1 || template.indexOf("{target}") === -1) {
      template = DEFAULT_DICTIONARY_URL;
      chrome.storage.local.set({ onlineDictionaryUrl: DEFAULT_DICTIONARY_URL });
    }
    var url = template.replace(/\{word\}/g, encodeURIComponent(word))
      .replace(/\{source\}/g, encodeURIComponent(source))
      .replace(/\{target\}/g, encodeURIComponent(target));
    fetch(url, { headers: { "Accept": "application/json" } }).then(function (response) {
      if (!response.ok) {
        var error = new Error("HTTP " + response.status);
        error.status = response.status;
        throw error;
      }
      return response.json();
    }).then(function (data) {
      var meaning = "";
      if (Array.isArray(data) && Array.isArray(data[0])) {
        data[0].forEach(function (part) {
          if (Array.isArray(part) && typeof part[0] === "string") meaning += part[0];
        });
      }
      if (!meaning && data && data.responseData) meaning = data.responseData.translatedText || "";
      if (!meaning && data) meaning = data.meaning || data.translation || data.translatedText || "";
      if (typeof meaning !== "string" || !meaning.trim()) {
        sendOfflineFallback(message, "پاسخ سرویس آنلاین معنی قابل‌خواندن نداشت؛ دیکشنری آفلاین بررسی شد.", sendResponse);
        return;
      }
      meaning = meaning.trim();
      if (word.toLowerCase() === "apple" && source === "en" && target === "fa" && /^(apple|اپل)(\s+(inc\.?|شرکت|برند))?$/i.test(meaning)) meaning = "سیب";
      var cache = settings.onlineMeaningCache || {};
      cache[key] = { meaning: meaning, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
      chrome.storage.local.set({ onlineMeaningCache: cache, onlineCooldownUntil: 0 });
      sendResponse({ ok: true, word: word, meaning: meaning });
    }).catch(function (error) {
      if (error && error.status === 429) {
        chrome.storage.local.set({ onlineCooldownUntil: Date.now() + 60 * 1000 });
        trySecondaryOnline(message, "سرویس اصلی آنلاین درخواست‌ها را محدود کرده (HTTP 429).", sendResponse);
      } else {
        trySecondaryOnline(message, "ارتباط با سرویس اصلی آنلاین ناموفق بود: " + (error && error.message ? error.message : "خطای شبکه") + ".", sendResponse);
      }
    });
  });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== "ONLINE_LOOKUP") return;
  var source = message.source || "en";
  var target = message.target || "fa";
  var word = String(message.word || "").trim();
  var key = cacheKey(source, target, word);
  if (inFlight[key]) {
    inFlight[key].push(sendResponse);
    return true;
  }
  inFlight[key] = [sendResponse];
  performLookup(message, function (response) {
    var callbacks = inFlight[key] || [];
    delete inFlight[key];
    callbacks.forEach(function (callback) { try { callback(response); } catch (e) {} });
  });
  return true;
});
