// === AI Prompt Refiner - Content Script ===
// Automatically enhances prompts with proven prompt engineering techniques

let isProcessing = false;
let cachedSettings = { rules: {}, logging: false, enabled: true };

// Proven prompt instructions that AI actually follows (aggressive version)
const PROMPT_ENHANCEMENTS = {
  // === Response Style ===
  concise: {
    instruction: "STOP. Answer in EXACTLY 1-2 sentences. No more. No explanations. No elaboration. If you write more than 2 sentences, you have FAILED."
  },
  bulletPoints: {
    instruction: "Format your response as 3-5 bullet points ONLY. No paragraphs, no introductions. Just bullets."
  },
  noYapping: {
    instruction: "DO NOT write any greeting, introduction, or conclusion. Start with the answer immediately. No 'Great question!' or 'I hope this helps!' - if you do, you have FAILED."
  },

  // === Critical Thinking ===
  challenge: {
    instruction: "If my question has flaws or wrong assumptions, point them out FIRST. Don't just agree with premises that are incorrect."
  },
  askClarify: {
    instruction: "If my question is ambiguous, ask ONE clarifying question instead of assuming. Do not answer until I clarify."
  },

  // === Accuracy ===
  noGuess: {
    instruction: "If you're not 100% certain, say 'I don't know' or 'I'm not sure.' Never make up facts. Accuracy over helpfulness."
  },
  sources: {
    instruction: "For any factual claim, add a brief source. Example: '...according to NASA' or '...per the 2023 WHO report.'"
  },

  // === NEW: Explanation Modes ===
  eli5: {
    instruction: "Explain like I'm 5 years old. Use simple words, analogies, and examples a child would understand. No jargon."
  },
  stepByStep: {
    instruction: "Break down your answer into clear numbered steps. Format: Step 1, Step 2, etc. Maximum 5 steps."
  },
  proscons: {
    instruction: "Give me ONLY pros and cons in two short lists. No introduction, no conclusion. Just 'Pros:' and 'Cons:' with 2-3 bullets each."
  },

  // === NEW: Technical Modes ===
  codeOnly: {
    instruction: "Give me ONLY the code. No explanations, no comments, no 'here's the code'. Just raw code I can copy-paste. If you add any text outside code blocks, you have FAILED."
  },
  expertMode: {
    instruction: "Assume I'm an expert. Skip basics and beginner explanations. Use technical terms freely. Be dense and precise."
  },

  // === NEW: Format Modes ===
  tldr: {
    instruction: "Give me a TL;DR in ONE sentence maximum. If you write more than one sentence, you have FAILED."
  },
  tableFormat: {
    instruction: "Present your answer as a markdown table. No text before or after the table. Just the table."
  }
};

// Load settings on start
chrome.storage.sync.get(["rules", "logging", "enabled"], (data) => {
  cachedSettings.rules = data.rules || {};
  cachedSettings.logging = data.logging || false;
  cachedSettings.enabled = data.enabled !== false;

  if (cachedSettings.logging) {
    console.log("🚀 AI Prompt Refiner loaded on", window.location.hostname);
    console.log("📌 Status:", cachedSettings.enabled ? "ENABLED" : "DISABLED");
    console.log("📋 Active rules:", Object.entries(cachedSettings.rules).filter(([k, v]) => v).map(([k]) => k));
  }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.rules) cachedSettings.rules = changes.rules.newValue || {};
    if (changes.logging) cachedSettings.logging = changes.logging.newValue || false;
    if (changes.enabled) cachedSettings.enabled = changes.enabled.newValue !== false;

    if (cachedSettings.logging) {
      console.log("🔄 Settings updated");
    }
  }
});

// Input element selectors
const EDITOR_SELECTORS = [
  '#prompt-textarea',
  '.ProseMirror[contenteditable="true"]',
  'div[contenteditable="true"][data-placeholder]',
  'textarea[placeholder*="Message"]',
  'textarea[placeholder*="Ask"]',
  'textarea[data-id="root"]',
  '.ql-editor[contenteditable="true"]',
  'div[contenteditable="true"][role="textbox"]',
  'textarea.w-full',
];

function getInputElement() {
  for (const selector of EDITOR_SELECTORS) {
    const el = document.querySelector(selector);
    if (el) {
      return { element: el, isTextarea: el.tagName === 'TEXTAREA' };
    }
  }
  return { element: null, isTextarea: false };
}

function getRawInput(el, isTextarea) {
  if (!el) return null;
  const text = isTextarea ? el.value?.trim() : el.innerText?.trim();
  return text || null;
}

function buildEnhancedPrompt(userPrompt) {
  const rules = cachedSettings.rules;
  const activeInstructions = [];

  // Check if already enhanced
  if (userPrompt.includes('[STYLE GUIDE]') || userPrompt.includes('IMPORTANT INSTRUCTIONS:')) {
    if (cachedSettings.logging) console.log("⚠️ Already enhanced, skipping");
    return userPrompt;
  }

  // Collect active instructions
  Object.entries(rules).forEach(([key, isActive]) => {
    if (isActive && PROMPT_ENHANCEMENTS[key]) {
      activeInstructions.push(`• ${PROMPT_ENHANCEMENTS[key].instruction}`);
    }
  });

  if (activeInstructions.length === 0) {
    return userPrompt;
  }

  // Build the enhanced prompt
  const enhanced = `${userPrompt}

---
IMPORTANT INSTRUCTIONS (follow these strictly):
${activeInstructions.join('\n')}`;

  if (cachedSettings.logging) {
    console.log("🔧 Enhanced prompt:", enhanced);
  }

  return enhanced;
}

function setInputValue(el, isTextarea, value) {
  if (!el) return;

  if (isTextarea) {
    el.value = value;
  } else {
    // For contenteditable, preserve formatting
    el.innerText = value;
  }

  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function clickSubmitButton() {
  const selectors = [
    'button[data-testid="send-button"]',
    'button[data-testid="composer-send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send message"]',
    'button[aria-label="Send Message"]',
    'form button[type="submit"]',
  ];

  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn && !btn.disabled && btn.offsetParent !== null) {
      // Skip navigation/home buttons
      const text = (btn.textContent || '').toLowerCase();
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (text.includes('home') || label.includes('home')) continue;

      if (cachedSettings.logging) console.log("🖱️ Clicking:", selector);
      btn.click();
      return true;
    }
  }
  return false;
}

// Main keydown listener
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey) return;
  if (!cachedSettings.enabled) return;
  if (isProcessing) return;

  const hasActiveRules = Object.values(cachedSettings.rules).some(v => v);
  if (!hasActiveRules) return;

  const { element: el, isTextarea } = getInputElement();
  if (!el) return;

  const rawInput = getRawInput(el, isTextarea);
  if (!rawInput) return;

  // Intercept!
  e.preventDefault();
  e.stopPropagation();
  isProcessing = true;

  if (cachedSettings.logging) console.log("🎯 Intercepted, enhancing...");

  const enhanced = buildEnhancedPrompt(rawInput);

  if (enhanced !== rawInput) {
    setInputValue(el, isTextarea, enhanced);
  }

  // Submit
  setTimeout(() => {
    if (!clickSubmitButton()) {
      el.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13, bubbles: true
      }));
    }
    setTimeout(() => { isProcessing = false; }, 300);
  }, 100);

}, true);
