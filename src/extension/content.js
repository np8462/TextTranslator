(function () {
  var enabled = true;
  var card = null;
  var hideTimer = null;
  var dictionary = {
    hello: "سلام",
    world: "دنیا، جهان",
    book: "کتاب",
    water: "آب",
    house: "خانه",
    home: "خانه، منزل",
    good: "خوب",
    bad: "بد",
    friend: "دوست",
    family: "خانواده",
    love: "عشق، دوست داشتن",
    work: "کار، کار کردن",
    learn: "یاد گرفتن، آموختن",
    language: "زبان",
    word: "کلمه، واژه",
    computer: "رایانه، کامپیوتر",
    time: "زمان، وقت",
    day: "روز",
    night: "شب",
    happy: "خوشحال",
    beautiful: "زیبا",
    important: "مهم",
    help: "کمک، کمک کردن",
    read: "خواندن",
    write: "نوشتن",
    speak: "صحبت کردن",
    understand: "فهمیدن، درک کردن",
    example: "مثال، نمونه",
    test: "آزمایش، آزمون",
    open: "باز کردن، باز",
    close: "بستن، بسته",
    small: "کوچک",
    big: "بزرگ",
    fast: "سریع",
    slow: "آهسته، کند",
    new: "جدید",
    old: "قدیمی، پیر",
    thank: "تشکر کردن",
    thanks: "ممنون، متشکرم",
    please: "لطفاً"
  };

  function removeCard() {
    if (card && card.parentNode) card.parentNode.removeChild(card);
    card = null;
  }

  function makeCard(word, meaning, rect) {
    removeCard();
    card = document.createElement("div");
    card.setAttribute("role", "status");
    card.setAttribute("dir", "rtl");
    card.style.cssText = "position:fixed;z-index:2147483647;max-width:280px;padding:10px 12px;border:1px solid #d2d7de;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.18);background:#fff;color:#202124;font:14px/1.7 Tahoma,Arial,sans-serif;text-align:right;direction:rtl;cursor:default;";
    var title = document.createElement("div");
    title.textContent = word;
    title.style.cssText = "font-weight:bold;color:#1769aa;margin-bottom:3px;direction:ltr;text-align:left;";
    var text = document.createElement("div");
    text.textContent = meaning;
    card.appendChild(title);
    card.appendChild(text);
    card.addEventListener("mouseenter", function () {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    });
    card.addEventListener("mouseleave", function () {
      hideTimer = setTimeout(removeCard, 350);
    });
    document.documentElement.appendChild(card);

    var left = Math.max(8, Math.min(rect.left, window.innerWidth - 300));
    var top = rect.bottom + 8;
    if (top + card.offsetHeight > window.innerHeight - 8) top = rect.top - card.offsetHeight - 8;
    card.style.left = left + "px";
    card.style.top = Math.max(8, top) + "px";
  }

  function isEditable(node) {
    if (!node) return false;
    var element = node.nodeType === 1 ? node : node.parentElement;
    if (!element) return false;
    return !!element.closest("input, textarea, select, [contenteditable='true']");
  }

  function lookupSelection() {
    if (!enabled) return;
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    if (isEditable(selection.anchorNode) || isEditable(selection.focusNode)) return;
    var word = selection.toString().trim();
    if (!/^[A-Za-z][A-Za-z'-]*$/.test(word) || word.length > 40) return;
    var rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return;
    var meaning = dictionary[word.toLowerCase()] || "این کلمه هنوز در واژه‌نامهٔ آزمایشی نیست.";
    makeCard(word, meaning, rect);
  }

  document.addEventListener("mouseup", function () {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    window.setTimeout(lookupSelection, 40);
  });

  document.addEventListener("mousedown", function (event) {
    if (card && !card.contains(event.target)) removeCard();
  });

  chrome.storage.local.get({ textTranslatorEnabled: true }, function (data) {
    enabled = data.textTranslatorEnabled !== false;
  });

  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === "local" && changes.textTranslatorEnabled) {
      enabled = changes.textTranslatorEnabled.newValue !== false;
      if (!enabled) removeCard();
    }
  });
})();
