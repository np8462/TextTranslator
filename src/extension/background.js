var DEFAULT_DICTIONARY_URL = "https://api.mymemory.translated.net/get?q={word}&langpair=en|fa";

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== "ONLINE_LOOKUP") return;
  chrome.storage.local.get({ onlineDictionaryUrl: DEFAULT_DICTIONARY_URL }, function (settings) {
    var template = (settings.onlineDictionaryUrl || DEFAULT_DICTIONARY_URL).trim();
    if (template.indexOf("{word}") === -1) {
      sendResponse({ ok: false, error: "آدرس باید جای‌نگهدار {word} داشته باشد." });
      return;
    }
    var url = template.replace(/\{word\}/g, encodeURIComponent(message.word));
    fetch(url, { headers: { "Accept": "application/json" } }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    }).then(function (data) {
      var meaning = data && data.responseData && data.responseData.translatedText;
      if (!meaning && data) meaning = data.meaning || data.translation || data.translatedText;
      if (typeof meaning !== "string" || !meaning.trim()) {
        sendResponse({ ok: false, error: "پاسخ سرویس معنی قابل‌خواندن نداشت. JSON باید فیلد meaning یا responseData.translatedText داشته باشد." });
        return;
      }
      sendResponse({ ok: true, word: message.word, meaning: meaning.trim() });
    }).catch(function (error) {
      sendResponse({ ok: false, error: "ارتباط با دیکشنری آنلاین ناموفق بود: " + error.message });
    });
  });
  return true;
});
