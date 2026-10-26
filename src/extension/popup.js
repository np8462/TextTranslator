var DEFAULT_URL = "https://api.mymemory.translated.net/get?q={word}&langpair=en|fa";

document.addEventListener("DOMContentLoaded", function () {
  var status = document.getElementById("status");
  var toggle = document.getElementById("toggle");
  var wordInput = document.getElementById("word");
  var lookupOffline = document.getElementById("lookup-offline");
  var lookupOnline = document.getElementById("lookup-online");
  var result = document.getElementById("result");
  var saveWord = document.getElementById("save-word");
  var endpoint = document.getElementById("endpoint");
  var saveEndpoint = document.getElementById("save-endpoint");
  var currentWord = "";
  var currentMeaning = "";
  var offline = {};
  var offlineLoaded = false;

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

  function validWord() {
    var word = wordInput.value.trim().toLowerCase();
    if (!/^[a-z][a-z'-]{0,39}$/.test(word)) {
      result.textContent = "لطفاً یک کلمهٔ انگلیسی معتبر وارد کن.";
      saveWord.disabled = true;
      return "";
    }
    return word;
  }

  function showMeaning(word, meaning, source) {
    currentWord = word;
    currentMeaning = meaning;
    result.textContent = (source === "online" ? "معنی آنلاین: " : "معنی آفلاین: ") + meaning;
    saveWord.disabled = false;
  }

  function lookupOfflineWord() {
    var word = validWord();
    if (!word) return;
    if (!offlineLoaded) {
      result.textContent = "واژه‌نامهٔ آفلاین هنوز در حال بارگذاری است؛ یک لحظه دیگر امتحان کن.";
      return;
    }
    if (offline[word]) {
      showMeaning(word, offline[word], "offline");
    } else {
      currentWord = word;
      currentMeaning = "";
      saveWord.disabled = true;
      result.textContent = "این کلمه در دیکشنری آفلاین نیست. دکمهٔ جست‌وجوی آنلاین را بزن.";
    }
  }

  function lookupOnlineWord() {
    var word = validWord();
    if (!word) return;
    var urlText = endpoint.value.trim() || DEFAULT_URL;
    var pattern = getHostPattern(urlText);
    if (!pattern || urlText.indexOf("{word}") === -1) {
      result.textContent = "آدرس نامعتبر است؛ باید HTTP/HTTPS باشد و {word} داشته باشد.";
      saveWord.disabled = true;
      return;
    }
    currentWord = word;
    currentMeaning = "";
    saveWord.disabled = true;
    result.textContent = "در حال جست‌وجوی آنلاین...";
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
          showMeaning(word, response.meaning, "online");
        });
      });
    });
  }

  chrome.storage.local.get({ textTranslatorEnabled: true, onlineDictionaryUrl: DEFAULT_URL }, function (data) {
    render(data.textTranslatorEnabled !== false);
    endpoint.value = data.onlineDictionaryUrl || DEFAULT_URL;
  });

  function loadOffline() {
    fetch(chrome.runtime.getURL("dictionary.json")).then(function (response) {
      if (!response.ok) throw new Error("Could not load dictionary.json");
      return response.json();
    }).then(function (data) {
      offline = {};
      Object.keys(data || {}).forEach(function (key) {
        if (typeof data[key] === "string") offline[key.toLowerCase()] = data[key];
      });
      chrome.storage.local.get({ customDictionary: {} }, function (saved) {
        Object.keys(saved.customDictionary || {}).forEach(function (key) {
          offline[key.toLowerCase()] = saved.customDictionary[key];
        });
        offlineLoaded = true;
      });
    }).catch(function () {
      chrome.storage.local.get({ customDictionary: {} }, function (saved) {
        offline = {};
        Object.keys(saved.customDictionary || {}).forEach(function (key) {
          offline[key.toLowerCase()] = saved.customDictionary[key];
        });
        offlineLoaded = true;
      });
    });
  }
  loadOffline();

  toggle.addEventListener("click", function () {
    chrome.storage.local.get({ textTranslatorEnabled: true }, function (data) {
      var nextEnabled = data.textTranslatorEnabled === false;
      chrome.storage.local.set({ textTranslatorEnabled: nextEnabled }, function () { render(nextEnabled); });
    });
  });

  lookupOffline.addEventListener("click", lookupOfflineWord);
  lookupOnline.addEventListener("click", lookupOnlineWord);
  wordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") lookupOfflineWord();
  });

  saveWord.addEventListener("click", function () {
    if (!currentWord || !currentMeaning) return;
    var wordToSave = currentWord;
    var meaningToSave = currentMeaning;
    chrome.storage.local.get({ customDictionary: {} }, function (data) {
      var saved = data.customDictionary || {};
      saved[wordToSave] = meaningToSave;
      chrome.storage.local.set({ customDictionary: saved }, function () {
        offline[wordToSave] = meaningToSave;
        offlineLoaded = true;
        result.textContent = "＋ ذخیره شد! «" + wordToSave + "» از این پس در دیکشنری آفلاین هم موجود است.";
        saveWord.disabled = true;
      });
    });
  });

  saveEndpoint.addEventListener("click", function () {
    var urlText = endpoint.value.trim();
    var pattern = getHostPattern(urlText);
    if (!pattern || urlText.indexOf("{word}") === -1) {
      result.textContent = "آدرس معتبر نیست یا {word} ندارد.";
      return;
    }
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
