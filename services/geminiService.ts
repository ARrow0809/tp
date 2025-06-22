
import { GoogleGenAI, GenerateContentResponse, Part, Content } from "@google/genai";
import { MIDJOURNEY_PARAMS, GEMINI_TEXT_MODEL_NAME, IMAGEN_MODEL_NAME, QUALITY_JUNK_TAGS, BANNED_WORDS } from "../constants";

let ai: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
  // APIキーを取得する優先順位:
  // 1. process.env.API_KEY (環境変数)
  // 2. localStorage から復号化して取得 (ユーザー設定)
  let apiKey = process.env.API_KEY;
  
  // process.env.API_KEY が 'stored-key-exists' の場合、実際のキーをlocalStorageから取得
  if (apiKey === 'stored-key-exists' && typeof window !== 'undefined') {
    try {
      const apiKeysEncrypted = localStorage.getItem('secure_api_keys');
      const selectedApiType = localStorage.getItem('selected_api_type') || 'gemini';
      
      if (apiKeysEncrypted) {
        // 暗号化されたAPIキーを復号化
        // 注: この実装では簡易的な暗号化を使用しているため、完全に安全ではありません
        const decryptApiKey = (encryptedText: string): string => {
          try {
            // Base64デコード
            const base64Decoded = atob(encryptedText);
            
            // 簡易的な暗号化キー
            const ENCRYPTION_KEY = 'tagPromptBuilderSecureKey2023';
            
            // XOR復号化
            let result = '';
            for (let i = 0; i < base64Decoded.length; i++) {
              const charCode = base64Decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
              result += String.fromCharCode(charCode);
            }
            
            return result;
          } catch (error) {
            console.error('Decryption error:', error);
            return '';
          }
        };
        
        const decryptedKeys = JSON.parse(decryptApiKey(apiKeysEncrypted));
        apiKey = decryptedKeys[selectedApiType];
      }
    } catch (error) {
      console.error('Error retrieving API key from localStorage:', error);
    }
  }
  
  if (!apiKey || apiKey === 'stored-key-exists') {
    console.error("API_KEY is not set. Gemini related functions will fail.");
    throw new Error("API_KEY 環境変数が設定されていません。APIキー設定ボタンからAPIキーを設定してください。");
  }
  
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const predefinedTranslations: Record<string, string> = {
  "portrait": "肖像",
  "young woman": "若い女性",
  "looking down": "下を見る",
  "long dark hair": "長い黒髪",
  "outdoor": "屋外",
  "natural light": "自然光",
  "blurry background": "ぼやけた背景",
  "soft focus": "ソフトフォーカス",
  "white": "白",
  "red eyes": "赤い目",
  "pink hair": "ピンクの髪",
  // Add more predefined translations as needed
};

// callGemini handles various prompt types and returns the generated text.
const callGemini = async (
  promptParameter: string | Part | (string | Part)[],
  systemInstruction?: string,
  model: string = GEMINI_TEXT_MODEL_NAME 
): Promise<string> => {
  try {
    const geminiAI = getAiInstance();
    
    let apiContentsParameter: Content;

    if (typeof promptParameter === 'string') {
      apiContentsParameter = { parts: [{ text: promptParameter }] };
    } else if (Array.isArray(promptParameter)) {
      const partsArray: Part[] = promptParameter.map(p => 
        typeof p === 'string' ? { text: p } : p
      );
      apiContentsParameter = { parts: partsArray };
    } else { 
      apiContentsParameter = { parts: [promptParameter] };
    }

    const requestPayload: { model: string; contents: Content; config?: { systemInstruction?: string } } = {
        model: model,
        contents: apiContentsParameter,
    };

    if (systemInstruction) {
        requestPayload.config = { systemInstruction };
    }

    const response: GenerateContentResponse = await geminiAI.models.generateContent(requestPayload);

    // Check for safety ratings or prohibited content first
    if (response.candidates && response.candidates.length > 0) {
        const mainCandidate = response.candidates[0];
        if (mainCandidate.finishReason === "PROHIBITED_CONTENT" || mainCandidate.finishReason === "SAFETY") {
            console.error("Gemini API call blocked due to prohibited content or safety settings:", response.candidates[0].finishReason, response);
            // Throw a special marker error instead of detailed user message
            throw new Error("AI_REQUEST_BLOCKED");
        }
        if (mainCandidate.finishReason && mainCandidate.finishReason !== "STOP" && mainCandidate.finishReason !== "MAX_TOKENS" && mainCandidate.finishReason !== "FINISH_REASON_UNSPECIFIED") {
             console.error(`Gemini API call finished with unexpected reason: ${mainCandidate.finishReason}`, response);
             throw new Error(`Gemini APIの処理が予期せず終了しました (理由: ${mainCandidate.finishReason})。`);
        }
    }
    
    const textOutput = response.text;
    
    if (typeof textOutput !== 'string') { // Only check if it's not a string type
        console.error("Gemini API returned non-string response for text, despite no explicit blocking finishReason:", response);
        throw new Error("Gemini APIが予期しない形式のレスポンスを返しました (テキストではありません)。");
    }
    // Allow empty strings to be returned. The calling function can decide if an empty string is an error.
    return textOutput;

  } catch (e: any) {
    if (e.message === "AI_REQUEST_BLOCKED") { // Check for the special marker
        throw e; // Re-throw for App.tsx to handle specifically
    }
    if (e.message.includes("API_KEY") || e.message.includes("APIキー")) {
        throw new Error("APIキーが設定されていないか無効です。APIキー設定ボタンからAPIキーを設定してください。");
    }
    console.error("Gemini API call error:", e);
    throw new Error(`Gemini API呼び出しエラー: ${e.message || e.toString()}`);
  }
};

