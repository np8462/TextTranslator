document.addEventListener("DOMContentLoaded", function () {
  var status = document.getElementById("status");
  var toggle = document.getElementById("toggle");

  function render(enabled) {
    status.textContent = enabled
      ? "وضعیت: افزونه فعال است."
      : "وضعیت: افزونه خاموش است.";
    toggle.textContent = enabled ? "خاموش کردن افزونه" : "فعال کردن افزونه";
    toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  }

  chrome.storage.local.get({ textTranslatorEnabled: true }, function (data) {
    render(data.textTranslatorEnabled !== false);
  });

  toggle.addEventListener("click", function () {
    chrome.storage.local.get({ textTranslatorEnabled: true }, function (data) {
      var nextEnabled = data.textTranslatorEnabled === false;
      chrome.storage.local.set({ textTranslatorEnabled: nextEnabled }, function () {
        render(nextEnabled);
      });
    });
  });
});
