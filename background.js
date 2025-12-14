chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("logging", (data) => {
    if (data.logging) {
      console.log("✅ Extension loaded: AI Prompt Refiner is active");
    }
  });
});
