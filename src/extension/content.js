(function () {
  var enabled = true;
  var dictionaryMode = "online";
  var sourceLanguage = "en";
  var targetLanguage = "fa";
  var card = null;
  var hideTimer = null;
  var requestId = 0;
  var baseDictionary = {};
  var dictionary = {};
  var customDictionaries = {};

  function pairKey() { return sourceLanguage + "-" + targetLanguage; }
  function rebuildDictionary() {
    dictionary = {};
    if (sourceLanguage === "en" && targetLanguage === "fa") {
      Object.keys(baseDictionary).forEach(function (key) { dictionary[key] = baseDictionary[key]; });
    }
    var saved = customDictionaries[pairKey()] || {};
    Object.keys(saved).forEach(function (key) { if (typeof saved[key] === "string") dictionary[key.toLowerCase()] = saved[key]; });
  }
  fetch(chrome.runtime.getURL("dictionary.json")).then(function (response) { return response.json(); })
    .then(function (data) {
      Object.keys(data || {}).forEach(function (key) { if (typeof data[key] === "string") baseDictionary[key.toLowerCase()] = data[key]; });
      rebuildDictionary();
    }).catch(function () {});
  chrome.storage.local.get({
    textTranslatorEnabled: true, dictionaryMode: "online", sourceLanguage: "en",
    targetLanguage: "fa", customDictionaries: {}
  }, function (data) {
    enabled = data.textTranslatorEnabled !== false;
    dictionaryMode = data.dictionaryMode === "offline" ? "offline" : "online";
    sourceLanguage = data.sourceLanguage || "en";
    targetLanguage = data.targetLanguage || "fa";
    customDictionaries = data.customDictionaries || {};
    rebuildDictionary();
  });

  function removeCard() {
    if (card && card.parentNode) card.parentNode.removeChild(card);
    card = null;
  }
  function makeCard(word, meaning, rect, isLoading) {
    removeCard();
    card = document.createElement("div");
    card.setAttribute("role", "status");
    card.setAttribute("dir", "rtl");
    card.style.cssText = "position:fixed;z-index:2147483647;max-width:300px;padding:10px 12px;border:1px solid #d2d7de;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.18);background:#fff;color:#202124;font:14px/1.7 Tahoma,Arial,sans-serif;text-align:right;direction:rtl;cursor:default;";
    var title = document.createElement("div");
    title.textContent = word;
    title.style.cssText = "font-weight:bold;color:#1769aa;margin-bottom:3px;direction:auto;text-align:left;";
    var text = document.createElement("div");
    text.textContent = meaning;
    if (isLoading) text.style.color = "#5f6368";
    card.appendChild(title); card.appendChild(text);
    card.addEventListener("mouseenter", function () { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } });
    card.addEventListener("mouseleave", function () { hideTimer = setTimeout(removeCard, 350); });
    document.documentElement.appendChild(card);
    var left = Math.max(8, Math.min(rect.left, window.innerWidth - 315));
    var top = rect.bottom + 8;
    if (top + card.offsetHeight > window.innerHeight - 8) top = rect.top - card.offsetHeight - 8;
    card.style.left = left + "px"; card.style.top = Math.max(8, top) + "px";
  }
  function isEditable(node) {
    if (!node) return false;
    var element = node.nodeType === 1 ? node : node.parentElement;
    if (!element) return false;
    return !!element.closest("input, textarea, select, [contenteditable='true']");
  }
  function showSelectionMeaning(word, rect) {
    var normalized = word.toLowerCase();
    var thisRequest = ++requestId;
    if (dictionaryMode === "offline") {
      makeCard(word, dictionary[normalized] || "این واژه در دیکشنری آفلاین این جفت‌زبان نیست. می‌توانی آن را در پنجرهٔ افزونه جست‌وجو و ذخیره کنی.", rect, false);
      return;
    }
    makeCard(word, "در حال جست‌وجوی آنلاین...", rect, true);
    chrome.runtime.sendMessage({ type: "ONLINE_LOOKUP", word: word, source: sourceLanguage, target: targetLanguage }, function (response) {
      if (thisRequest !== requestId || !card) return;
      if (chrome.runtime.lastError) {
        makeCard(word, "خطای ارتباط آنلاین؛ اتصال اینترنت و دسترسی سرویس را بررسی کن.", rect, false); return;
      }
      if (!response || !response.ok) {
        makeCard(word, response && response.error ? response.error : "معنی آنلاین پیدا نشد.", rect, false); return;
      }
      makeCard(word, response.meaning, rect, false);
    });
  }
  function lookupSelection() {
    if (!enabled) return;
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    if (isEditable(selection.anchorNode) || isEditable(selection.focusNode)) return;
    var word = selection.toString().trim();
    if (!word || word.length > 40 || /\s/.test(word)) return;
    if (!/[\p{L}\p{N}]/u.test(word)) return;
    var rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return;
    showSelectionMeaning(word, rect);
  }
  document.addEventListener("mouseup", function () {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    window.setTimeout(lookupSelection, 40);
  });
  document.addEventListener("mousemove", function (event) {
    if (!card) return;
    var selection = window.getSelection(), overSelection = false;
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      var selectedRect = selection.getRangeAt(0).getBoundingClientRect();
      overSelection = event.clientX >= selectedRect.left && event.clientX <= selectedRect.right &&
        event.clientY >= selectedRect.top && event.clientY <= selectedRect.bottom;
    }
    if (overSelection || card.contains(event.target)) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    } else if (!hideTimer) hideTimer = setTimeout(removeCard, 450);
  });
  document.addEventListener("mousedown", function (event) { if (card && !card.contains(event.target)) removeCard(); });
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local") return;
    if (changes.textTranslatorEnabled) {
      enabled = changes.textTranslatorEnabled.newValue !== false;
      if (!enabled) removeCard();
    }
    if (changes.dictionaryMode) dictionaryMode = changes.dictionaryMode.newValue === "offline" ? "offline" : "online";
    if (changes.sourceLanguage) sourceLanguage = changes.sourceLanguage.newValue || "en";
    if (changes.targetLanguage) targetLanguage = changes.targetLanguage.newValue || "fa";
    if (changes.customDictionaries) customDictionaries = changes.customDictionaries.newValue || {};
    if (changes.dictionaryMode || changes.sourceLanguage || changes.targetLanguage || changes.customDictionaries) {
      requestId++; removeCard(); rebuildDictionary();
    }
  });
})();