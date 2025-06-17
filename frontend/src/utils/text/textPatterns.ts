export const TEXT_PATTERNS = {
  QUESTION_STARTERS: /^(can|do|are|is|will|did|have|has|shall|should|would|could|may|might)\b/i,
  QUESTION_WORDS: /\b(who|what|when|where|why|how|which|whose|whom)\b/i,
  INCOMPLETE_ENDINGS: ['that', 'but', 'and', 'or', 'so'],
  INTRODUCTORY_PHRASES: /\b(well|however|moreover|furthermore|therefore|thus|nevertheless|additionally|consequently|meanwhile|besides|hence|still|otherwise|similarly|likewise|accordingly|certainly|indeed)\b(?!\s*[,.])/gi,
  GREETINGS: /\b(hello|hi|hey|good morning|good afternoon|good evening)\b(?!\s*[,.])/gi,
  I_FORMS: /\bi('m|\b|'ve|'ll|'d)\b/gi,
} as const;
