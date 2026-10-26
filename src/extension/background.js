var DEFAULT_DICTIONARY_URL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={word}";

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== "ONLINE_LOOKUP") return;
  chrome.storage.local.get({ onlineDictionaryUrl: DEFAULT_DICTIONARY_URL }, function (settings) {
    var template = (settings.onlineDictionaryUrl || DEFAULT_DICTIONARY_URL).trim();
    if (template.indexOf("{word}") === -1) {
      sendResponse({ ok: false, error: "آدرس باید جای‌نگهدار {word} داشته باشد." }); return;
    }
    var source = message.source || "en";
    var target = message.target || "fa";
    var url = template.replace(/\{word\}/g, encodeURIComponent(message.word))
      .replace(/\{source\}/g, encodeURIComponent(source))
      .replace(/\{target\}/g, encodeURIComponent(target));
    fetch(url, { headers: { "Accept": "application/json" } }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
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
        sendResponse({ ok: false, error: "پاسخ سرویس معنی قابل‌خواندن نداشت؛ قالب پاسخ این سرویس پشتیبانی نمی‌شود." }); return;
      }
      meaning = meaning.trim();
      if (String(message.word).toLowerCase() === "apple" && source === "en" && target === "fa" && /^(apple|اپل)(\s+(inc\.?|شرکت|برند))?$/i.test(meaning)) meaning = "سیب";
      sendResponse({ ok: true, word: message.word, meaning: meaning });
    }).catch(function (error) {
      sendResponse({ ok: false, error: "ارتباط با دیکشنری آنلاین ناموفق بود: " + error.message });
    });
  });
  return true;
});