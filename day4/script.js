// script.js — live counters, warnings, localStorage draft & theme

// ----- select all elements -----
const textarea = document.getElementById('note-text');
const charCountEl = document.getElementById('char-count');
const wordCountEl = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

// ----- constants -----
const MAX_CHARS = 200;
const WARNING_THRESHOLD = 180;
const STORAGE_KEY_DRAFT = 'day4_note_draft';
const STORAGE_KEY_THEME = 'day4_theme';

// ----- helper: update counters, warnings, classes -----
function updateCounts() {
  const text = textarea.value;
  const charLength = text.length;

  // character count text: "N / 200 characters"
  charCountEl.textContent = `${charLength} / ${MAX_CHARS} characters`;

  // word count: split by whitespace, filter empty strings
  const words = text.trim() === '' ? [] : text.trim().split(/\s+/);
  const wordCount = words.length;
  wordCountEl.textContent = `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`;

  // ----- warning & over classes -----
  charCountEl.classList.remove('warning', 'over');
  if (charLength > MAX_CHARS) {
    charCountEl.classList.add('over');
  } else if (charLength > WARNING_THRESHOLD) {
    charCountEl.classList.add('warning');
  }
}

// ----- save current draft to localStorage (plain text) -----
function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY_DRAFT, textarea.value);
  } catch (e) {
    // localStorage might be full / disabled — silently ignore
  }
}

// ----- load draft from localStorage (if any) -----
function loadDraft() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DRAFT);
    if (saved !== null) {
      textarea.value = saved;
    }
  } catch (e) {
    // ignore
  }
}

// ----- clear textarea, reset counters, remove draft -----
function clearNote() {
  textarea.value = '';
  // remove draft from localStorage
  try {
    localStorage.removeItem(STORAGE_KEY_DRAFT);
  } catch (e) {}
  updateCounts();
  textarea.focus();
}

// ----- theme handling -----
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
    themeToggle.textContent = 'Light mode';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = 'Dark mode';
  }
}

function loadThemePreference() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    // default to light (false) if nothing stored
    const isDark = savedTheme === 'dark';
    setTheme(isDark);
  } catch (e) {
    setTheme(false); // fallback
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  const newDark = !isDark;
  setTheme(newDark);
  try {
    localStorage.setItem(STORAGE_KEY_THEME, newDark ? 'dark' : 'light');
  } catch (e) {}
}

// ----- event listeners -----

// 1. input event: update counts + save draft
textarea.addEventListener('input', () => {
  updateCounts();
  saveDraft();
});

// 2. clear button
clearBtn.addEventListener('click', clearNote);

// 3. Escape key inside textarea clears
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();   // avoid any browser quirk
    clearNote();
  }
});

// 4. theme toggle
themeToggle.addEventListener('click', toggleTheme);

// ----- initialisation on page load -----

// restore draft (if any)
loadDraft();

// restore theme preference
loadThemePreference();

// update counters to match restored draft (or empty)
updateCounts();

// if textarea is empty, no draft to save until user types.
// but we already have the saved draft — if empty string, remove it? 
// better keep as is: loadDraft sets value, if saved empty string,
// we already removed? not necessary. But to be clean:
// if draft was empty, remove key to avoid stale empty draft.
if (textarea.value === '') {
  try {
    localStorage.removeItem(STORAGE_KEY_DRAFT);
  } catch (e) {}
}