import nlp from 'compromise';
import { TEXT_PATTERNS } from './textPatterns';

export const enhanceText = (rawText: string): string => {
  if (!rawText?.trim()) return "";

  const doc = nlp(rawText.toLowerCase().trim());
  const sentences = doc.sentences().out('array');

  const processedSentences = sentences.map((sentence: string) => {
    let line = sentence.trim();
    
    // First letter capitalization
    line = line.charAt(0).toUpperCase() + line.slice(1);
    
    // Fix I forms
    line = line.replace(TEXT_PATTERNS.I_FORMS, match => match.toUpperCase());
    
    // Add commas after introductory phrases
    line = line.replace(TEXT_PATTERNS.INTRODUCTORY_PHRASES, '$1,');
    
    // Add commas in lists
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
