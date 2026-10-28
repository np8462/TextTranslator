(function () {
  var enabled = true;
  var translateOnSelection = true;
  var translateOnHover = true;
  var dictionaryMode = "online";
  var sourceLanguage = "en";
  var targetLanguage = "fa";
  var card = null;
  var hideTimer = null;
  var cardTimer = null;
  var statusToast = null;
  var statusToastTimer = null;
  var displayDurationSeconds = 2;
  var requestId = 0;
  var dictionary = {};
  var customDictionaries = {};
  var updatedDictionaries = {};
  var seedDictionaries = {};

  function pairKey() { return sourceLanguage + "-" + targetLanguage; }
  function rebuildDictionary() {
    dictionary = {};
    var seeded = seedDictionaries[pairKey()] || {};
    Object.keys(seeded).forEach(function (key) { dictionary[key.toLowerCase()] = seeded[key]; });
    var updated = updatedDictionaries[pairKey()] || {};
    Object.keys(updated).forEach(function (key) { if (typeof updated[key] === "string") dictionary[key.toLowerCase()] = updated[key]; });
    var saved = customDictionaries[pairKey()] || {};
    Object.keys(saved).forEach(function (key) { if (typeof saved[key] === "string") dictionary[key.toLowerCase()] = saved[key]; });
  }
  function loadPairDictionary() {
    var key = pairKey();
    fetch(chrome.runtime.getURL("dictionaries/" + key + ".json")).then(function (response) {
      if (!response.ok) throw new Error("pair dictionary not found");
      return response.json();
    }).then(function (data) {
      if (pairKey() !== key) return;
      seedDictionaries = {};
      seedDictionaries[key] = data || {};
      rebuildDictionary();
    }).catch(function () {
      if (pairKey() !== key) return;
      seedDictionaries = {};
      rebuildDictionary();
    });
  }
  loadPairDictionary();
  chrome.storage.local.get({
    textTranslatorEnabled: true, translateOnSelection: true, translateOnHover: true,
    dictionaryMode: "online", sourceLanguage: "en", targetLanguage: "fa",
    customDictionaries: {}, customDictionary: {}, updatedDictionaries: {}, tooltipDurationSeconds: 2
  }, function (data) {
    enabled = data.textTranslatorEnabled !== false;
    translateOnSelection = data.translateOnSelection !== false;
    translateOnHover = data.translateOnHover !== false;
    dictionaryMode = data.dictionaryMode === "offline" ? "offline" : "online";
    sourceLanguage = data.sourceLanguage || "en";
    targetLanguage = data.targetLanguage || "fa";
    customDictionaries = data.customDictionaries || {};
    updatedDictionaries = data.updatedDictionaries || {};
    displayDurationSeconds = Number(data.tooltipDurationSeconds) >= 1 && Number(data.tooltipDurationSeconds) <= 60 ? Math.floor(Number(data.tooltipDurationSeconds)) : 2;
    if (!customDictionaries["en-fa"] && data.customDictionary && Object.keys(data.customDictionary).length) {
      customDictionaries["en-fa"] = data.customDictionary;
      chrome.storage.local.set({ customDictionaries: customDictionaries });
    }
    loadPairDictionary();
  });

  function removeCard() {
    if (cardTimer) { clearTimeout(cardTimer); cardTimer = null; }
    if (card && card.parentNode) card.parentNode.removeChild(card);
    card = null;
  }

  function showStatusToast(message, type) {
    if (statusToastTimer) { clearTimeout(statusToastTimer); statusToastTimer = null; }
    if (statusToast && statusToast.parentNode) statusToast.parentNode.removeChild(statusToast);

    var host = document.createElement("div");
    statusToast = host;
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    host.setAttribute("dir", "rtl");
    host.style.setProperty("all", "initial", "important");
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("top", "18px", "important");
    host.style.setProperty("left", "50%", "important");
    host.style.setProperty("transform", "translateX(-50%)", "important");
    host.style.setProperty("z-index", "2147483647", "important");
    host.style.setProperty("display", "block", "important");
    host.style.setProperty("visibility", "visible", "important");
    host.style.setProperty("opacity", "1", "important");
    host.style.setProperty("pointer-events", "none", "important");
    host.style.setProperty("max-width", "calc(100vw - 32px)", "important");

    var shadow = host.attachShadow ? host.attachShadow({ mode: "open" }) : null;
    var panel = document.createElement("div");
    panel.textContent = message;
    panel.setAttribute("dir", "rtl");
    panel.style.cssText = "box-sizing:border-box;max-width:calc(100vw - 32px);padding:10px 16px;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.28);font: bold 14px/1.7 Tahoma,Arial,sans-serif;text-align:center;direction:rtl;white-space:normal;word-break:break-word;";

    if (type === "success") {
      panel.style.background = "#e6f4ea";
      panel.style.border = "2px solid #188038";
      panel.style.color = "#176b35";
    } else if (type === "error") {
      panel.style.background = "#fce8e6";
      panel.style.border = "2px solid #c5221f";
      panel.style.color = "#a12622";
    } else {
      panel.style.background = "#fff4ce";
      panel.style.border = "2px solid #e8a817";
      panel.style.color = "#795900";
    }
    if (shadow) shadow.appendChild(panel);
    else host.appendChild(panel);
    (document.documentElement || document.body).appendChild(host);

    statusToastTimer = setTimeout(function () {
      if (!statusToast) return;
      statusToast.style.setProperty("opacity", "0", "important");
      var oldToast = statusToast;
      statusToastTimer = setTimeout(function () {
        if (oldToast && oldToast.parentNode) oldToast.parentNode.removeChild(oldToast);
        if (statusToast === oldToast) statusToast = null;
        statusToastTimer = null;
      }, 250);
    }, 3200);
  }
  function makeCard(word, meaning, rect, isLoading, autoSaved, messageType, saveFailed, offlineSuggestion) {
    removeCard();
    card = document.createElement("div");
    card.setAttribute("role", "status");
    card.setAttribute("dir", "rtl");
    card.style.cssText = "position:fixed;z-index:2147483647;max-width:300px;padding:10px 12px;border:1px solid #d2d7de;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.12);background:#fff;color:#202124;font:14px/1.7 Tahoma,Arial,sans-serif;text-align:right;direction:rtl;cursor:default;";
    if (messageType === "error") { card.style.borderColor = "#e6aaa5"; card.style.background = "#fff7f6"; }
    else if (messageType === "warning") { card.style.borderColor = "#e8d19a"; card.style.background = "#fffaf0"; }
    else if (messageType === "success") { card.style.borderColor = "#b7d9c0"; card.style.background = "#f6fbf7"; }
    var title = document.createElement("div");
    title.textContent = word;
    title.style.cssText = "font-weight:bold;color:#1769aa;margin-bottom:3px;direction:auto;text-align:left;";
    var text = document.createElement("div");
    text.textContent = meaning;
    if (isLoading) text.style.color = "#5f6368";
    card.appendChild(title); card.appendChild(text);
    if (autoSaved || saveFailed) {
      var savedNotice = document.createElement("div");
      savedNotice.textContent = autoSaved
        ? "ذخیره شد؛ این واژه به دیکشنری آفلاین همین جفت‌زبان اضافه شد."
        : "معنی آنلاین دریافت شد، اما ذخیره‌سازی آفلاین ناموفق بود.";
      savedNotice.style.cssText = autoSaved
        ? "margin-top:7px;padding:5px 7px;border-radius:5px;background:#e6f4ea;color:#24643b;font-size:12px;border:1px solid #b7d9c0;"
        : "margin-top:7px;padding:5px 7px;border-radius:5px;background:#fff5f4;color:#9f2922;font-size:12px;border:1px solid #e7c0bd;";
      card.appendChild(savedNotice);
    }
    if (offlineSuggestion) {
      var offlineTitle = document.createElement("div");
      offlineTitle.textContent = "پیشنهاد جداگانهٔ معنی آفلاین:";
      offlineTitle.style.cssText = "margin-top:8px;padding-top:6px;border-top:1px solid #d9e2d9;font-weight:bold;color:#24643b;font-size:12px;";
      var offlineText = document.createElement("div");
      offlineText.textContent = offlineSuggestion;
      offlineText.style.cssText = "margin-top:2px;color:#24643b;";
      card.appendChild(offlineTitle);
      card.appendChild(offlineText);
    }
    card.addEventListener("mouseenter", function () { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } });
    card.addEventListener("mouseleave", function () { hideTimer = setTimeout(removeCard, 350); });
    document.documentElement.appendChild(card);
    var left = Math.max(8, Math.min(rect.left, window.innerWidth - 315));
    var top = rect.bottom + 8;
    if (top + card.offsetHeight > window.innerHeight - 8) top = rect.top - card.offsetHeight - 8;
    card.style.left = left + "px"; card.style.top = Math.max(8, top) + "px";
    if (!isLoading) cardTimer = setTimeout(function () { removeCard(); lastHoverWord = ""; }, displayDurationSeconds * 1000);
  }
  function isEditable(node) {
    if (!node) return false;
    var element = node.nodeType === 1 ? node : node.parentElement;
    if (!element) return false;
    return !!element.closest("input, textarea, select, [contenteditable='true']");
  }
  function showOnlineFailure(word, error, rect) {
    var offlineMeaning = dictionary[String(word || "").toLowerCase()];
    if (offlineMeaning) makeCard(word, "خطای آنلاین: " + error, rect, false, false, "error", false, offlineMeaning);
    else makeCard(word, "خطای آنلاین: " + error, rect, false, false, "error");
  }

  function showSelectionMeaning(word, rect) {
    var normalized = word.toLowerCase();
    var thisRequest = ++requestId;
    if (dictionaryMode === "offline") {
      var offlineMeaning = dictionary[normalized];
      makeCard(word, offlineMeaning || "این واژه در دیکشنری آفلاین این جفت‌زبان نیست. می‌توانی آن را در پنجرهٔ افزونه جست‌وجو و ذخیره کنی.", rect, false, false, offlineMeaning ? "success" : "warning");
      return;
    }
    makeCard(word, "در حال جست‌وجوی آنلاین...", rect, true);
    chrome.runtime.sendMessage({ type: "ONLINE_LOOKUP", word: word, source: sourceLanguage, target: targetLanguage }, function (response) {
      if (thisRequest !== requestId) return;

      // The page tooltip may disappear while the network request is running.
      // Keep status feedback independent from the tooltip's lifetime.
      var tooltipStillActive = !!card;
      if (chrome.runtime.lastError) {
        if (tooltipStillActive) showOnlineFailure(word, "ارتباط با افزونه یا سرویس ناموفق بود؛ اتصال اینترنت و دسترسی را بررسی کن.", rect);
        showStatusToast("دریافت معنی آنلاین ناموفق بود؛ اتصال یا دسترسی سرویس را بررسی کن.", "error");
        return;
      }
      if (!response || !response.ok) {
        if (tooltipStillActive) showOnlineFailure(word, response && response.error ? response.error : "معنی آنلاین پیدا نشد.", rect);
        showStatusToast("معنی آنلاین دریافت نشد؛ " + (response && response.error ? response.error : "سرویس پاسخ معتبری نداد."), "error");
        return;
      }

      if (tooltipStillActive) {
        makeCard(word, response.meaning, rect, false, response.autoSaved === true, "info", response.saveFailed === true);
      }
      if (response.autoSaved === true) {
        // Let the loading tooltip finish updating before showing the independent toast.
        setTimeout(function () {
          if (thisRequest === requestId) showStatusToast("ذخیره شد؛ معنی «" + word + "» به دیکشنری آفلاین اضافه شد.", "success");
        }, 180);
      } else if (response.saveFailed === true) {
        showStatusToast("معنی آنلاین دریافت شد، اما ذخیره در دیکشنری آفلاین ناموفق بود.", "error");
      } else if (response.alreadyOffline === true) {
        showStatusToast("این واژه از قبل در دیکشنری آفلاین موجود است.", "info");
      }
    });
  }
  function lookupSelection() {
    if (!enabled || !translateOnSelection) return;
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    if (isEditable(selection.anchorNode) || isEditable(selection.focusNode)) return;
    var word = selection.toString().replace(/\s+/g, " ").trim();
    if (!word || word.length > 80) return;
    if (!/[\p{L}\p{N}]/u.test(word)) return;
    var rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return;
    showSelectionMeaning(word, rect);
  }
  document.addEventListener("mouseup", function () {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    window.setTimeout(lookupSelection, 40);
  });
  var hoverTimer = null;
  var lastHoverWord = "";
  function getWordAtPoint(x, y) {
    var range = null;
    if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) {
      var pos = document.caretPositionFromPoint(x, y);
      if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true); }
    }
    if (!range || !range.startContainer || range.startContainer.nodeType !== 3) return null;
    if (isEditable(range.startContainer)) return null;
    var node = range.startContainer, text = node.nodeValue || "", offset = range.startOffset;
    if (!text.length) return null;
    if (offset === text.length || (offset < text.length && !/[\p{L}\p{N}]/u.test(text.charAt(offset)))) offset--;
    if (offset < 0 || !/[\p{L}\p{N}]/u.test(text.charAt(offset))) return null;
    var start = offset, end = offset + 1;
    while (start > 0 && /[\p{L}\p{N}'’_-]/u.test(text.charAt(start - 1))) start--;
    while (end < text.length && /[\p{L}\p{N}'’_-]/u.test(text.charAt(end))) end++;
    var word = text.slice(start, end);
    if (!word || word.length > 40 || !/[\p{L}\p{N}]/u.test(word)) return null;
    var wordRange = document.createRange();
    wordRange.setStart(node, start); wordRange.setEnd(node, end);
    var rect = wordRange.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return null;
    return { word: word, rect: rect };
  }
  document.addEventListener("mousemove", function (event) {
    if (card && card.contains(event.target)) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      return;
    }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    if (!translateOnHover) return;
    var activeSelection = window.getSelection();
    if (activeSelection && !activeSelection.isCollapsed) return;
    var found = getWordAtPoint(event.clientX, event.clientY);
    if (!found) {
      lastHoverWord = "";
      if (card && !hideTimer) hideTimer = setTimeout(removeCard, 350);
      return;
    }
    if (found.word === lastHoverWord && card) return;
    lastHoverWord = found.word;
    hoverTimer = setTimeout(function () {
      hoverTimer = null;
      if (!enabled) return;
      showSelectionMeaning(found.word, found.rect);
    }, 180);
  });
  document.addEventListener("mousedown", function (event) { if (card && !card.contains(event.target)) removeCard(); });
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local") return;
    if (changes.textTranslatorEnabled) {
      enabled = changes.textTranslatorEnabled.newValue !== false;
      if (!enabled) removeCard();
    }
    if (changes.translateOnSelection) translateOnSelection = changes.translateOnSelection.newValue !== false;
    if (changes.translateOnHover) translateOnHover = changes.translateOnHover.newValue !== false;
    if (changes.translateOnSelection || changes.translateOnHover) removeCard();
    if (changes.dictionaryMode) dictionaryMode = changes.dictionaryMode.newValue === "offline" ? "offline" : "online";
    if (changes.tooltipDurationSeconds) displayDurationSeconds = Number(changes.tooltipDurationSeconds.newValue) >= 1 && Number(changes.tooltipDurationSeconds.newValue) <= 60 ? Math.floor(Number(changes.tooltipDurationSeconds.newValue)) : 2;
    if (changes.sourceLanguage) sourceLanguage = changes.sourceLanguage.newValue || "en";
    if (changes.targetLanguage) targetLanguage = changes.targetLanguage.newValue || "fa";
    if (changes.customDictionaries) customDictionaries = changes.customDictionaries.newValue || {};
    if (changes.updatedDictionaries) updatedDictionaries = changes.updatedDictionaries.newValue || {};
    if (changes.dictionaryMode || changes.sourceLanguage || changes.targetLanguage || changes.customDictionaries || changes.updatedDictionaries) {
      requestId++; removeCard();
      if (changes.sourceLanguage || changes.targetLanguage) loadPairDictionary();
      else rebuildDictionary();
    }
  });
})();