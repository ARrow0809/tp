
// src/services/posePersonaFilter.ts

// Words that, if found in a line/segment, should cause that entire line/segment to be discarded.
// This list should be curated carefully.
export const EXPLICIT_WORDS_FOR_POSE_FILTER: string[] = [
  'genitals', 'penis', 'vagina', 'nipples', '乳首', '陰部', '性器', '裸', '全裸',
  'cum', 'semen', 'ejaculation', 'rape', 'molest', 'noncon', 'bestiality', 'lolicon', 'shotacon',
  'fellatio', 'cunnilingus', 'spitroast', 'gangbang', 'orgy', 'incest', 'guro', 'gore',
  // Add more terms that are unequivocally problematic for any descriptive line
];

const POSE_KEYWORDS_REGEX = /\b(standing|sitting|lying|running|jumping|walking|crouching|kneeling|leaning|dancing|flying|swimming|posing|action pose|dynamic pose|looking at viewer|facing away|profile shot|profile|side view|from above|from below|full body|upper body|cowboy shot|portrait|close-up)\b/i;

/**
 * Filters text to remove lines containing explicit words and then attempts
 * to categorize the remaining text into pose and persona descriptions.
 *
 * @param text The input string to sanitize and categorize.
 * @returns An object containing poseDescription, personaDescription, and rawFilteredDescription.
 */
export const sanitizeAndCategorizeDescription = (text: string): {
  poseDescription: string;
  personaDescription: string;
  rawFilteredDescription: string;
} => {
  if (!text || typeof text !== 'string') {
    return { poseDescription: '', personaDescription: '', rawFilteredDescription: '' };
  }

  const lines = text.split(/\n|,/); // Split by newline or comma
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      let isExplicit = false;
      for (const explicitWord of EXPLICIT_WORDS_FOR_POSE_FILTER) {
        // Whole word, case-insensitive match
        const pattern = new RegExp(`\\b${explicitWord}\\b`, 'i');
        if (pattern.test(trimmedLine)) {
          isExplicit = true;
          break;
        }
      }
      if (!isExplicit) {
        cleanedLines.push(trimmedLine);
      }
    }
  }

  const rawFilteredDescription = cleanedLines.join(', ');

  const poseLines: string[] = [];
  const personaLines: string[] = [];

  cleanedLines.forEach(line => {
    if (POSE_KEYWORDS_REGEX.test(line)) {
      poseLines.push(line);
    } else {
      personaLines.push(line);
    }
  });

  return {
    poseDescription: poseLines.join(', '),
    personaDescription: personaLines.join(', '),
    rawFilteredDescription: rawFilteredDescription,
  };
};
