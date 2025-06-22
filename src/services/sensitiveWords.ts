// src/services/sensitiveWords.ts

export const BANNED_WORDS: string[] = [
  "nude", "naked", "undressed", "topless",
  "sex", "erotic", "porn", "explicit", 
  "genital", "genitalia", "pubic", "pubes", 
  "cleavage", 
  "nipples", "areola",
  "vagina", "pussy", "cunt",
  "penis", "cock", "dick", 
  "testicles", "scrotum",
  "anus", "ass", "buttocks", 
  "underboob", "sideboob",
  "pantie", "panties", "thong", "micro thong", "garter belt",
  "cum", "semen", 
  "urine", "piss", "feces", "scat",
  "fellatio", "blowjob",
  "cunnilingus",
  "irrumatio",
  "handjob",
  "footjob",
  "rape", "molest", "noncon", "non-consensual", "forced",
  "torture", "guro", "gore", "violence", "blood", "beheading", "decapitation", "kill", "murder",
  "bestiality", "zoo", 
  "incest",
  "orgy", "threesome", "foursome",
  "masturbation", "fingering",
  "lolicon", "loli", "shota", "shotacon", 
  "child abuse", "underage", "minor", "teen", // "boy", "girl" are too generic
  "implied nudity",
  "saggy", 
  "milf", 
  "sexy", 
  "vaginal", 
  "hanging", 
  "juice", 
  "2boys", 
  "erection", 
  "multiple penises", 
  "hetero", 
  "group", 
  "oral", 
  "spread legs", // This was in the OCR'd list, keeping it. App.tsx has differentiated versions like 'spread_legs_action' and 'spread_legs_nsfw'. The simple "spread legs" might be too broad.
  "spitroast", 
  "sweat", 
  "gangbang", 
  "double penetration", 
  "cowgirl position", 
  "female ejaculation", 
  "implied anal"
];

export interface SensitiveWordsFilterOptions {
  threshold?: number; // Example: if more than 'threshold' words are flagged, take stronger action. Not used by current logic.
  // replacementChar?: string; // Example: '*' to mask words
}

export const filterSensitiveWords = (
  prompt: string,
  options?: SensitiveWordsFilterOptions 
): { cleanedText: string; flagged: boolean } => {
  let filteredPrompt = prompt;
  let flagged = false;
  const wordsToFilter = BANNED_WORDS; 

  if (!prompt || typeof prompt !== 'string') {
    return { cleanedText: '', flagged: false };
  }

  for (const word of wordsToFilter) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escapedWord}\\b`, "gi");
    if (pattern.test(filteredPrompt)) {
        flagged = true;
        // Removes the matched word. App.tsx uses 'flagged' to show an info message.
        filteredPrompt = filteredPrompt.replace(pattern, ""); 
    }
  }

  // Clean up: normalize multiple spaces, handle commas, then trim.
  filteredPrompt = filteredPrompt.replace(/\s+/g, ' ').trim();
  filteredPrompt = filteredPrompt.replace(/,\s*,/g, ',');    
  filteredPrompt = filteredPrompt.replace(/,,+/g, ',');       
  filteredPrompt = filteredPrompt.replace(/^,|,$/g, '');     
  filteredPrompt = filteredPrompt.replace(/\s*,/g, ',');      
  filteredPrompt = filteredPrompt.replace(/,\s+/g, ',');      
  
  filteredPrompt = filteredPrompt.split(',').map(s => s.trim()).filter(s => s.length > 0).join(', ');
  
  return { cleanedText: filteredPrompt.trim(), flagged };
};
