
import { Part, HarmCategory, HarmBlockThreshold, GenerationConfig, SafetySetting } from "@google/genai";
import { callGemini } from './geminiService'; 
import { GEMINI_TEXT_MODEL_NAME } from '../constants'; // Corrected path

export interface VisionDataResult {
  rawCaption: string;
}

export const extractVisionData = async (base64ImageData: string, mimeType: string): Promise<VisionDataResult> => {
  const imagePart: Part = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };
  
  const textPart: Part = {
    text: 'Describe this image in one plain English sentence. Focus on objective visual elements without making assumptions or interpretations about intent, symbolism, or artistic merit unless explicitly depicted. Be concise and factual.',
  };

  const promptForGemini: Part[] = [imagePart, textPart];

  const visionGenerationConfig: GenerationConfig = { 
    responseMimeType: "text/plain",
    // Consider adding temperature or other params if needed for vision
    // temperature: 0.4 
  };
  const visionSafetySettings: SafetySetting[] = [
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE }
  ];

  try {
    // GEMINI_TEXT_MODEL_NAME should be a model capable of multimodal input (e.g., gemini-1.5-flash-latest or similar)
    // The current constant 'gemini-2.5-flash-preview-04-17' is suitable.
    const rawCaptionResponse = await callGemini(
      promptForGemini,
      undefined, 
      GEMINI_TEXT_MODEL_NAME, 
      visionGenerationConfig,
      visionSafetySettings
    );
    
    return { rawCaption: rawCaptionResponse.trim() };
  } catch (e: any) {
    console.error("Error in extractVisionData during callGemini:", e);
    // If the error indicates blocking, ensure it's propagated or handled.
    // callGemini itself should throw AI_REQUEST_BLOCKED or return empty on recognized blocks.
    throw e; 
  }
};
