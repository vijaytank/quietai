document.addEventListener("DOMContentLoaded", () => {
  // All rule IDs matching the content.js PROMPT_ENHANCEMENTS
  const ruleIds = [
    // Response Length
    "concise",
    "tldr",
    "noYapping",
    // Format
    "bulletPoints",
    "stepByStep",
    "proscons",
    "tableFormat",
    // Explanation Style
    "eli5",
    "expertMode",
    // Technical
    "codeOnly",
    // Critical Thinking
    "challenge",
    "askClarify",
    // Accuracy
    "noGuess",
    "sources"
  ];

  const masterToggle = document.getElementById("masterToggle");
  const toggleBtn = document.getElementById("toggleSelect");
  const saveBtn = document.getElementById("save");
  const loggingCheckbox = document.getElementById("enableLogging");
  const ruleGroups = document.querySelectorAll(".rule-group");
  const statusBar = document.getElementById("statusBar");

  // Load saved state
  chrome.storage.sync.get(["rules", "logging", "enabled"], (data) => {
    ruleIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = data.rules?.[id] || false;
    });
    loggingCheckbox.checked = data.logging || false;
    masterToggle.checked = data.enabled !== false;
    updateToggleLabel();
    updateRuleGroupState();
  });

  // Master toggle
  masterToggle.addEventListener("change", updateRuleGroupState);

  function updateRuleGroupState() {
    const isEnabled = masterToggle.checked;
    ruleGroups.forEach(group => {
      group.querySelectorAll("label").forEach(label => {
        label.classList.toggle("disabled", !isEnabled);
      });
    });
    toggleBtn.disabled = !isEnabled;
    toggleBtn.style.opacity = isEnabled ? "1" : "0.5";
  }

  // Toggle All
  toggleBtn.addEventListener("click", () => {
    const allChecked = ruleIds.every(id => document.getElementById(id)?.checked);
    ruleIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = !allChecked;
    });
    updateToggleLabel();
  });

  function updateToggleLabel() {
    const allChecked = ruleIds.every(id => document.getElementById(id)?.checked);
    toggleBtn.textContent = allChecked ? "Deselect All" : "Select All";
  }

  // Save
  saveBtn.addEventListener("click", () => {
    const rules = {};
    ruleIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) rules[id] = el.checked;
    });

    chrome.storage.sync.set({
      rules,
      logging: loggingCheckbox.checked,
      enabled: masterToggle.checked
    }, () => {
      statusBar.classList.add("success");
      setTimeout(() => window.close(), 500);
    });
  });

  // Update label on checkbox change
  ruleIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateToggleLabel);
  });
});
