let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// --- helper: normalize text for case-insensitive comparison (extra spaces removed)
function normalizeText(str) {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

// 1. searchNotes(word) – case-insensitive substring match on note text
function searchNotes(word) {
  if (!word) return [];
  const lowerWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerWord));
}

// 2. longestNote() – note with the most characters (or null if no notes)
function longestNote() {
  if (notes.length === 0) return null;
  return notes.reduce((longest, current) =>
    current.text.length > longest.text.length ? current : longest
  );
}

// 3. countByCategory() – object counting notes per category
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary() – sentence like "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const total = notes.length;
  if (total === 0) return "0 notes.";
  const counts = countByCategory();
  // build ordered category list: personal, work, study (other categories fallback)
  const categoryOrder = ['personal', 'work', 'study'];
  const parts = [];
  for (const cat of categoryOrder) {
    if (counts[cat]) {
      parts.push(`${counts[cat]} ${cat}`);
    }
  }
  // include any unexpected categories (just in case)
  for (const cat in counts) {
    if (!categoryOrder.includes(cat)) {
      parts.push(`${counts[cat]} ${cat}`);
    }
  }
  return `${total} notes: ${parts.join(', ')}.`;
}

// 5. isDuplicate(text) – true if a note with same normalized text exists
function isDuplicate(text) {
  if (!text) return false;
  const normalized = normalizeText(text);
  return notes.some(note => normalizeText(note.text) === normalized);
}

// 6. addNote(text, category) – validate length, duplicate, category; returns true/false
function addNote(text, category) {
  const trimmed = text ? text.trim() : '';
  // length check: 1–200 characters (based on trimmed text)
  if (!trimmed || trimmed.length < 1 || trimmed.length > 200) {
    console.log(`addNote("${text}", "${category}") → false: text must be 1–200 characters.`);
    return false;
  }

  // category check
  const allowedCategories = ['personal', 'work', 'study'];
  if (!allowedCategories.includes(category)) {
    console.log(`addNote("${trimmed}", "${category}") → false: category must be personal, work, or study.`);
    return false;
  }

  // duplicate check (case-insensitive, spaces normalized)
  if (isDuplicate(trimmed)) {
    console.log(`addNote("${trimmed}", "${category}") → false: duplicate note (ignoring case/extra spaces).`);
    return false;
  }

  // generate new id (max existing id + 1)
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: trimmed, category });
  console.log(`addNote("${trimmed}", "${category}") → true: note added.`);
  return true;
}
