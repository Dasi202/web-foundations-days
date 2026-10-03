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

// testing wiconsole log = expected results shown as comments
console.log('=== 1. searchNotes("milk") ===');
console.log(searchNotes("milk"));
// → [ { id: 1, text: 'Buy milk and bread', category: 'personal' } ]

console.log('\n=== 1b. searchNotes("JAVASCRIPT") (case-insensitive) ===');
console.log(searchNotes("JAVASCRIPT"));
// → [ { id: 4, text: 'Revise JavaScript arrays', category: 'study' } ]

console.log('\n=== 1c. searchNotes("xyz") (no match) ===');
console.log(searchNotes("xyz"));
// → []

console.log('\n=== 2. longestNote() ===');
console.log(longestNote());
// → { id: 3, text: 'Email the project report to Grace', category: 'work' }

console.log('\n=== 3. countByCategory() ===');
console.log(countByCategory());
// → { personal: 2, study: 2, work: 1 }   (order may vary in JS objects)

console.log('\n=== 4. getSummary() ===');
console.log(getSummary());
// → "5 notes: 2 personal, 1 work, 2 study."

console.log('\n=== 5. isDuplicate("buy milk and bread") ===');
console.log(isDuplicate("buy milk and bread"));
// → true (ignores case and extra spaces)

console.log('\n=== 5b. isDuplicate("Buy   milk and bread") (extra spaces) ===');
console.log(isDuplicate("Buy   milk and bread"));
// → true

console.log('\n=== 5c. isDuplicate("Unique note") ===');
console.log(isDuplicate("Unique note"));
// → false

console.log('\n=== 6. addNote tests ===');
console.log('-- addNote("   ", "personal") --> empty text --');
addNote("   ", "personal");
// → false (length < 1)

console.log('-- addNote("Valid new note", "work") --> should succeed --');
addNote("Valid new note", "work");
// → true (added, new note id:6)

console.log('-- addNote("Valid new note", "study") --> duplicate --');
addNote("Valid new note", "study");
// → false (duplicate)

console.log('-- addNote("Another note", "hobby") --> invalid category --');
addNote("Another note", "hobby");
// → false (invalid category)

console.log('-- addNote("A".repeat(201), "study") --> too long --');
addNote("A".repeat(201), "study");
// → false (length > 200)

// Verify that only the valid note was added (total notes = 6)
console.log('\n=== After addNote tests: notes array ===');
console.log(notes.map(n => ({ id: n.id, text: n.text, category: n.category })));
// → 6 notes, including the added "Valid new note" (work)

// Additional check: getSummary after adding valid note
console.log('\n=== Final getSummary() after addition ===');
console.log(getSummary());
// → "6 notes: 2 personal, 2 work, 2 study."