// Helper to strip common prefixes from AI-generated prompts
const stripPromptPrefix = (text: string): string => {
  const prefixesToRemove = [
    "Here is your Midjourney prompt:",
    "Here's your Midjourney prompt:",
    "Midjourney prompt:",
    "ImagePrompt:",
    "Here is your prompt:",
    "Here's your prompt:",
    "Prompt:",
  ];
  let cleanedText = text.trim();
  for (const prefix of prefixesToRemove) {
    if (cleanedText.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleanedText = cleanedText.substring(prefix.length).trim();
    }
  }
  cleanedText = cleanedText.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '').trim();
  if (text.includes("キャラクター名：") && !cleanedText.startsWith("キャラクター名：") && !cleanedText.includes("キャラクター名：")) {
    const nameMatch = text.match(/キャラクター名：(.*?)(?:\n詳細：|$)/s);
    if (nameMatch && nameMatch[1]) {
        cleanedText = `キャラクター名：${nameMatch[1].trim()}\n${cleanedText}`;
    }
  }
   if (text.includes("詳細：") && !cleanedText.includes("詳細：")) {
    const detailMatch = text.match(/詳細：(.*)/s);
    if (detailMatch && detailMatch[1]) {
        if (!cleanedText.includes("キャラクター名：")) { 
             cleanedText = `詳細：${detailMatch[1].trim()}`;
        } else { 
            cleanedText = cleanedText.replace(/(\nキャラクター名：.*?)(\n|$)/s, `$1\n詳細：${detailMatch[1].trim()}$2`);
            if(!cleanedText.includes("詳細：")) cleanedText += `\n詳細：${detailMatch[1].trim()}`;
        }
    }
  }
  
  if (cleanedText === "キャラクター名：" || cleanedText === "詳細：") {
      return "";
  }

  return cleanedText;
};

