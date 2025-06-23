interface TextPattern {
  pattern: RegExp;
  replacement: string | ((substring: string, ...args: any[]) => string);
}

export const textPatterns: TextPattern[] = [
  // Fix common speech recognition errors
  {
    pattern: /\b(hi|hello|hey)\s+(?:there\s+)?(\w)/gi,
    replacement: (_, greeting, word) =>
      `${greeting.charAt(0).toUpperCase() + greeting.slice(1)}, ${word}`,
  },
  {
    pattern: /\bgood\s+(morning|afternoon|evening)\b/gi,
    replacement: (_, timeOfDay) => `Good ${timeOfDay}`,
  },

  // Common speech patterns and greetings
  {
    pattern: /\bhow are you\b/gi,
    replacement: "How are you",
  },
  {
    pattern: /\bhow('s| is) it going\b/gi,
    replacement: (_, apostrophe) => `How${apostrophe} it going`,
  },
  {
    pattern: /\bnice to (meet|see) you\b/gi,
    replacement: (_, verb) => `Nice to ${verb} you`,
  },

  // Fix common contractions and informal speech
  {
    pattern: /\bi am\b/gi,
    replacement: "I am",
  },
  {
    pattern: /\bim\b/gi,
    replacement: "I'm",
  },
  {
    pattern: /\bdont\b/gi,
    replacement: "don't",
  },
  {
    pattern: /\bcant\b/gi,
    replacement: "can't",
  },
  {
    pattern: /\bwont\b/gi,
    replacement: "won't",
  },
  {
    pattern: /\bgonna\b/gi,
    replacement: "going to",
  },
  {
    pattern: /\bwanna\b/gi,
    replacement: "want to",
  },
  {
    pattern: /\bgotta\b/gi,
    replacement: "got to",
  },

  // Common phrases and titles
  {
    pattern: /\bai\b/gi,
    replacement: "AI",
  },
  {
    pattern: /\bml\b/gi,
    replacement: "ML",
  },
  {
    pattern: /\bapi\b/gi,
    replacement: "API",
  },

  // Fix spoken numbers and symbols
  {
    pattern: /\bnumber\s+(\d+)\b/gi,
    replacement: (_, num) => num,
  },
  {
    pattern: /\bdollar sign\b/gi,
    replacement: "$",
  },
  {
    pattern: /\bpercent sign\b/gi,
    replacement: "%",
  },

  // Fix spacing around punctuation
  {
    pattern: /\s+([.!?,;:])/g,
    replacement: (_, punct) => punct,
  },
  {
    pattern: /([.!?,;:])\s+/g,
    replacement: (_, punct) => `${punct} `,
  },

  // Fix multiple punctuation
  {
    pattern: /\.{2,}/g,
    replacement: "...",
  },
  {
    pattern: /\?{2,}/g,
    replacement: "?",
  },
  {
    pattern: /!{2,}/g,
    replacement: "!",
  },

  // Smart quotes
  {
    pattern: /"([^"]+)"/g,
    replacement: (_, text) => `"${text}"`,
  },

  // Fix common capitalization errors
  {
    pattern: /(?<=^|\.\s+)([a-z])/g,
    replacement: (match) => match.toUpperCase(),
  },
  {
    pattern: /(?<=!\s+)([a-z])/g,
    replacement: (match) => match.toUpperCase(),
  },
  {
    pattern: /(?<=\?\s+)([a-z])/g,
    replacement: (match) => match.toUpperCase(),
  },

  // Remove common filler words
  {
    pattern: /\b(um|uh|like|you know|i mean)\s+/gi,
    replacement: "",
  },

  // Fix repeated words (common in speech)
  {
    pattern: /\b(\w+)(\s+\1)+\b/gi,
    replacement: (_, word) => word,
  },
];
            