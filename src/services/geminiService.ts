
import { GoogleGenAI, GenerateContentResponse, Part, GenerateContentParameters, Content as SDKContent, GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MIDJOURNEY_PARAMS, GEMINI_TEXT_MODEL_NAME, IMAGEN_MODEL_NAME, QUALITY_JUNK_TAGS } from "../constants";
import { extractTextFromGeminiResponseStructure } from './geminiHelpers';
// BANNED_WORDS is not used directly in this file anymore, App.tsx uses sensitiveWords.ts

let ai: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set in process.env. Gemini related functions will fail.");
    throw new Error("API_KEY 環境変数が設定されていません。");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
};


export const callGemini = async (
  promptParameter: string | Part | (string | Part)[],
  systemInstructionText?: string,
  model: string = GEMINI_TEXT_MODEL_NAME,
  generationConfigParam?: GenerationConfig,
  safetySettingsParam?: SafetySetting[]
): Promise<string> => {
  try {
    const geminiAI = getAiInstance();

    let sdkContentsParameter: string | Part[];

    if (typeof promptParameter === 'string') {
      sdkContentsParameter = promptParameter;
    } else if (Array.isArray(promptParameter)) {
      sdkContentsParameter = promptParameter.map(p =>
        typeof p === 'string' ? { text: p } : p
      );
    } else { // Single Part
      sdkContentsParameter = [promptParameter];
    }

    const requestParams: GenerateContentParameters = {
        model: model,
        contents: sdkContentsParameter,
        // config will be built below
    };

    if (systemInstructionText || generationConfigParam) {
        requestParams.config = {};
        if (systemInstructionText) {
            requestParams.config.systemInstruction = systemInstructionText;
        }
        if (generationConfigParam) {
            requestParams.config = {...requestParams.config, ...generationConfigParam};
        }
         // Ensure thinkingConfig is only added for the specific model
        if (model !== GEMINI_TEXT_MODEL_NAME && requestParams.config.thinkingConfig) {
            delete requestParams.config.thinkingConfig;
        } else if (model === GEMINI_TEXT_MODEL_NAME && generationConfigParam?.thinkingConfig === undefined) {
            // Default to thinking enabled if not specified for flash model, unless explicitly set to 0
            // The problem description states: "For All Other Tasks: Omit thinkingConfig entirely (defaults to enable thinking for higher quality)."
            // So, we don't add it here unless `generationConfigParam` explicitly sets it.
        }
    }

    if (safetySettingsParam) {
        requestParams.safetySettings = safetySettingsParam;
    }


    const geminiSDKResponseObject: GenerateContentResponse = await geminiAI.models.generateContent(requestParams);

    if (geminiSDKResponseObject?.promptFeedback?.blockReason) {
      console.warn('Gemini prompt blocked due to promptFeedback. Reason:', geminiSDKResponseObject.promptFeedback.blockReason, "Response (promptFeedback):", geminiSDKResponseObject.promptFeedback);
      throw new Error("AI_REQUEST_BLOCKED");
    }

    if (geminiSDKResponseObject.candidates && geminiSDKResponseObject.candidates.length > 0) {
        const mainCandidate = geminiSDKResponseObject.candidates[0];
        if (mainCandidate.finishReason === "SAFETY" || mainCandidate.finishReason === "PROHIBITED_CONTENT") {
            console.warn("Gemini API call candidate blocked due to finishReason:", mainCandidate.finishReason, "Response (candidate):", mainCandidate);
            throw new Error("AI_REQUEST_BLOCKED");
        }
        if (mainCandidate.finishReason && mainCandidate.finishReason !== "STOP" && mainCandidate.finishReason !== "MAX_TOKENS" && mainCandidate.finishReason !== "FINISH_REASON_UNSPECIFIED") {
             console.error(`Gemini API call finished with unexpected reason: ${mainCandidate.finishReason}`, geminiSDKResponseObject);
             throw new Error(`Gemini APIの処理が予期せず終了しました (理由: ${mainCandidate.finishReason})。`);
        }
    }

    let textOutput = geminiSDKResponseObject.text;

    if (typeof textOutput !== 'string' || textOutput.trim() === "") {
        const extractedFromStructure = extractTextFromGeminiResponseStructure(geminiSDKResponseObject);
        if (extractedFromStructure.trim() !== "") {
            textOutput = extractedFromStructure;
        } else if (typeof textOutput !== 'string') {
            console.warn("Gemini API returned non-string and unextractable response, but not blocked. Response parts:", geminiSDKResponseObject?.candidates?.[0]?.content?.parts);
             throw new Error("AI_REQUEST_BLOCKED");
        } else if (textOutput.trim() === "") {
            const hasNonEmptyContent = geminiSDKResponseObject?.candidates?.[0]?.content?.parts?.some(p => p.text && p.text.trim() !== "");
            if(!hasNonEmptyContent && (geminiSDKResponseObject?.promptFeedback?.blockReason || geminiSDKResponseObject?.candidates?.[0]?.finishReason === "SAFETY")) {
                 console.warn("Response text is empty likely due to safety filtering not caught by initial checks.");
                 throw new Error("AI_REQUEST_BLOCKED");
            }
            return "";
        }
    }
    return textOutput;

  } catch (e: any) {
    if (e.message === "AI_REQUEST_BLOCKED") {
        throw e;
    }
    if (e.message?.startsWith("API_KEY 環境変数")) {
        throw e;
    }
    console.error("Gemini API call error:", e);
    const errorMessageLower = e.message?.toLowerCase() || "";
    if (errorMessageLower.includes("safety") || errorMessageLower.includes("blocked") || errorMessageLower.includes("prohibited") || errorMessageLower.includes("policy")) {
        console.warn("Gemini API call potentially blocked by client-side safety check, policy, or other pre-emptive block:", e.message);
        throw new Error("AI_REQUEST_BLOCKED");
    }
    throw new Error(`Gemini API呼び出しエラー: ${e.message || e.toString()}`);
  }
};

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

  const originalHasName = text.includes("キャラクター名：");
  const originalHasDetail = text.includes("詳細：");

  if (originalHasName && !cleanedText.includes("キャラクター名：")) {
    const nameMatch = text.match(/キャラクター名：(.*?)(?:\n|$)/s);
    if (nameMatch && nameMatch[1]) {
      cleanedText = `キャラクター名：${nameMatch[1].trim()}\n${cleanedText.startsWith("詳細：") ? "" : "詳細："}${cleanedText.replace(/^詳細：/, '')}`;
    }
  }
  if (originalHasDetail && !cleanedText.includes("詳細：") && cleanedText.length > 0) {
     const detailMatch = text.match(/詳細：(.*)/s);
     if (detailMatch && detailMatch[1]) {
        if (!cleanedText.includes("キャラクター名：")) {
            cleanedText = `詳細：${detailMatch[1].trim()}`;
        } else if (!cleanedText.match(/\n詳細：/s)) {
            cleanedText = cleanedText.replace(/(キャラクター名：[^\n]+)/, `$1\n詳細：${detailMatch[1].trim()}`);
        }
     }
  }

  if (cleanedText === "キャラクター名：" || cleanedText === "詳細：" || cleanedText === "キャラクター名：\n詳細：") {
      return "";
  }

  return cleanedText;
};


