
// src/services/geminiHelpers.ts

/**
 * Extracts readable text from various Gemini API response structures.
 * @param response The Gemini API response object.
 * @returns Extracted text string or an empty string if no usable text is found.
 */
export const extractTextFromGeminiResponseStructure = (response: any): string => {
  if (!response) return '';

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  if (!Array.isArray(parts)) return '';

  // 1. Prioritize direct text part
  const textPart = parts.find((p: any) => typeof p.text === 'string');
  if (textPart && typeof textPart.text === 'string' && textPart.text.trim()) {
    return textPart.text.trim();
  }

  // 2. Check for functionCall with relevant arguments
  const functionCallPart = parts.find((p: any) => p.functionCall?.args);
  if (functionCallPart?.functionCall?.args) {
    const args = functionCallPart.functionCall.args;
    const possibleTextArgs = [args.caption, args.description, args.alt_text, args.summary, args.title, args.text];
    for (const arg of possibleTextArgs) {
      if (typeof arg === 'string' && arg.trim()) {
        return arg.trim();
      }
    }
  }

  // 3. Check for application/json part
  const jsonPart = parts.find((p: any) => p.mimeType === 'application/json' && typeof p.text === 'string');
  if (jsonPart?.text) {
    try {
      const jsonObj = JSON.parse(jsonPart.text);
      const possibleKeys = ['caption', 'description', 'text', 'label', 'labels', 'tags', 'title', 'summary'];
      for (const key of possibleKeys) {
        if (typeof jsonObj[key] === 'string' && jsonObj[key].trim()) {
          return jsonObj[key].trim();
        }
        if (Array.isArray(jsonObj[key])) {
          const stringArray = jsonObj[key].filter((item: any) => typeof item === 'string').map((s: string) => s.trim());
          if (stringArray.length > 0) {
            return stringArray.join(', ');
          }
        }
      }
      // If no specific keys, but the JSON itself is a string (less likely for structured JSON)
      if(typeof jsonObj === 'string' && jsonObj.trim()) return jsonObj.trim();

    } catch (e) {
      // If JSON parsing fails but jsonPart.text exists, return it as a fallback (it might be malformed JSON but still text)
      console.warn("Failed to parse JSON part, returning raw text:", e);
      return jsonPart.text.trim();
    }
  }
  
  // 4. If a part has inlineData and a common text mime type (less common for generateContent, more for multimodal)
  const inlineTextDataPart = parts.find((p: any) => p.inlineData?.data && (p.inlineData.mimeType === 'text/plain' || p.inlineData.mimeType === 'text/markdown'));
  if (inlineTextDataPart?.inlineData?.data) {
    try {
        // Assuming data is base64 encoded string for text types, though unusual.
        // This part might need adjustment based on actual Gemini behavior for such cases.
        // For now, we'll assume if it's text/plain, the 'data' might be the text directly or needs simple decoding.
        // However, typically for text, it would be in part.text. This is a very deep fallback.
        // Let's assume for now 'data' in this context is not typically how text is returned.
    } catch (e) {
        console.warn("Error processing inlineData text part:", e);
    }
  }


  // 5. Fallback to stringifying the parts for debugging if absolutely no text found, but return empty for app flow.
  // console.warn("Gemini: No directly extractable text found in response parts. Parts:", JSON.stringify(parts, null, 2).slice(0,1000));
  return '';
};
