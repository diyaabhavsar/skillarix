import nlp from 'compromise';
import { TEXT_PATTERNS } from './textPatterns';

export const enhanceText = (rawText: string): string => {
  if (!rawText?.trim()) return "";

  // Split into sentences more aggressively for speech input
  const sentences = rawText.split(/(?<=[.!?])\s+|\s*(?:[.]\s*){2,}|\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);

  const processedSentences = sentences.map((sentence: string) => {
    let line = sentence.trim();
    
    // Capitalize first letter of the sentence
    line = line.charAt(0).toUpperCase() + line.slice(1);

    // Capitalize proper nouns and important words
    line = line.replace(/\b(i|i'm|i'll|i've|i'd)\b/gi, match => match.toUpperCase());
    line = line.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, 
      word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    line = line.replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
      word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    // Fix I forms and common speech patterns
    line = line.replace(TEXT_PATTERNS.I_FORMS, match => match.toUpperCase());
    
    // Add commas for natural speech patterns
    line = line.replace(TEXT_PATTERNS.INTRODUCTORY_PHRASES, '$1,');
    line = line.replace(/(\w+)(\s+and\s+|\s+or\s+)(\w+)/g, '$1, $2$3');
    
    // Determine sentence type
    const isQuestion = (
      TEXT_PATTERNS.QUESTION_STARTERS.test(line) ||
      TEXT_PATTERNS.QUESTION_WORDS.test(line) ||
      line.includes('?')
    );
    
    const isIncomplete = TEXT_PATTERNS.INCOMPLETE_ENDINGS.some(
      ending => line.endsWith(ending)
    );
    
    // Apply appropriate punctuation
    if (line.match(/[.!?]$/)) return line;
    if (isIncomplete) return line + '...';
    if (isQuestion) return line + '?';
    return line + '.';
  });

  let result = processedSentences.join(' ');
  
  // Final cleanup and formatting
  result = result
    .replace(TEXT_PATTERNS.GREETINGS, '$1,')
    .replace(/([.!?,])\1+/g, '$1')
    .replace(/\s+([.!?,])/g, '$1')
    .replace(/([.!?,])\s*/g, '$1 ')
    .replace(/\.{2,}/g, '...')
    .replace(/\.\s\.\s\./g, '...')
    .trim();

  return result;
};
