var DEFAULT_DICTIONARY_URL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={word}";
var inFlight = {};

function cacheKey(source, target, word) {
  return source + "|" + target + "|" + String(word || "").toLowerCase();
}

function respondWithOnlineMeaning(message, meaning, extras, sendResponse) {
  var source = message.source || "en";
  var target = message.target || "fa";
  var pair = source + "-" + target;
  var word = String(message.word || "").trim();
  var normalized = word.toLowerCase();

  function hasWord(entries) {
    var keys = Object.keys(entries || {});
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === normalized && typeof entries[keys[i]] === "string" && entries[keys[i]].trim()) return true;
    }
    return false;
  }
  function finish(autoSaved, alreadyOffline, saveFailed) {
    var response = { ok: true, word: word, meaning: meaning, autoSaved: autoSaved, alreadyOffline: alreadyOffline };
    Object.keys(extras || {}).forEach(function (key) { response[key] = extras[key]; });
    if (saveFailed) response.saveFailed = true;
    sendResponse(response);
  }

  fetch(chrome.runtime.getURL("dictionaries/" + pair + ".json")).then(function (response) {
    if (!response.ok) return {};
    return response.json();
  }).catch(function () { return {}; }).then(function (seeded) {
    chrome.storage.local.get({ customDictionaries: {}, customDictionary: {}, updatedDictionaries: {} }, function (saved) {
      var allCustom = saved.customDictionaries || {};
      var pairCustom = allCustom[pair] || {};
      var pairUpdated = (saved.updatedDictionaries || {})[pair] || {};
      var legacy = pair === "en-fa" ? (saved.customDictionary || {}) : {};
      if (hasWord(seeded) || hasWord(pairUpdated) || hasWord(pairCustom) || hasWord(legacy)) {
        finish(false, true, false);
        return;
      }
      if (!allCustom[pair]) allCustom[pair] = {};
      allCustom[pair][normalized] = meaning;
      chrome.storage.local.set({ customDictionaries: allCustom }, function () {
        if (chrome.runtime.lastError) finish(false, false, true);
        else finish(true, false, false);
      });
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
    respondWithOnlineMeaning(message, meaning, { provider: "mymemory", fallbackProvider: true }, sendResponse);
  }).catch(function (secondaryError) {
    var combined = reason + " سرویس جایگزین هم موفق نشد؛ " +
      (secondaryError && secondaryError.message ? secondaryError.message : "خطای نامشخص") +
      ". چون حالت آنلاین فعال است، معنی آفلاین جایگزین نمی‌شود.";
    sendResponse({ ok: false, error: combined });
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
      respondWithOnlineMeaning(message, cached.meaning, { cached: true }, sendResponse);
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
        sendResponse({ ok: false, error: "پاسخ سرویس آنلاین معنی قابل‌خواندن نداشت؛ در حالت آنلاین از معنی آفلاین استفاده نمی‌شود." });
        return;
      }
      meaning = meaning.trim();
      if (word.toLowerCase() === "apple" && source === "en" && target === "fa" && /^(apple|اپل)(\s+(inc\.?|شرکت|برند))?$/i.test(meaning)) meaning = "سیب";
      var cache = settings.onlineMeaningCache || {};
      cache[key] = { meaning: meaning, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
      chrome.storage.local.set({ onlineMeaningCache: cache, onlineCooldownUntil: 0 });
      respondWithOnlineMeaning(message, meaning, {}, sendResponse);
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