export const generateJapaneseDescription = async (midjourneyPrompt: string): Promise<string> => {
  const systemInstruction = `あなたは創造的なアシスタントです。以下の英語のMidjourneyプロンプトに基づいて、情景が目に浮かぶような、美しく詳細な日本語のシーン説明文を1つ生成してください。説明文のみを出力し、前置きや後書きは一切含めないでください。プロンプト: "${midjourneyPrompt}"`;
  const description = await callGemini(midjourneyPrompt, systemInstruction);
  return stripPromptPrefix(description);
};

// Removed applySensitiveFilter flag and internal filtering. App.tsx will pre-filter.
export const generateImagePromptNaturalLanguage = async (promptText: string): Promise<string> => {
  const systemInstruction = `あなたはプロンプトエンジニアです。以下のキーワードを組み合わせて、高品質なAI画像生成に適した、自然言語の詳細な英語のプロンプト文を1つ作成してください。
  プロンプト文のみを出力し、前置き、後書き、その他の説明は一切含めないでください。
  Stable Diffusionのような括弧とコロンを使った重み付け（例: (word:1.2)）や、角括弧 [], 波括弧 {} を使った強調は絶対に含めないでください。
  'best quality', 'photorealistic', 'masterpiece', 'ultra detailed' のような一般的な品質向上タグは、それが入力キーワードの主要な芸術的スタイルでない限り、含めないでください。`;
  let ipPrompt = await callGemini(promptText, systemInstruction);
  ipPrompt = stripPromptPrefix(ipPrompt);
  ipPrompt = cleanImagePromptString(ipPrompt);
  return ipPrompt;
};