// Helper function to filter sensitive words
export const filterSensitiveWords = (prompt: string, bannedWordsList: string[]): string => {
  let filteredPrompt = prompt;
  for (const word of bannedWordsList) {
    // Escape special regex characters in the word itself
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escapedWord}\\b`, "gi");
    filteredPrompt = filteredPrompt.replace(pattern, "");
  }

  // Clean up: normalize multiple spaces, handle commas, then trim.
  filteredPrompt = filteredPrompt.replace(/\s+/g, ' ').trim(); // Normalize spaces first
  filteredPrompt = filteredPrompt.replace(/,\s*,/g, ',');    // "a, ,b" -> "a,b"
  filteredPrompt = filteredPrompt.replace(/,,+/g, ',');       // "a,,b" -> "a,b"
  filteredPrompt = filteredPrompt.replace(/^,|,$/g, '');     // ",a,b," -> "a,b"
  filteredPrompt = filteredPrompt.replace(/\s*,/g, ',');      // "a ,b" -> "a,b"
  filteredPrompt = filteredPrompt.replace(/,\s+/g, ',');      // "a, b" -> "a,b" (temporarily remove space after comma)
  
  // Re-add a single space after commas for readability, unless it's the end of the string
  filteredPrompt = filteredPrompt.split(',').map(s => s.trim()).filter(s => s.length > 0).join(', ');
  
  return filteredPrompt.trim(); // Final trim
};


export const generateJapaneseDescription = async (midjourneyPrompt: string): Promise<string> => {
  const systemInstruction = `あなたは創造的なアシスタントです。以下の英語のMidjourneyプロンプトに基づいて、情景が目に浮かぶような、美しく詳細な日本語のシーン説明文を1つ生成してください。説明文のみを出力し、前置きや後書きは一切含めないでください。プロンプト: "${midjourneyPrompt}"`;
  const description = await callGemini(midjourneyPrompt, systemInstruction); 
  return stripPromptPrefix(description);
};

export const generateImagePromptNaturalLanguage = async (promptText: string, applySensitiveFilter: boolean = false, isFromPinginfo: boolean = false): Promise<string> => {
  const systemInstruction = `あなたはプロンプトエンジニアです。以下のキーワードを組み合わせて、高品質なAI画像生成に適した、自然言語の詳細な英語のプロンプト文を1つ作成してください。
  プロンプト文のみを出力し、前置き、後書き、その他の説明は一切含めないでください。
  Stable Diffusionのような括弧とコロンを使った重み付け（例: (word:1.2)）や、角括弧 [], 波括弧 {} を使った強調は絶対に含めないでください。
  'best quality', 'photorealistic', 'masterpiece', 'ultra detailed' のような一般的な品質向上タグは、それが入力キーワードの主要な芸術的スタイルでない限り、含めないでください。`;
  let ipPrompt = await callGemini(promptText, systemInstruction);
  ipPrompt = stripPromptPrefix(ipPrompt);
  ipPrompt = cleanImagePromptString(ipPrompt); // Clean AI output
  
  if (applySensitiveFilter) { // Unified filter application
    console.log(`Applying sensitive word filter to ImagePrompt (Natural Language) - Origin: ${isFromPinginfo ? "PingInfo" : "General"}.`);
    ipPrompt = filterSensitiveWords(ipPrompt, BANNED_WORDS);
  }
  return ipPrompt;
};

export const generateMidjourneyPrompt = async (promptText: string, applySensitiveFilter: boolean = false, isFromPinginfo: boolean = false): Promise<string> => {
  const systemInstruction = `あなたはプロンプトエンジニアです。以下のキーワードを元に、Midjourneyで魅力的な画像を生成するための英語のプロンプトを作成してください。構成やスタイルも考慮してください。
  プロンプトの末尾には必ず「${MIDJOURNEY_PARAMS}」という文字列を追加してください。
  プロンプト文字列のみを出力し、それ以外の前置き、後書き、説明（「ポイント：」など）、キーワードの強調（アスタリスク**など）は一切含めないでください。
  Stable Diffusionのような括弧とコロンを使った重み付け（例: (word:1.2)）や、角括弧 [], 波括弧 {} を使った強調は絶対に含めないでください。
  'best quality', 'photorealistic', 'masterpiece', 'ultra detailed' のような一般的な品質向上タグは、それが入力キーワードの主要な芸術的スタイルでない限り、含めないでください。`;
  let mjPrompt = await callGemini(promptText, systemInstruction);
  mjPrompt = stripPromptPrefix(mjPrompt);
  mjPrompt = cleanImagePromptString(mjPrompt); // Clean AI output
  mjPrompt = mjPrompt.replace(/\*\*/g, ''); // Remove any remaining asterisks (sometimes AI adds them for emphasis)

  // Ensure params are at the end and not duplicated
  const cleanedBasePrompt = mjPrompt.replace(new RegExp(MIDJOURNEY_PARAMS.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'gi'), '').trim();
  mjPrompt = cleanedBasePrompt + MIDJOURNEY_PARAMS;
  
  if (applySensitiveFilter) { // Unified filter application
    console.log(`Applying sensitive word filter to Midjourney prompt - Origin: ${isFromPinginfo ? "PingInfo" : "General"}.`);
    mjPrompt = filterSensitiveWords(mjPrompt, BANNED_WORDS);
  }
  return mjPrompt;
};

export const translateToJapanese = async (text: string): Promise<string> => {
  const lowerText = text.toLowerCase();
  if (predefinedTranslations[lowerText]) {
    return predefinedTranslations[lowerText];
  }
  const systemInstruction = "以下の英語のテキストを自然な日本語に翻訳してください。翻訳結果の日本語のみを返してください。";
  return callGemini(text, systemInstruction);
};

const BULK_TRANSLATION_DELIMITER = "|||";

export const translateTagsToJapaneseBulk = async (englishTagNames: string[]): Promise<string[]> => {
  if (englishTagNames.length === 0) return [];

  const results: string[] = new Array(englishTagNames.length);
  const tagsToTranslateViaAPI: Array<{ original: string; index: number }> = [];

  for (let i = 0; i < englishTagNames.length; i++) {
    const lowerText = englishTagNames[i].toLowerCase();
    if (predefinedTranslations[lowerText]) {
      results[i] = predefinedTranslations[lowerText];
    } else {
      tagsToTranslateViaAPI.push({ original: englishTagNames[i], index: i });
    }
  }

  if (tagsToTranslateViaAPI.length === 0) {
    return results; // All tags were found in predefined translations
  }

  const apiInputString = tagsToTranslateViaAPI.map(t => t.original).join(BULK_TRANSLATION_DELIMITER);
  
  const systemInstruction = `You are a precise translator. Translate each English term in the following "${BULK_TRANSLATION_DELIMITER}" delimited list into a concise Japanese equivalent.
Preserve the "${BULK_TRANSLATION_DELIMITER}" delimiter in your output, ensuring the number of translated segments matches the number of input segments.
Input terms example: "red car${BULK_TRANSLATION_DELIMITER}blue sky${BULK_TRANSLATION_DELIMITER}green grass"
Expected output format example: "赤い車${BULK_TRANSLATION_DELIMITER}青い空${BULK_TRANSLATION_DELIMITER}緑の草"
Output only the translated segments, delimited by "${BULK_TRANSLATION_DELIMITER}". Do not add any preamble, explanation, or markdown.`;
  
  try {
    const translatedBulkString = await callGemini(apiInputString, systemInstruction);
    const translatedSegments = translatedBulkString.split(BULK_TRANSLATION_DELIMITER);

    if (translatedSegments.length === tagsToTranslateViaAPI.length) {
      for (let i = 0; i < tagsToTranslateViaAPI.length; i++) {
        results[tagsToTranslateViaAPI[i].index] = translatedSegments[i].trim();
      }
    } else {
      console.warn(`Bulk translation segment count mismatch. Input count: ${tagsToTranslateViaAPI.length}, Output count: ${translatedSegments.length}. Input: "${apiInputString}", Translated: "${translatedBulkString}". Filling with original English names.`);
      for (const tag of tagsToTranslateViaAPI) {
        results[tag.index] = tag.original; // Fallback to original English name
      }
    }
  } catch (error) {
    console.error("Error during bulk translation API call:", error);
    for (const tag of tagsToTranslateViaAPI) {
      results[tag.index] = tag.original; // Fallback to original English name on API error
    }
  }
  return results;
};


export const translateToEnglish = async (text: string): Promise<string> => {
  const systemInstruction = "以下の日本語のテキストを自然で簡潔な英語に翻訳してください。翻訳結果の英語のみを返してください。";
  return callGemini(text, systemInstruction);
};

export const extractEnglishKeywordsFromJapaneseText = async (japaneseText: string): Promise<string> => {
  if (!japaneseText.trim()) return "";
  const systemInstruction = `Extract a concise list of 10-20 English keywords suitable for AI image generation from the following Japanese text. 
  Output ONLY a comma-separated list of these English keywords. 
  Do not include numbering, explanations, markdown, or any prefix. Focus on nouns, adjectives, and key actions or visual elements.
  Example Input: "沖縄の高級ホテルのビーチで、白いデッキチェアに仰向けに寝そべる、パステルカラーのビキニを着たツインテールの少女。濡れた体は光り、アンニュイな表情でこちらを見ている。"
  Example Output: "okinawa, luxury hotel, beach, white deck chair, lying on back, pastel color bikini, twintails, girl, wet body, shiny skin, looking at viewer, ambiguous face"
  Text: "${japaneseText}"`;
  const keywords = await callGemini(japaneseText, systemInstruction); // Pass Japanese text as the main prompt
  return keywords.trim();
};


export const extractTagsFromImage = async (base64ImageData: string, mimeType: string): Promise<string[]> => {
  const imagePart: Part = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };
  const textPart: Part = { 
    text: `This image likely contains a character. Analyze it carefully and extract 5-15 concise English tags suitable for AI image generation.
Output ONLY a comma-separated list of these English tags. Do not include numbering, explanations, or any prefix.

Prioritize the following details with high information density, ensuring comprehensive coverage if present:
1.  **Race/Ethnicity**: (e.g., Japanese person, Caucasian, Black person, elf). If human and ethnicity is ambiguous but could be East Asian, strongly prefer 'Japanese person'.
2.  **Age**: (e.g., child, teenager, young adult, adult, middle-aged, elderly).
3.  **Gender**: (e.g., 1girl, 1boy, woman, man).
4.  **Body Type**: (e.g., slim, athletic build, curvy, chubby, tall build, short stature, average build).
5.  **Clothing**: Describe notable clothing items (e.g., school uniform, t-shirt, jeans, dress, hoodie, swimsuit, kimono, suit). Be specific if possible (e.g., red dress, blue hoodie).
6.  **Face**:
    *   Eyebrows (e.g., arched eyebrows, straight eyebrows, thick eyebrows, worried eyebrows).
    *   Eyelashes (e.g., long eyelashes, thick eyelashes).
    *   Eye shape & color (e.g., tsurime, tareme, closed eyes, wide-eyed, upturned eyes, blue eyes, red eyes, heterochromia).
    *   Pupils (e.g., sparkling eyes, star-shaped pupils, heart-shaped pupils, slit pupils).
    *   Nose (e.g., small nose, aquiline nose, button nose).
    *   Mouth & Lips (e.g., open mouth, smile, full lips, tongue out, small mouth).
    *   Face shape (e.g., oval face, round face, square face, sharp chin).
    *   Undereye (e.g., eyebags, dark circles).
    *   Other facial features (e.g., mole, freckles).
7.  **Hair**:
    *   Length (e.g., short hair, long hair, bald, very short hair, shoulder-length hair, short bangs, hair over eyes).
    *   Style (e.g., braid, ponytail, twintails, wavy hair, curly hair, straight hair, slicked back hair, bob cut).
    *   Color (e.g., black hair, blonde hair, pink hair, red hair, blue hair, silver hair).
8.  **Action/Pose**: (e.g., standing, sitting, running, waving hand, arms crossed, looking at viewer, dancing, holding object).
9.  **Expression**: (e.g., smile, sad face, angry face, surprised, blushing, crying, serious expression, smirking, happy face, neutral expression).
10. **Overall Style/Impression**: (e.g., photorealistic, anime style, illustration, cute, cool, elegant).

Keep other tags (like general background descriptions unless highly prominent, or very minor accessory details) to a minimum if the above list is already comprehensive.
Example: Japanese person, young adult, 1girl, slim, school uniform, arched eyebrows, long eyelashes, blue eyes, oval face, small nose, long hair, wavy hair, blonde hair, standing, smile, photorealistic`,
  };

  const promptForGemini: Part[] = [imagePart, textPart];
  try {
    const responseText = await callGemini(promptForGemini); 
    if (responseText.trim().length === 0) {
      return []; // No tags found if response is empty
    }
    return responseText.split(',').map(tag => tag.trim().replace(/\*\*/g, '')).filter(tag => tag.length > 0 && tag.length < 50);
  } catch (e: any) {
    // If callGemini throws an error (e.g., AI_REQUEST_BLOCKED, or other API issues),
    // it will be caught by the caller in App.tsx.
    // We don't need to specifically handle the "empty response" error here anymore
    // as callGemini will pass empty strings through.
    // If it's a different error, re-throw it.
    console.error("Error in extractTagsFromImage during callGemini:", e);
    throw e; 
  }
};

export const generateCharacterPersona = async (themeName: string, isRandom: boolean = false): Promise<string> => {
  let systemInstruction: string;

  if (isRandom) { // This is for the AI random theme selection
    systemInstruction = `あなたはキャラクター設定の達人です。ユニークで魅力的なキャラクターのペルソナを1人、完全にランダムなテーマで創作してください。
ペルソナには、キャラクター名、外見（髪型、髪色、目の色、服装、特徴的なアクセサリーなど）、性格や役割（例: 勇敢な剣士、謎めいた魔術師、陽気な冒険家など）を詳細に記述してください。説明は、AI画像生成プロンプトのキーワードとして利用しやすいように、具体的かつ簡潔な言葉を多く含めてください。
出力形式は必ず以下に従ってください：
キャラクター名：[生成されたキャラクター名]
詳細：[生成されたキャラクターの詳細説明。複数のキーワードを含むように。]
上記形式で、完全にランダムなオリジナルのキャラクター名とその詳細説明を日本語で生成してください。`;
  } else {
    systemInstruction = `あなたはキャラクター設定の達人です。以下のテーマに沿ったユニークで魅力的なキャラクターのペルソナを1人創作してください。
テーマ： ${themeName}
ペルソナには、キャラクター名、外見（髪型、髪色、目の色、服装、特徴的なアクセサリーなど）、性格や役割（例: 勇敢な剣士、謎めいた魔術師、陽気な冒険家など）を詳細に記述してください。説明は、AI画像生成プロンプトのキーワードとして利用しやすいように、具体的かつ簡潔な言葉を多く含めてください。
出力形式は必ず以下に従ってください：
キャラクター名：[生成されたキャラクター名]
詳細：[生成されたキャラクターの詳細説明。複数のキーワードを含むように。]
上記形式で、指定されたテーマ「${themeName}」に基づいたオリジナルのキャラクター名とその詳細説明を日本語で生成してください。`;
  }
  
  const personaPrompt = isRandom ? "「ペルソナ生成」のテーマに基づいて、完全にランダムなキャラクターペルソナを1つ生成してください。" : `テーマ「${themeName}」のキャラクターペルソナを生成してください。`;
  const personaText = await callGemini(personaPrompt, systemInstruction);

  let finalPersonaText = personaText;
  if (!finalPersonaText.includes("キャラクター名：") && personaText.length > 0) {
      const lines = personaText.split('\n');
      if (lines.length > 1 && lines[0].length < 30) { 
          finalPersonaText = `キャラクター名：${lines[0].trim()}\n詳細：${lines.slice(1).join('\n').trim()}`;
      } else {
         finalPersonaText = `キャラクター名：名無しさん\n詳細：${personaText.trim()}`; 
      }
  } else if (!finalPersonaText.includes("詳細：") && finalPersonaText.includes("キャラクター名：")) {
      const namePartMatch = finalPersonaText.match(/(キャラクター名：.*?)(?:\n|$)/s);
      const namePart = namePartMatch ? namePartMatch[0] : `キャラクター名：不明\n`;
      const restPart = finalPersonaText.substring(namePart.length).trim();
      finalPersonaText = `${namePart.trim()}${restPart.startsWith("詳細：") ? "\n" + restPart : `\n詳細：${restPart}`}`;
  }


  return finalPersonaText;
};

export const extractTagsFromText = async (text: string): Promise<string[]> => {
  const detailMatch = text.match(/詳細：(.*)/s);
  const textForTagging = detailMatch && detailMatch[1] ? detailMatch[1].trim() : text;

  if (!textForTagging) return [];

  const systemInstruction = `このキャラクター説明文「${textForTagging}」から、AI画像生成に役立つ主要な要素やスタイルを示す英語のタグを10～15個抽出してください。タグはカンマ区切りで、各タグは簡潔にしてください。タグのリストのみを返し、前置きや説明は含めないでください。キャラクター名はタグに含めないでください。`;
  
  const responseText = await callGemini(textForTagging, systemInstruction);
  return responseText.split(',').map(tag => tag.trim().replace(/\*\*/g, '')).filter(tag => tag.length > 0 && tag.length < 50);
};

export const generateImageWithImagen = async (prompt: string): Promise<string> => {
  try {
    const geminiAI = getAiInstance();
    const response = await geminiAI.models.generateImages({
        model: IMAGEN_MODEL_NAME,
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      console.error("Imagen API did not return image bytes:", response);
      // Avoid throwing the specific error message to the user directly if it relates to safety.
      // The calling function in App.tsx will handle the generic "AI_REQUEST_BLOCKED" or other errors.
      if (response.generatedImages && response.generatedImages[0] && (response.generatedImages[0] as any).error) {
        // A more generic error if there's an error object in the response
         const imageError = (response.generatedImages[0] as any).error;
         if (imageError.code && (imageError.code === 7 || imageError.code === 8)) { // Specific safety codes
            throw new Error("AI_REQUEST_BLOCKED_IMAGE");
         }
         throw new Error("Imagen APIから画像データが返されませんでした。");
      }
      throw new Error("Imagen APIから画像データが返されませんでした。プロンプトが安全ポリシーに違反した可能性があります。");
    }
  } catch (e: any) {
    if (e.message === "AI_REQUEST_BLOCKED_IMAGE") {
        throw new Error("AI_REQUEST_BLOCKED"); // Normalize for App.tsx
    }
    if (e.message.includes("API_KEY") || e.message.includes("APIキー")) {
        throw new Error("APIキーが設定されていないか無効です。APIキー設定ボタンからAPIキーを設定してください。");
    }
    console.error("Imagen API call error:", e);
    throw new Error(`Imagen API呼び出しエラー: ${e.message || e.toString()}`);
  }
};


// --- Helper function to clean Stable Diffusion prompt strings ---
export const cleanImagePromptString = (rawPrompt: string): string => {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return "";
  }

  let cleanedPrompt = rawPrompt.replace(/\s+/g, ' ').trim();
  // Handle .BREAK. variations and ensure they become a single comma
  cleanedPrompt = cleanedPrompt.replace(/\s*\.?BREAK\.?\s*/gi, ',');
  cleanedPrompt = cleanedPrompt.replace(/,+/g, ','); // Consolidate multiple commas
  cleanedPrompt = cleanedPrompt.replace(/^,|,$/g, '').trim(); // Remove leading/trailing commas

  let parts = cleanedPrompt.split(',').map(p => p.trim()).filter(p => p.length > 0);
  let processedTagsInterim: string[] = [];

  for (let part of parts) {
    let currentTag = part;
    
    currentTag = currentTag.replace(/<lora:[^>]+>/gi, '').trim(); // Remove LORA
    
    // Iteratively remove emphasis syntax (half-width and full-width) until no more changes.
    let previousTagState;
    do {
        previousTagState = currentTag;
        // Weighted: (content:weight) or （内容：重み）
        currentTag = currentTag.replace(/[\(（]([^()（）:,]*?)[:：]([\d.]+?)[\)）]/g, '$1').trim();
        // Just parens: (content) or （内容）
        currentTag = currentTag.replace(/[\(（]([^()（）]*?)[\)）]/g, '$1').trim();
        // Brackets/Braces (less common with weights but good to be thorough)
        currentTag = currentTag.replace(/\[([^\[\]:,]*?)[:：]([\d.]+)\]/g, '$1').trim();
        currentTag = currentTag.replace(/\[([^\[\]]*?)\]/g, '$1').trim();
        currentTag = currentTag.replace(/\{([^\{\}:,]*?)[:：]([\d.]+)\}/g, '$1').trim();
        currentTag = currentTag.replace(/\{([^\{\}]*?)\}/g, '$1').trim();
    } while (previousTagState !== currentTag);
    
    // Remove empty parens/brackets/braces that might result
    currentTag = currentTag.replace(/^[\(（]\s*[\)）]$/, '').trim();
    currentTag = currentTag.replace(/^\[\s*\]$/, '').trim();
    currentTag = currentTag.replace(/^\{\s*\}$/, '').trim();
    
    // Remove leading/trailing dots and spaces from the tag itself
    currentTag = currentTag.replace(/^[\s.]*(.*?)[\s.]*$/, '$1').trim();

    if (currentTag.length > 0) {
        // Normalize multiple spaces and commas that might have been introduced
        currentTag = currentTag.replace(/\s+/g, ' ').replace(/,+/g, ',').replace(/^,|,$/g, '').trim();
        // If stripping syntax revealed internal commas, split them
        const subParts = currentTag.split(',').map(sp => sp.trim()).filter(sp => sp.length > 0);
        processedTagsInterim.push(...subParts);
    }
  }
  
  const qualityTagsLower = QUALITY_JUNK_TAGS.map(t => t.toLowerCase());
  const finalTagsPass1: string[] = [];

  for (const tag of processedTagsInterim) {
    const lowerTag = tag.toLowerCase();
    let isJunk = false;

    if (qualityTagsLower.includes(lowerTag)) {
      isJunk = true;
    } else {
      // Check for patterns like "keyword:value" where "keyword" is junk
      for (const junkKeyword of qualityTagsLower) {
        if (junkKeyword.length > 0 && lowerTag.startsWith(junkKeyword + ':')) {
          isJunk = true;
          break;
        }
      }
    }
    if (!isJunk && tag.trim().length > 0) {
      finalTagsPass1.push(tag.trim());
    }
  }

  // Deduplicate tags (case-insensitive)
  const finalTags: string[] = [];
  const seen = new Set<string>();
  for (const tag of finalTagsPass1) {
    const lowerTag = tag.toLowerCase();
    if (tag.trim().length > 0 && !seen.has(lowerTag)) {
      finalTags.push(tag);
      seen.add(lowerTag);
    }
  }
  
  return finalTags.join(', ');
};

// --- Start of new binary metadata extraction helpers ---
/** Find byte sequence (needle) in Uint8Array (haystack) */
const indexOfBytes = (haystack: Uint8Array, needle: Uint8Array, fromIndex: number = 0): number => {
  if (needle.length === 0) return 0;
  if (haystack.length === 0 || needle.length > haystack.length - fromIndex) return -1;

  for (let i = fromIndex; i <= haystack.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
};

/** Convert ASCII string to Uint8Array */
const stringToBytes = (str: string): Uint8Array => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
};

/** Check if a byte is a printable ASCII character (excluding control characters) */
const isPrintableAsciiByte = (byte: number): boolean => { 
  return byte >= 0x20 && byte <= 0x7E; // Space to Tilde
};

/** Extract a sequence of printable ASCII characters from a Uint8Array starting at a given position */
const slicePrintableAscii = (bytes: Uint8Array, start: number, maxLength: number = 4096): Uint8Array => {
  let end = start;
  // Read printable ASCII, newlines, carriage returns
  while (end < bytes.length && end < start + maxLength && (isPrintableAsciiByte(bytes[end]) || bytes[end] === 0x0A || bytes[end] === 0x0D)) {
    end++;
  }
  return bytes.slice(start, end);
};
// --- End of new binary metadata extraction helpers ---


// --- Updated Function for Metadata Extraction (PingInfo) using ArrayBuffer ---
export const extractPromptFromImageMetadata = (file: File): Promise<{ positivePrompt: string | null; negativePrompt: string | null; }> => {
  return new Promise((resolve, reject) => {
    if (!(file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp")) {
        reject(new Error("サポートされていないファイル形式です (PNG, JPEG, WebPのみ)。"));
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          resolve({ positivePrompt: null, negativePrompt: null });
          return;
        }

        const bytes = new Uint8Array(arrayBuffer);
        let rawPromptText = '';

        const userCommentEncodings = [
          { name: "ASCII", prefixBytes: stringToBytes("ASCII\0\0\0"), encoding: 'ascii' },
          { name: "UNICODE", prefixBytes: stringToBytes("UNICODE\0"), encoding: 'utf-16be' }, // Often big-endian
          { name: "JIS", prefixBytes: stringToBytes("JIS\0\0\0\0\0"), encoding: 'sjis' },
          { name: "UTF-8-Marker", prefixBytes: stringToBytes("UTF-8\0\0\0"), encoding: 'utf-8' }
        ];

        for (const enc of userCommentEncodings) {
          const prefixPos = indexOfBytes(bytes, enc.prefixBytes);
          if (prefixPos !== -1) {
            const textStartPos = prefixPos + enc.prefixBytes.length;
            const searchLimit = Math.min(bytes.length, textStartPos + 65536); // Search up to 65KB after prefix
            let endOfPrompt = textStartPos;
            
            while(endOfPrompt < searchLimit) {
                if (enc.encoding === 'ascii' || enc.encoding === 'sjis' || enc.encoding === 'utf-8') {
                    if (bytes[endOfPrompt] === 0x00) break;
                } else if (enc.encoding === 'utf-16be' || enc.encoding === 'utf-16le') {
                    if (bytes[endOfPrompt] === 0x00 && (endOfPrompt + 1 < searchLimit && bytes[endOfPrompt+1] === 0x00)) break;
                }
                endOfPrompt++;
            }
            
            const potentialPromptBytes = bytes.slice(textStartPos, endOfPrompt);
            try {
              const decoder = new TextDecoder(enc.encoding, { fatal: false, ignoreBOM: true });
              const decodedText = decoder.decode(potentialPromptBytes);
              if (decodedText.trim().length > 5) { // Relaxed check
                 rawPromptText = decodedText.trim();
                 break; 
              }
            } catch(decodeError) { /* console.warn(`Failed to decode UserComment with ${enc.name}:`, decodeError); */ }
          }
        }
        
        // Fallback for PNG 'parameters' (often tEXt chunk)
        if (!rawPromptText && file.type === "image/png") {
          const parametersKeywordBytes = stringToBytes("parameters");
          let keywordPos = indexOfBytes(bytes, parametersKeywordBytes);

          if (keywordPos !== -1) {
            let textStartPos = keywordPos + parametersKeywordBytes.length;
            // Skip common delimiters after "parameters" like NULL, colon, space, newline
            while(textStartPos < bytes.length && (bytes[textStartPos] === 0x00 || bytes[textStartPos] === 0x3A || bytes[textStartPos] === 0x20 || bytes[textStartPos] === 0x0A || bytes[textStartPos] === 0x0D || bytes[textStartPos] === 0x09)) {
                textStartPos++;
            }
            
            const searchLimit = Math.min(bytes.length, textStartPos + 65536);
            let endOfChunk = textStartPos;
            while(endOfChunk < searchLimit) {
                if (bytes[endOfChunk] === 0x00) { // Null terminator
                  // Check if it's potentially a UTF-16 null followed by another null
                  if (endOfChunk + 1 < searchLimit && bytes[endOfChunk+1] === 0x00) { 
                      // if the char before was also null or non-printable, it's likely a true end
                      if (endOfChunk > textStartPos && !isPrintableAsciiByte(bytes[endOfChunk-1]) && bytes[endOfChunk-1] !== 0x0A && bytes[endOfChunk-1] !== 0x0D) {
                        break;
                      }
                  } else if (endOfChunk > textStartPos && !isPrintableAsciiByte(bytes[endOfChunk-1])) {
                     // If single null and prev char wasn't printable, likely end of C-style string
                     break;
                  }
                  // Otherwise, a single null might be part of UTF-16, continue.
                }

                const nextFourBytes = bytes.slice(endOfChunk, endOfChunk + 4);
                if (nextFourBytes.length === 4) {
                    const chunkType = new TextDecoder('ascii', {fatal: false}).decode(nextFourBytes);
                    if (chunkType === "IEND" || chunkType === "IDAT" || chunkType === "pHYs" || chunkType === "tIME" || chunkType === "iTXt" || chunkType === "zTXt") {
                        break;
                    }
                }
                endOfChunk++;
            }
            const promptBytes = bytes.slice(textStartPos, endOfChunk);
            try {
                rawPromptText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(promptBytes).trim();
            } catch (e) { /* ignore decode error */ }
          }
        }
        
        // Generic fallback: find first longish printable ASCII block (UTF-8 aware for decoding)
        if (!rawPromptText) {
          let firstPrintableStart = -1;
          for (let i = 0; i < Math.min(bytes.length, 131072); i++) { // Scan first 128KB
             if ((bytes[i] >= 0x20 && bytes[i] <= 0x7E) || 
                (bytes[i] >= 0xC2 ) // Could be start of UTF-8 multi-byte
             ) { 
              const snippetBytes = bytes.slice(i, Math.min(i + 300, bytes.length)); // Try a longer snippet
              const snippetText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(snippetBytes);
              const commaCount = (snippetText.match(/,/g) || []).length;
              const parenthesisCount = (snippetText.match(/[\(\)（）]/g) || []).length;
              const lineBreakCount = (snippetText.match(/\n/g) || []).length;


              const potentialHeader = snippetText.substring(0,30).toLowerCase();
              if (snippetText.trim().length > 30 && (commaCount > 2 || parenthesisCount > 1 || lineBreakCount > 0) && 
                  !potentialHeader.startsWith("exif") && !potentialHeader.startsWith("http") &&
                  !potentialHeader.startsWith("icc_profile") && !potentialHeader.includes("<html") &&
                  !potentialHeader.includes("<?xml") && !potentialHeader.includes("adobe")) { 
                firstPrintableStart = i;
                break;
              }
            }
          }

          if (firstPrintableStart !== -1) {
            let endOfChunk = firstPrintableStart;
            const maxChunkLength = 65536; 
            const parameterKeywords = ["steps:", "sampler:", "cfg scale:", "seed:", "size:", "model hash:", "model:", "clip skip:", "denoising strength:", "version:", "hires upscale:", "hires upscaler:", "negative prompt:", "eta:", "ensd:"];
            
            let searchEnd = Math.min(bytes.length, firstPrintableStart + maxChunkLength);
            while(endOfChunk < searchEnd) {
                if (bytes[endOfChunk] === 0x00 && (endOfChunk + 1 >= searchEnd || bytes[endOfChunk+1] === 0x00 || !isPrintableAsciiByte(bytes[endOfChunk+1]))) { 
                    break; 
                }
                // Check for parameter keywords case-insensitively using string conversion
                const currentLookaheadLength = Math.min(40, searchEnd - endOfChunk); // Look ahead for keywords
                const lookaheadBytes = bytes.slice(endOfChunk, endOfChunk + currentLookaheadLength);
                const lookaheadString = new TextDecoder('ascii', {fatal: false}).decode(lookaheadBytes).toLowerCase();

                let keywordFound = false;
                for(const pk of parameterKeywords) {
                    if (lookaheadString.startsWith(pk)) {
                       keywordFound = true;
                       break;
                    }
                }
                if (keywordFound) break;
                endOfChunk++;
            }
            const printableBytes = bytes.slice(firstPrintableStart, endOfChunk);
            rawPromptText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(printableBytes).trim();
            rawPromptText = rawPromptText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ").replace(/\s+/g, " ").trim();
          }
        }
        
        if (!rawPromptText || rawPromptText.trim().length === 0) {
          resolve({ positivePrompt: null, negativePrompt: null });
          return;
        }
        
        let positivePart = rawPromptText;
        let negativePart: string | null = null;
        
        const negativePromptRegex = /Negative\s+Prompt\s*[:：]/i; 
        const npMatch = rawPromptText.match(negativePromptRegex);

        if (npMatch && typeof npMatch.index === 'number') {
            positivePart = rawPromptText.substring(0, npMatch.index).trim();
            const restAfterNegative = rawPromptText.substring(npMatch.index + npMatch[0].length);
            
            const endOfNegativeKeywords = ["Steps:", "Sampler:", "CFG scale:", "Seed:", "Size:", "Model hash:", "Model:", "Clip skip:", "Denoising strength:", "Version:", "Hires upscale:", "Hires upscaler:", "Lora hashes:", "TI hashes:", "ControlNet"];
            let endOfNegativeIndex = restAfterNegative.length;

            for (const keyword of endOfNegativeKeywords) {
                // Case-insensitive search for keywords
                const tempRestLower = restAfterNegative.toLowerCase();
                const keywordIndex = tempRestLower.indexOf(keyword.toLowerCase());
                if (keywordIndex !== -1 && keywordIndex < endOfNegativeIndex) {
                    endOfNegativeIndex = keywordIndex;
                }
            }
            negativePart = restAfterNegative.substring(0, endOfNegativeIndex).trim();
        }
        
        resolve({ 
            positivePrompt: positivePart.trim() || null, 
            negativePrompt: negativePart && negativePart.trim() ? negativePart.trim() : null
        });

      } catch (e: any) {
        console.error("Error processing file content for metadata (binary):", e);
        reject(new Error(`ファイル内容のバイナリ処理中にエラーが発生しました: ${e.message || e.toString()}`));
      }
    };

    reader.onerror = () => {
      console.error("FileReader error for metadata extraction (binary)");
      reject(new Error("ファイルのバイナリ読み取り中にエラーが発生しました。"));
    };
    
    reader.readAsArrayBuffer(file);

  });
};
