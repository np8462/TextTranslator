var DEFAULT_URL = "https://api.mymemory.translated.net/get?q={word}&langpair=en|fa";

document.addEventListener("DOMContentLoaded", function () {
  var status = document.getElementById("status");
  var toggle = document.getElementById("toggle");
  var wordInput = document.getElementById("word");
  var lookup = document.getElementById("lookup");
  var result = document.getElementById("result");
  var saveWord = document.getElementById("save-word");
  var endpoint = document.getElementById("endpoint");
  var saveEndpoint = document.getElementById("save-endpoint");
  var currentWord = "";
  var currentMeaning = "";
  var offline = {};

  function render(enabled) {
    status.textContent = enabled ? "وضعیت: افزونه فعال است." : "وضعیت: افزونه خاموش است.";
    toggle.textContent = enabled ? "خاموش کردن افزونه" : "فعال کردن افزونه";
    toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  }

  function getHostPattern(urlText) {
    try {
      var parsed = new URL(urlText.replace("{word}", "hello"));
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      return parsed.origin + "/*";
    } catch (e) { return null; }
  }

  function requestOnline(word) {
    var urlText = endpoint.value.trim() || DEFAULT_URL;
    var pattern = getHostPattern(urlText);
    if (!pattern || urlText.indexOf("{word}") === -1) {
      result.textContent = "آدرس نامعتبر است؛ باید یک آدرس HTTP/HTTPS و جای‌نگهدار {word} داشته باشد.";
      return;
    }
    chrome.permissions.request({ origins: [pattern] }, function (granted) {
      if (!granted) {
        result.textContent = "اجازهٔ دسترسی به این سرویس داده نشد.";
        return;
      }
      chrome.storage.local.set({ onlineDictionaryUrl: urlText }, function () {
        chrome.runtime.sendMessage({ type: "ONLINE_LOOKUP", word: word }, function (response) {
        if (chrome.runtime.lastError) {
          result.textContent = "خطا در ارتباط با افزونهٔ پس‌زمینه: " + chrome.runtime.lastError.message;
          return;
        }
        if (!response || !response.ok) {
          result.textContent = response && response.error ? response.error : "معنی آنلاین پیدا نشد.";
          return;
        }
        currentWord = word;
        currentMeaning = response.meaning;
        result.textContent = "معنی آنلاین: " + currentMeaning;
        saveWord.disabled = false;
        });
      });
    });
  }

  chrome.storage.local.get({ textTranslatorEnabled: true, onlineDictionaryUrl: DEFAULT_URL, customDictionary: {} }, function (data) {
    render(data.textTranslatorEnabled !== false);
    endpoint.value = data.onlineDictionaryUrl || DEFAULT_URL;
    chrome.storage.local.get(null, function () {});
  });

  fetch(chrome.runtime.getURL("dictionary.json")).then(function (r) { return r.json(); }).then(function (data) {
    offline = data || {};
  }).catch(function () {});

  chrome.storage.local.get({ customDictionary: {} }, function (data) {
    Object.keys(data.customDictionary || {}).forEach(function (key) { offline[key.toLowerCase()] = data.customDictionary[key]; });
  });

  toggle.addEventListener("click", function () {
    chrome.storage.local.get({ textTranslatorEnabled: true }, function (data) {
      var nextEnabled = data.textTranslatorEnabled === false;
      chrome.storage.local.set({ textTranslatorEnabled: nextEnabled }, function () { render(nextEnabled); });
    });
  });

  lookup.addEventListener("click", function () {
    var word = wordInput.value.trim().toLowerCase();
    if (!/^[a-z][a-z'-]{0,39}$/.test(word)) {
      result.textContent = "لطفاً یک کلمهٔ انگلیسی معتبر وارد کن.";
      saveWord.disabled = true;
      return;
    }
    currentWord = word;
    currentMeaning = "";
    saveWord.disabled = true;
    var localMeaning = offline[word];
    if (localMeaning) {
      currentMeaning = localMeaning;
      result.textContent = "معنی آفلاین: " + localMeaning;
      saveWord.disabled = false;
    } else {
      result.textContent = "در آفلاین نبود؛ در حال جست‌وجوی آنلاین...";
      requestOnline(word);
    }
  });

  saveWord.addEventListener("click", function () {
    if (!currentWord || !currentMeaning) return;
    chrome.storage.local.get({ customDictionary: {} }, function (data) {
      var saved = data.customDictionary || {};
      saved[currentWord] = currentMeaning;
      chrome.storage.local.set({ customDictionary: saved }, function () {
        offline[currentWord] = currentMeaning;
        result.textContent = "ذخیره شد؛ از این پس این معنی آفلاین هم در دسترس است.";
        saveWord.disabled = true;
      });
    });
  });

  saveEndpoint.addEventListener("click", function () {
    var urlText = endpoint.value.trim();
    if (!getHostPattern(urlText) || urlText.indexOf("{word}") === -1) {
      result.textContent = "آدرس معتبر نیست یا {word} ندارد.";
      return;
    }
    var pattern = getHostPattern(urlText);
    chrome.permissions.request({ origins: [pattern] }, function (granted) {
      if (!granted) {
        result.textContent = "برای این آدرس اجازه داده نشد؛ آدرس ذخیره نشد.";
        return;
      }
      chrome.storage.local.set({ onlineDictionaryUrl: urlText }, function () {
        result.textContent = "آدرس دیکشنری آنلاین ذخیره شد.";
      });
    });
  });
});