// Removed applySensitiveFilter flag and internal filtering. App.tsx will pre-filter.
export const generateMidjourneyPrompt = async (promptText: string): Promise<string> => {
  const systemInstruction = `あなたはプロンプトエンジニアです。以下のキーワードを元に、Midjourneyで魅力的な画像を生成するための英語のプロンプトを作成してください。構成やスタイルも考慮してください。
  プロンプトの末尾には必ず「${MIDJOURNEY_PARAMS}」という文字列を追加してください。
  プロンプト文字列のみを出力し、それ以外の前置き、後書き、説明（「ポイント：」など）、キーワードの強調（アスタリスク**など）は一切含めないでください。
  Stable Diffusionのような括弧とコロンを使った重み付け（例: (word:1.2)）や、角括弧 [], 波括弧 {} を使った強調は絶対に含めないでください。
  'best quality', 'photorealistic', 'masterpiece', 'ultra detailed' のような一般的な品質向上タグは、それが入力キーワードの主要な芸術的スタイルでない限り、含めないでください。`;
  let mjPrompt = await callGemini(promptText, systemInstruction);
  mjPrompt = stripPromptPrefix(mjPrompt);
  mjPrompt = cleanImagePromptString(mjPrompt);
  mjPrompt = mjPrompt.replace(/\*\*/g, '');

  const cleanedBasePrompt = mjPrompt.replace(new RegExp(MIDJOURNEY_PARAMS.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'gi'), '').trim();
  mjPrompt = cleanedBasePrompt + MIDJOURNEY_PARAMS;
  return mjPrompt;
};

export const translateToJapanese = async (text: string): Promise<string> => {
  if (!text || text.trim() === "") return "";
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
    return results;
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
        results[tag.index] = tag.original;
      }
    }
  } catch (error) {
    console.error("Error during bulk translation API call:", error);
    for (const tag of tagsToTranslateViaAPI) {
      results[tag.index] = tag.original;
    }
  }
  return results;
};


export const translateToEnglish = async (text: string): Promise<string> => {
  if (!text || text.trim() === "") return "";
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
  const keywords = await callGemini(japaneseText, systemInstruction);
  return keywords.trim();
};


export const generateCharacterPersona = async (themeName: string, isRandom: boolean = false): Promise<string> => {
  let systemInstruction: string;

  if (isRandom) {
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
      } else if (lines.length === 1 && lines[0].length < 30) {
          finalPersonaText = `キャラクター名：${lines[0].trim()}\n詳細：`;
      }
       else {
         finalPersonaText = `キャラクター名：名無しさん\n詳細：${personaText.trim()}`;
      }
  } else if (!finalPersonaText.includes("詳細：") && finalPersonaText.includes("キャラクター名：")) {
      const namePartMatch = finalPersonaText.match(/(キャラクター名：.*?)(?:\n|$)/s);
      const namePart = namePartMatch ? namePartMatch[0] : `キャラクター名：不明\n`;
      const restPart = finalPersonaText.substring(namePart.length).trim();
      finalPersonaText = `${namePart.trim()}${restPart.startsWith("詳細：") ? "\n" + restPart : `\n詳細：${restPart}`}`;
      if (finalPersonaText.endsWith("詳細：")) {
         finalPersonaText = finalPersonaText.trim();
      }
  }

  return finalPersonaText;
};

export const extractTagsFromText = async (text: string): Promise<string[]> => {
  const detailMatch = text.match(/詳細：(.*)/s);
  let textForTagging = detailMatch && detailMatch[1] ? detailMatch[1].trim() : text;

  const englishCharCount = (textForTagging.match(/[a-zA-Z]/g) || []).length;
  const japaneseCharCount = (textForTagging.match(/[\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/g) || []).length;

  if (englishCharCount > japaneseCharCount * 2 && englishCharCount > 20 && textForTagging.includes(',')) {
     const cleanedEnglishText = cleanImagePromptString(textForTagging);
     return cleanedEnglishText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0 && tag.length < 50);
  }

  if (!textForTagging) return [];

  const systemInstruction = `このキャラクター説明文または画像キャプション「${textForTagging}」から、AI画像生成に役立つ主要な要素やスタイルを示す英語のタグを10～20個抽出してください。タグはカンマ区切りで、各タグは簡潔にしてください。タグのリストのみを返し、前置きや説明は含めないでください。キャラクター名はタグに含めないでください。`;

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
      if (response.generatedImages && response.generatedImages[0] && (response.generatedImages[0] as any).error) {
         const imageError = (response.generatedImages[0] as any).error;
         if (imageError.code && (imageError.code === 7 || imageError.code === 8 || imageError.message?.toLowerCase().includes("safety"))) {
            throw new Error("AI_REQUEST_BLOCKED_IMAGE");
         }
         throw new Error("Imagen APIから画像データが返されませんでした。");
      }
      if ((response as any).promptFeedback?.blockReason) {
        console.warn('Imagen prompt blocked due to promptFeedback. Reason:', (response as any).promptFeedback.blockReason);
        throw new Error("AI_REQUEST_BLOCKED_IMAGE");
      }
      throw new Error("Imagen APIから画像データが返されませんでした。プロンプトが安全ポリシーに違反した可能性があります。");
    }
  } catch (e: any) {
    if (e.message === "AI_REQUEST_BLOCKED_IMAGE") {
        throw new Error("AI_REQUEST_BLOCKED");
    }
    if (e.message.startsWith("API_KEY 環境変数")) {
        throw e;
    }
    console.error("Imagen API call error:", e);
    throw new Error(`Imagen API呼び出しエラー: ${e.message || e.toString()}`);
  }
};


export const cleanImagePromptString = (rawPrompt: string): string => {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return "";
  }

  let cleanedPrompt = rawPrompt.replace(/\s+/g, ' ').trim();
  cleanedPrompt = cleanedPrompt.replace(/\s*\.?BREAK\.?\s*/gi, ',');
  cleanedPrompt = cleanedPrompt.replace(/,+/g, ',');
  cleanedPrompt = cleanedPrompt.replace(/^,|,$/g, '').trim();

  let parts = cleanedPrompt.split(',').map(p => p.trim()).filter(p => p.length > 0);
  let processedTagsInterim: string[] = [];

  for (let part of parts) {
    let currentTag = part;

    currentTag = currentTag.replace(/<lora:[^>]+>/gi, '').trim();

    let previousTagState;
    do {
        previousTagState = currentTag;
        currentTag = currentTag.replace(/[\(（]([^()（）:,]+?)[:：]([\d.]+?)[\)）]/g, '$1').trim();
        currentTag = currentTag.replace(/[\(（]([^()（）]+?)[\)）]/g, '$1').trim();
        currentTag = currentTag.replace(/\[([^\[\]:,]+?)[:：]([\d.]+)\]/g, '$1').trim();
        currentTag = currentTag.replace(/\[([^\[\]]+?)\]/g, '$1').trim();
        currentTag = currentTag.replace(/\{([^\{\}:,]+?)[:：]([\d.]+)\}/g, '$1').trim();
        currentTag = currentTag.replace(/\{([^\{\}]+?)\}/g, '$1').trim();
    } while (previousTagState !== currentTag);

    currentTag = currentTag.replace(/^[\(（]\s*[\)）]$/, '').trim();
    currentTag = currentTag.replace(/^\[\s*\]$/, '').trim();
    currentTag = currentTag.replace(/^\{\s*\}$/, '').trim();

    currentTag = currentTag.replace(/^[\s.]*(.*?)[\s.]*$/, '$1').trim();

    if (currentTag.length > 0) {
        currentTag = currentTag.replace(/\s+/g, ' ').replace(/,+/g, ',').replace(/^,|,$/g, '').trim();
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

const stringToBytes = (str: string): Uint8Array => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
};

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
          { name: "UNICODE", prefixBytes: stringToBytes("UNICODE\0"), encoding: 'utf-16be' },
          { name: "JIS", prefixBytes: stringToBytes("JIS\0\0\0\0\0"), encoding: 'sjis' },
          { name: "UTF-8-Marker", prefixBytes: stringToBytes("UTF-8\0\0\0"), encoding: 'utf-8' }
        ];

        for (const enc of userCommentEncodings) {
          const prefixPos = indexOfBytes(bytes, enc.prefixBytes);
          if (prefixPos !== -1) {
            const textStartPos = prefixPos + enc.prefixBytes.length;
            const searchLimit = Math.min(bytes.length, textStartPos + 65536);
            let endOfPrompt = textStartPos;

            while(endOfPrompt < searchLimit) {
                if (bytes[endOfPrompt] === 0x00) {
                    if (enc.encoding === 'utf-16be' || enc.encoding === 'utf-16le') {
                        if (endOfPrompt + 1 < searchLimit && bytes[endOfPrompt+1] === 0x00) break;
                    } else {
                        break;
                    }
                }
                if (bytes[endOfPrompt] < 0x20 &&
                    bytes[endOfPrompt] !== 0x0A &&
                    bytes[endOfPrompt] !== 0x0D &&
                    bytes[endOfPrompt] !== 0x09 &&
                    !(bytes[endOfPrompt] >= 0xC2 && bytes[endOfPrompt] <= 0xF4)
                   ) {
                        break;
                   }
                endOfPrompt++;
            }

            const potentialPromptBytes = bytes.slice(textStartPos, endOfPrompt);
            try {
              const decoder = new TextDecoder(enc.encoding, { fatal: false, ignoreBOM: true });
              const decodedText = decoder.decode(potentialPromptBytes);
              if (decodedText.trim().length > 5) {
                 rawPromptText = decodedText.trim();
                 break;
              }
            } catch(decodeError) { /* console.warn(`Failed to decode UserComment with ${enc.name}:`, decodeError); */ }
          }
        }

        if (!rawPromptText && file.type === "image/png") {
          const parametersKeywordBytes = stringToBytes("parameters");
          let keywordPos = indexOfBytes(bytes, parametersKeywordBytes);

          if (keywordPos !== -1) {
            let textStartPos = keywordPos + parametersKeywordBytes.length;
            while(textStartPos < bytes.length &&
                  (bytes[textStartPos] === 0x00 || bytes[textStartPos] === 0x3A ||
                   bytes[textStartPos] === 0x20 || bytes[textStartPos] === 0x0A ||
                   bytes[textStartPos] === 0x0D || bytes[textStartPos] === 0x09)) {
                textStartPos++;
            }

            const searchLimit = Math.min(bytes.length, textStartPos + 65536);
            let endOfChunk = textStartPos;
            const pngChunkKeywords = ["IEND", "IDAT", "pHYs", "tIME", "iTXt", "zTXt", "cHRM", "gAMA", "sRGB", "bKGD", "hIST", "tRNS", "sPLT", "iCCP"];

            while(endOfChunk < searchLimit) {
                if (endOfChunk + 8 <= searchLimit) {
                    let isLikelyChunkType = true;
                    for(let k=0; k<4; k++) {
                        if (!((bytes[endOfChunk + 4 + k] >= 0x41 && bytes[endOfChunk + 4 + k] <= 0x5A) || (bytes[endOfChunk + 4 + k] >= 0x61 && bytes[endOfChunk + 4 + k] <= 0x7A))) {
                           isLikelyChunkType = false; break;
                        }
                    }
                    if(isLikelyChunkType) {
                        const chunkType = new TextDecoder('ascii', {fatal: false}).decode(bytes.slice(endOfChunk + 4, endOfChunk + 8));
                        if (pngChunkKeywords.includes(chunkType)) {
                          break;
                        }
                    }
                }
                if (bytes[endOfChunk] === 0x00) {
                   if (endOfChunk + 1 >= searchLimit ||
                       (bytes[endOfChunk+1] < 0x20 && bytes[endOfChunk+1] !== 0x0A && bytes[endOfChunk+1] !== 0x0D && bytes[endOfChunk+1] !== 0x09 )) {
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

        if (!rawPromptText) {
          let firstPrintableStart = -1;
          for (let i = 0; i < Math.min(bytes.length, 131072); i++) {
             if ((bytes[i] >= 0x20 && bytes[i] <= 0x7E) ||
                (bytes[i] >= 0xC2 && bytes[i] <= 0xF4)
             ) {
              const snippetBytes = bytes.slice(i, Math.min(i + 500, bytes.length));
              const snippetText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(snippetBytes);
              const commaCount = (snippetText.match(/,/g) || []).length;
              const parenthesisCount = (snippetText.match(/[\(\)（）\[\]\{\}]/g) || []).length;
              const lineBreakCount = (snippetText.match(/[\n\r]/g) || []).length;
              const potentialHeader = snippetText.substring(0,50).toLowerCase();

              if (snippetText.trim().length > 50 && (commaCount > 3 || parenthesisCount > 2 || lineBreakCount > 0) &&
                  !potentialHeader.includes("exif") && !potentialHeader.includes("http") &&
                  !potentialHeader.includes("icc_profile") && !potentialHeader.includes("<html") &&
                  !potentialHeader.includes("<?xml") && !potentialHeader.includes("adobe") &&
                  !potentialHeader.includes("photoshop") && !potentialHeader.includes("jfif") &&
                  !potentialHeader.includes("png")) {
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
                if (bytes[endOfChunk] === 0x00 &&
                    (endOfChunk + 1 >= searchEnd ||
                     (bytes[endOfChunk+1] < 0x20 && bytes[endOfChunk+1] !== 0x0A && bytes[endOfChunk+1] !== 0x0D && bytes[endOfChunk+1] !== 0x09)
                    )
                   ) {
                    break;
                }
                const currentLookaheadLength = Math.min(40, searchEnd - endOfChunk);
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
