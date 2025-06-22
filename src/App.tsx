
import React, { useState, useCallback, useEffect, useRef } from 'react';
import YAML from 'yaml';
import { Tag, OutputFormat, GeneratedPrompts, PersonaTheme as PersonaThemeType, Category, HistoryItem, GeneratedImageItem } from './types';
import { 
    CATEGORIES, PERSONA_THEMES, MAX_TOKENS, STABLE_DIFFUSION_QUALITY_PREFIX, 
    ALL_TAGS_WITH_CATEGORY_ID, MIDJOURNEY_PARAMS, GEMINI_TEXT_MODEL_NAME, 
    IMAGEN_MODEL_NAME, DERIVED_PINGINFO_TAG_CATEGORY, VISION_DERIVED_TAG_CATEGORY, 
} from './constants';
import * as HistoryService from './services/historyService'; 
import SelectedTagsArea from './components/SelectedTagsList';
import TagSelector from './components/CategoryTagSelector';
import PromptOutputArea from './components/PromptOutputArea';
import PersonaThemeModal from './components/TemplateModal'; 
import ImageGenerationModal from './components/ImageGenerationModal';
import HistoryPanel from './components/HistoryPanel'; 
import { 
  callGemini, 
  generateJapaneseDescription, 
  generateImagePromptNaturalLanguage, 
  generateMidjourneyPrompt,
  translateToJapanese, 
  translateToEnglish,
  generateCharacterPersona,
  extractTagsFromText,
  generateImageWithImagen,
  extractPromptFromImageMetadata, 
  translateTagsToJapaneseBulk,
  cleanImagePromptString, 
  extractEnglishKeywordsFromJapaneseText,
} from './services/geminiService';
import { filterSensitiveWords } from './services/sensitiveWords'; 
import { extractVisionData } from './services/visionService'; 
import { sanitizeAndCategorizeDescription } from './services/posePersonaFilter';


if (typeof process === 'undefined') {
  // @ts-ignore
  window.process = { env: {} };
}

const PERSONA_TAG_SLOTS: Array<{ categoryId: string; subCategoryId?: string; count: number; required?: boolean; isHairShape?: boolean }> = [
  { categoryId: 'styleArt', count: 1, required: true },
  { categoryId: 'features', subCategoryId: 'race', count: 1, required: true },
  { categoryId: 'features', subCategoryId: 'gender', count: 1, required: true },
  { categoryId: 'features', subCategoryId: 'age', count: 1, required: true },
  { categoryId: 'face', subCategoryId: 'eyeShape', count: 1, required: true },
  { categoryId: 'face', subCategoryId: 'eyeColor', count: 1, required: true },
  { categoryId: 'face', subCategoryId: 'mouth', count: 1, required: false },
  { categoryId: 'hair', subCategoryId: 'hairLength', count: 1, required: true }, 
  { categoryId: 'hair', subCategoryId: 'hairStyle', count: 1, required: false }, // Made optional if length is picked
  { categoryId: 'hair', subCategoryId: 'hairColor', count: 1, required: true },
  { categoryId: 'body', subCategoryId: 'bodyType', count: 1, required: true },
  { categoryId: 'clothing', subCategoryId: 'tops', count: 1, required: true }, // Example: pick one subcat from clothing
  { categoryId: 'action', subCategoryId: 'pose', count: 1, required: false },
  { categoryId: 'expression', count: 1, required: false },
  { categoryId: 'accessories', subCategoryId: 'headwear', count: 1, required: false },
  { categoryId: 'background', subCategoryId: 'location', count: 1, required: false },
  { categoryId: 'lighting', count: 1, required: false }, 
];


const formatLabels: Record<OutputFormat, string> = {
  stableDiffusion: 'Stable Diffusion',
  midjourney: 'Midjourney',
  imagePrompt: 'ImagePrompt (自然言語)',
  yaml: 'YAML Code',
};

const App: React.FC = () => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [activeTagCategoryId, setActiveTagCategoryId] = useState<string | null>(() => {
    const firstValidCategory = CATEGORIES.find(cat => 
        !cat.isInputCategory && 
        !cat.isNsfwCategory && 
        cat.id !== DERIVED_PINGINFO_TAG_CATEGORY.id && 
        cat.id !== VISION_DERIVED_TAG_CATEGORY.id
    ) || CATEGORIES.find(cat => !cat.isInputCategory && !cat.isNsfwCategory) || CATEGORIES.find(cat => !cat.isInputCategory) || CATEGORIES[0];
    return firstValidCategory ? firstValidCategory.id : null;
  });
  
  const [japaneseDescription, setJapaneseDescription] = useState<string>('');
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompts | null>(null);
  const [currentOutputFormat, setCurrentOutputFormat] = useState<OutputFormat>('stableDiffusion');
  
  const [isLoading, setIsLoading] = useState<boolean>(false); // For text-based generations
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null); 
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('APIキーを確認中...');
  const [showPersonaModal, setShowPersonaModal] = useState<boolean>(false);

  const [showImageGenerationModal, setShowImageGenerationModal] = useState<boolean>(false);
  const [generatedImageItems, setGeneratedImageItems] = useState<GeneratedImageItem[] | null>(null);
  const [isGeneratingAnyImage, setIsGeneratingAnyImage] = useState<boolean>(false); // True if any image gen is active
  
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
  
  const [extractedNegativePromptText, setExtractedNegativePromptText] = useState<string | null>(null);
  const [isDescriptionFromPingInfo, setIsDescriptionFromPingInfo] = useState<boolean>(false);
  const [isDescriptionFromImageVision, setIsDescriptionFromImageVision] = useState<boolean>(false); 
  const [showLockedOnlyFilter, setShowLockedOnlyFilter] = useState<boolean>(false);
  const [isSensitiveFilterEnabled, setIsSensitiveFilterEnabled] = useState<boolean>(true);
  const [isNsfwSectionUnlocked, setIsNsfwSectionUnlocked] = useState<boolean>(false);


  const imageInputRef = useRef<HTMLInputElement>(null);
  const metadataInputRef = useRef<HTMLInputElement>(null); 

  const updateAndSortSelectedTags = useCallback((newTagsOrFn: Tag[] | ((prevTags: Tag[]) => Tag[])) => {
    setSelectedTags(prevTags => {
      const updatedTags = typeof newTagsOrFn === 'function' ? newTagsOrFn(prevTags) : newTagsOrFn;
      return [...updatedTags].sort((a, b) => {
        if (a.isLocked && !b.isLocked) return -1;
        if (!a.isLocked && b.isLocked) return 1;
        return 0; 
      });
    });
  }, []);


  const loadHistory = useCallback(() => {
    setHistoryItems(HistoryService.getHistoryItems());
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (process.env.API_KEY) {
      setApiKeyStatus('APIキー検出済み');
    } else {
      setApiKeyStatus('警告: APIキーが見つかりません。Gemini連携機能（説明生成、翻訳、画像読取り、ペルソナ作成、画像生成等）は利用できません。');
    }
  }, []);

  const addHistoryEntry = useCallback((itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...itemDetails,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    HistoryService.saveHistoryItem(newItem);
    loadHistory(); 
  }, [loadHistory]);

  const handleCopyToClipboard = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => alert('プロンプトをクリップボードにコピーしました！'))
      .catch(err => {
        console.error('クリップボードへのコピーに失敗:', err);
        setError('クリップボードへのコピーに失敗しました。');
      });
  }, []);

  const handleUnlockNsfwRequest = useCallback(() => {
    if (!isNsfwSectionUnlocked) {
      if (window.confirm("このセクションには成人向けのコンテンツが含まれる可能性があります。18歳以上ですか？\n(Are you 18 or older? This section may contain adult content.)")) {
        setIsNsfwSectionUnlocked(true);
        const nsfwCategory = CATEGORIES.find(c => c.id === 'advancedNsfw'); 
        if (nsfwCategory) {
            setActiveTagCategoryId(nsfwCategory.id);
        }
      } else {
        alert("年齢確認がキャンセルされたか、18歳未満のためアクセスできません。");
      }
    } else {
       const nsfwCategory = CATEGORIES.find(c => c.id === 'advancedNsfw');
       if (nsfwCategory && activeTagCategoryId !== nsfwCategory.id) {
            setActiveTagCategoryId(nsfwCategory.id);
       }
    }
  }, [isNsfwSectionUnlocked, activeTagCategoryId]);


  const handleTagSelect = useCallback((tag: Tag) => {
    setIsDescriptionFromPingInfo(false); 
    setIsDescriptionFromImageVision(false);
    const category = CATEGORIES.find(cat => cat.id === tag.categoryId);
    const allowMultiple = category?.allowMultipleSelections || tag.allowMultipleSelections;

    updateAndSortSelectedTags(prev => {
      if (allowMultiple) {
        if (prev.length < MAX_TOKENS) {
          const newTagInstance: Tag = {
            ...tag,
            id: `${tag.id}_instance_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            originalId: tag.id, 
            isLocked: false, 
          };
          return [...prev, newTagInstance];
        } else {
          setError(`トークン数の上限 (${MAX_TOKENS}) に達しました。`);
          return prev;
        }
      } else {
        const isSelected = prev.some(t => t.id === tag.id);
        if (isSelected) {
          const existingTag = prev.find(t => t.id === tag.id);
          if (existingTag && existingTag.isLocked) {
              alert("このタグはロックされています。アンロックしてから解除してください。");
              return prev;
          }
          return prev.filter(t => t.id !== tag.id);
        } else {
          if (prev.length < MAX_TOKENS) {
            return [...prev, { ...tag, isLocked: false }]; 
          }
          setError(`トークン数の上限 (${MAX_TOKENS}) に達しました。`);
          return prev;
        }
      }
    });
  }, [updateAndSortSelectedTags]);
  
  const addTagWithTranslation = async (originalInput: string, categoryId: string, isTaggerOrPersona: boolean = false): Promise<Tag | null> => {
    let name = originalInput;
    let japaneseName = originalInput;

    if(process.env.API_KEY && originalInput.trim() !== ""){
        setLoadingMessage(`「${originalInput}」を翻訳中...`);
        try {
            const japaneseRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/;
            if (japaneseRegex.test(originalInput)) { // Input is Japanese
                name = await translateToEnglish(originalInput);
                japaneseName = originalInput;
            } else { // Input is English (or other non-Japanese)
                const translated = await translateTagsToJapaneseBulk([originalInput]);
                if(translated && translated.length > 0){
                    japaneseName = translated[0];
                }
                name = originalInput; 
            }
        } catch (e: any) {
            setError(`タグ「${originalInput}」の翻訳に失敗しました。`);
            console.error("Translation error in addTagWithTranslation:", e);
             if (e.message === "AI_REQUEST_BLOCKED") {
                setError("AIによる翻訳リクエストがブロックされました。");
            }
        }
        setLoadingMessage('');
    }

    let tagTypePrefix = 'custom';
     if (isTaggerOrPersona) {
        if (categoryId === 'input') tagTypePrefix = 'personaInput'; 
        else if (categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) tagTypePrefix = 'derivedPinginfo';
        else if (categoryId === VISION_DERIVED_TAG_CATEGORY.id) tagTypePrefix = 'vision'; 
        else tagTypePrefix = 'tagger'; 
    }
    
    const uniqueSuffix = `-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const baseIdPart = name.toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');

    const newTag: Tag = {
      id: `${tagTypePrefix}-${categoryId}-${baseIdPart}${uniqueSuffix}`,
      name: name,
      japaneseName: japaneseName,
      categoryId: categoryId,
      isLocked: false, 
    };
    return newTag;
  };

  const handleBulkAddTags = useCallback(async (tagNamesFromInput: string[], categoryId: string) => {
    if (categoryId !== DERIVED_PINGINFO_TAG_CATEGORY.id && categoryId !== VISION_DERIVED_TAG_CATEGORY.id) { 
      setIsDescriptionFromPingInfo(false);
      setIsDescriptionFromImageVision(false);
    }
    setIsLoading(true);
    setLoadingMessage('タグを一括追加・処理中...');
    let newTagsBatch: Tag[] = [];
    const currentSelectedTagsSnapshot = selectedTags; 

    if (tagNamesFromInput.length > 0 && process.env.API_KEY) {
        setLoadingMessage('タグを一括翻訳中...');
        try {
            const translatedJapaneseNames = await translateTagsToJapaneseBulk(tagNamesFromInput);
            for (let i = 0; i < tagNamesFromInput.length; i++) {
                if (currentSelectedTagsSnapshot.length + newTagsBatch.length >= MAX_TOKENS) {
                    setError(`トークン数の上限 (${MAX_TOKENS}) に達するため、一部のタグのみ処理されます。`);
                    break;
                }
                const name = tagNamesFromInput[i];
                const japaneseName = translatedJapaneseNames[i] || name;
                
                let prefix = 'bulk';
                if (categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) prefix = 'derivedPinginfo';
                else if (categoryId === VISION_DERIVED_TAG_CATEGORY.id) prefix = 'vision';
                else if (categoryId === 'input') prefix = 'input';


                const baseIdPart = name.toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
                const newTag: Tag = {
                    id: `${prefix}-${categoryId}-${baseIdPart}${uniqueSuffix}`,
                    name: name,
                    japaneseName: japaneseName,
                    categoryId: categoryId,
                    isLocked: false,
                };
                if (!currentSelectedTagsSnapshot.some(st => st.name.toLowerCase() === newTag.name.toLowerCase() && st.categoryId === categoryId) &&
                    !newTagsBatch.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase() && nt.categoryId === categoryId)) {
                   newTagsBatch.push(newTag);
                }
            }
        } catch (e: any) {
            console.error("Bulk translation failed:", e);
             if (e.message === "AI_REQUEST_BLOCKED") {
              setError("タグの一括翻訳がAIによりブロックされました。");
            } else {
              setError("タグの一括翻訳に失敗しました。元の英語名を使用します。");
            }
            for (let i = 0; i < tagNamesFromInput.length; i++) { 
                if (currentSelectedTagsSnapshot.length + newTagsBatch.length >= MAX_TOKENS) break;
                 let prefix = 'bulk';
                if (categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) prefix = 'derivedPinginfo';
                else if (categoryId === VISION_DERIVED_TAG_CATEGORY.id) prefix = 'vision';
                else if (categoryId === 'input') prefix = 'input';
                const baseIdPart = tagNamesFromInput[i].toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
                const newTag: Tag = {
                    id: `${prefix}-${categoryId}-${baseIdPart}${uniqueSuffix}`,
                    name: tagNamesFromInput[i],
                    japaneseName: tagNamesFromInput[i],
                    categoryId: categoryId,
                    isLocked: false,
                };
                if (!currentSelectedTagsSnapshot.some(st => st.name.toLowerCase() === newTag.name.toLowerCase() && st.categoryId === categoryId) &&
                    !newTagsBatch.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase() && nt.categoryId === categoryId)) {
                   newTagsBatch.push(newTag);
                }
            }
        }
    } else { 
         for (const name of tagNamesFromInput) {
            if (currentSelectedTagsSnapshot.length + newTagsBatch.length >= MAX_TOKENS) {
                setError(`トークン数の上限 (${MAX_TOKENS}) に達するため、一部のタグのみ処理されます。`);
                break;
            }
            let prefix = 'bulk';
            if (categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) prefix = 'derivedPinginfo';
            else if (categoryId === VISION_DERIVED_TAG_CATEGORY.id) prefix = 'vision';
            else if (categoryId === 'input') prefix = 'input';
            const baseIdPart = name.toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
            const uniqueSuffix = `-${Date.now().toString(36)}-${Math.random().toString(36).substring(2,7)}`;
            const newTag: Tag = {
                id: `${prefix}-${categoryId}-${baseIdPart}${uniqueSuffix}`,
                name: name, japaneseName: name, categoryId: categoryId, isLocked: false
            };
             if (!currentSelectedTagsSnapshot.some(st => st.name.toLowerCase() === newTag.name.toLowerCase() && st.categoryId === categoryId) &&
                 !newTagsBatch.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase() && nt.categoryId === categoryId)) {
                newTagsBatch.push(newTag);
            }
        }
    }


    if (categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id || categoryId === VISION_DERIVED_TAG_CATEGORY.id) {
        updateAndSortSelectedTags(prev => {
            const locked = prev.filter(t => t.isLocked);
            const combined = [...locked, ...newTagsBatch.filter(nb => !locked.some(l => l.name.toLowerCase() === nb.name.toLowerCase()))];
            if (combined.length > MAX_TOKENS) {
                setError(`トークン数の上限 (${MAX_TOKENS}) を超えるため、一部のタグのみ追加されました。`);
                return combined.slice(0, MAX_TOKENS);
            }
            return combined;
        });
    } else {
        updateAndSortSelectedTags(prev => {
          const combined = [...prev, ...newTagsBatch];
          if (combined.length > MAX_TOKENS) {
            setError(`トークン数の上限 (${MAX_TOKENS}) を超えるため、一部のタグのみ追加されました。`);
            return combined.slice(0, MAX_TOKENS);
          }
          return combined;
        });
    }
    setIsLoading(false);
    setLoadingMessage('');
  }, [selectedTags, updateAndSortSelectedTags]); 


  const handleRemoveSelectedTag = useCallback((tagId: string) => {
    const tagToRemove = selectedTags.find(t => t.id === tagId);
    if (tagToRemove && tagToRemove.isLocked) {
        alert("このタグはロックされています。削除するにはまずアンロックしてください。");
        return;
    }
    setIsDescriptionFromPingInfo(false);
    setIsDescriptionFromImageVision(false);
    updateAndSortSelectedTags(prev => prev.filter(t => t.id !== tagId));
  }, [selectedTags, updateAndSortSelectedTags]);

  const handleToggleTagLock = useCallback((tagId: string) => {
    updateAndSortSelectedTags(prevTags => 
      prevTags.map(tag => 
        tag.id === tagId ? { ...tag, isLocked: !tag.isLocked } : tag
      )
    );
  }, [updateAndSortSelectedTags]);

  const handleUnlockAllTags = useCallback(() => {
    updateAndSortSelectedTags(prevTags =>
      prevTags.map(tag => ({ ...tag, isLocked: false }))
    );
  }, [updateAndSortSelectedTags]);

  const handleToggleShowLockedOnlyFilter = useCallback(() => {
    setShowLockedOnlyFilter(prev => !prev);
  }, []);
  
  const handleToggleSensitiveFilter = useCallback(() => {
    setIsSensitiveFilterEnabled(prev => !prev);
  }, []);


  const handleReorderSelectedTags = useCallback((reorderedFullList: Tag[]) => {
    updateAndSortSelectedTags(reorderedFullList);
  }, [updateAndSortSelectedTags]);

  const handleClearAllTags = useCallback(() => {
    setIsDescriptionFromPingInfo(false); 
    setIsDescriptionFromImageVision(false);
    const hasLockedTags = selectedTags.some(t => t.isLocked);
    let tagsToKeep: Tag[] = [];

    if (hasLockedTags) {
        if (window.confirm("ロックされたタグがあります。ロックされたタグも全てクリアしますか？\n（「キャンセル」を押すと、ロックされていないタグのみクリアされます）")) {
            tagsToKeep = []; 
        } else {
            tagsToKeep = selectedTags.filter(t => t.isLocked); 
        }
    } else {
        tagsToKeep = []; 
    }
    
    updateAndSortSelectedTags(tagsToKeep);

    setGeneratedPrompts(null);
    setJapaneseDescription('');
    setError(null);
    setInfoMessage(null);
    setGeneratedImageItems(null); 
    setExtractedNegativePromptText(null);
  }, [selectedTags, updateAndSortSelectedTags]);
  
  const handleCreatePersonaByTheme = useCallback(async (themeId: string, themeName: string) => {
     if (!process.env.API_KEY) {
      setError("APIキーが未設定のため、ペルソナ作成機能は利用できません。");
      setShowPersonaModal(false);
      return;
    }
    
    setShowPersonaModal(false); 
    setIsLoading(true);
    const displayThemeName = themeId === 'custom_theme' ? `カスタムテーマ「${themeName}」` : `テーマ「${themeName}」`;
    setLoadingMessage(`AIが${displayThemeName}のペルソナを生成し、関連タグを抽出中...`);
    setError(null);
    setInfoMessage(null);
    setGeneratedPrompts(null);
    setJapaneseDescription(''); 
    setExtractedNegativePromptText(null);
    setIsDescriptionFromPingInfo(false);
    setIsDescriptionFromImageVision(false);

    const existingLockedTags = selectedTags.filter(t => t.isLocked);
    updateAndSortSelectedTags(existingLockedTags);

    try {
      const isRandomGeneration = themeId === 'random_persona';
      const personaText = await generateCharacterPersona(themeName, isRandomGeneration);
      setJapaneseDescription(personaText); 

      const extractedEnglishTags = await extractTagsFromText(personaText);
      
      if (extractedEnglishTags.length > 0) {
          await handleBulkAddTags(extractedEnglishTags, 'input'); 
      }

    } catch (err: any) {
      console.error("ペルソナ作成またはタグ抽出エラー:", err);
      if (err.message === "AI_REQUEST_BLOCKED") {
        setError("AIによるペルソナ作成またはタグ抽出がブロックされました。テーマや内容を確認してください。");
      } else {
        setError(err.message || "ペルソナ作成中にエラーが発生しました。");
      }
      setJapaneseDescription(prev => prev + (prev ? "\n\n" : "") + `${displayThemeName}のペルソナのタグ抽出に失敗しました。`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [selectedTags, updateAndSortSelectedTags, handleBulkAddTags]); 

  const handleRandomPersonaTagGeneration = useCallback(() => {
    setIsDescriptionFromPingInfo(false);
    setIsDescriptionFromImageVision(false);
    setIsLoading(true);
    setLoadingMessage('ランダムにタグを生成中...');
    setError(null);
    setInfoMessage(null);
    setJapaneseDescription('');
    setGeneratedPrompts(null);
    setGeneratedImageItems(null);
    setExtractedNegativePromptText(null);

    const lockedTags = selectedTags.filter(t => t.isLocked);
    let newGeneratedTags: Tag[] = [...lockedTags];
    let currentTokenCount = newGeneratedTags.length;

    const categoriesCoveredByLocked = new Set<string>(lockedTags.map(t => t.categoryId));
    const slotsFilledByLocked = new Set<string>(); 

    for (const lockedTag of lockedTags) {
        for (const slot of PERSONA_TAG_SLOTS) {
            if (lockedTag.categoryId === slot.categoryId && 
                (slot.subCategoryId ? lockedTag.subCategoryId === slot.subCategoryId : true)) {
                const slotKey = slot.subCategoryId ? `${slot.categoryId}-${slot.subCategoryId}` : slot.categoryId;
                slotsFilledByLocked.add(slotKey);
                break; 
            }
        }
    }
    
    for (const slot of PERSONA_TAG_SLOTS) {
        if (currentTokenCount >= MAX_TOKENS && slot.required) {
            console.warn(`MAX_TOKENS reached, but slot ${slot.categoryId}/${slot.subCategoryId || ''} is required.`);
        } else if (currentTokenCount >= MAX_TOKENS && !slot.required) {
            continue;
        }

        const slotKey = slot.subCategoryId ? `${slot.categoryId}-${slot.subCategoryId}` : slot.categoryId;
        
        if (slotsFilledByLocked.has(slotKey)) {
            continue; 
        }
        if (categoriesCoveredByLocked.has(slot.categoryId) && slot.subCategoryId) { 
            const isLockMoreGeneral = lockedTags.some(lt => lt.categoryId === slot.categoryId && !lt.subCategoryId );
            if (isLockMoreGeneral) continue;
        }


        let availableTagsForSlot: Tag[] = ALL_TAGS_WITH_CATEGORY_ID.filter(tag => {
            const parentCategory = CATEGORIES.find(cat => cat.id === tag.categoryId);
            return tag.categoryId === slot.categoryId &&
            (slot.subCategoryId ? tag.subCategoryId === slot.subCategoryId : true) && 
            !(tag.categoryId === 'input' || tag.categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id || tag.categoryId === VISION_DERIVED_TAG_CATEGORY.id || (parentCategory && parentCategory.isNsfwCategory && !isNsfwSectionUnlocked)) && 
            !categoriesCoveredByLocked.has(tag.categoryId); 
        });
        
        if (slot.categoryId === 'features' && slot.subCategoryId === 'age') {
            const selectedGenderTag = newGeneratedTags.find(t => t.categoryId === 'features' && t.subCategoryId === 'gender' && !t.isLocked);
            if (selectedGenderTag) {
                if (selectedGenderTag.name === 'man' || selectedGenderTag.name === '1boy') {
                     availableTagsForSlot = availableTagsForSlot.filter(t => t.name !== 'elderly woman' && t.name !== 'mature_female');
                } else if (selectedGenderTag.name === 'woman' || selectedGenderTag.name === '1girl') {
                     availableTagsForSlot = availableTagsForSlot.filter(t => t.name !== 'elderly man');
                }
            }
        }
        
        const categoryDef = CATEGORIES.find(c => c.id === slot.categoryId);
        if(!categoryDef?.allowMultipleSelections) {
            availableTagsForSlot = availableTagsForSlot.filter(candidateTag => 
                !newGeneratedTags.some(existingTag => 
                    !existingTag.isLocked && 
                    existingTag.categoryId === candidateTag.categoryId &&
                    (existingTag.subCategoryId === candidateTag.subCategoryId) 
                )
            );
        }


        if (availableTagsForSlot.length > 0) {
            for (let i = 0; i < slot.count; i++) {
                if (currentTokenCount >= MAX_TOKENS) break;
                if (availableTagsForSlot.length === 0) break;

                const randomIndex = Math.floor(Math.random() * availableTagsForSlot.length);
                const randomTagCandidate = { ...availableTagsForSlot[randomIndex], isLocked: false }; 
                
                if (!newGeneratedTags.some(rt => !rt.isLocked && rt.id === randomTagCandidate.id)) { 
                    newGeneratedTags.push(randomTagCandidate);
                    currentTokenCount++;
                    slotsFilledByLocked.add(slotKey); 
                    if(!categoryDef?.allowMultipleSelections) {
                       availableTagsForSlot = []; 
                    } else {
                       availableTagsForSlot.splice(randomIndex, 1); 
                    }
                }
            }
        } else if (slot.required) {
            console.warn(`No tags found for required slot after filtering: ${slot.categoryId} / ${slot.subCategoryId || ''}`);
        }
    }
    
    if (newGeneratedTags.length === lockedTags.length && PERSONA_TAG_SLOTS.some(s => s.required && !slotsFilledByLocked.has(s.subCategoryId ? `${s.categoryId}-${s.subCategoryId}` : s.categoryId))) {
      setError("ランダム生成に必要なタグが見つかりませんでした。ロックされたカテゴリが多すぎるか、カテゴリ定義を確認してください。");
    }

    updateAndSortSelectedTags(newGeneratedTags.slice(0, MAX_TOKENS));
    if (newGeneratedTags.length > MAX_TOKENS) {
        setError(`トークン数の上限 (${MAX_TOKENS}) に達したため、一部のランダムタグのみ表示されます。`);
    }

    setIsLoading(false);
    setLoadingMessage('');
  }, [selectedTags, updateAndSortSelectedTags, isNsfwSectionUnlocked]);


  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!process.env.API_KEY) {
        setError("APIキーが未設定のため、画像からの情報抽出はできません。");
        if (imageInputRef.current) imageInputRef.current.value = ""; 
        return;
      }
      setIsLoading(true);
      setLoadingMessage('画像を処理し、内容を記述・タグを抽出・翻訳・追加中...');
      setError(null);
      setInfoMessage(null);
      setExtractedNegativePromptText(null);
      setIsDescriptionFromPingInfo(false);
      setIsDescriptionFromImageVision(false); 
      
      const existingLockedTags = selectedTags.filter(t => t.isLocked);
      updateAndSortSelectedTags(existingLockedTags); 

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64ImageData = (reader.result as string).split(',')[1];
            if (!base64ImageData) {
              throw new Error("画像の読み込みに失敗しました。");
            }
            const { rawCaption } = await extractVisionData(base64ImageData, file.type);
            
            if (!rawCaption || rawCaption.trim() === "") {
                setInfoMessage("画像からテキスト情報を抽出できませんでした。");
                setJapaneseDescription("");
                setIsDescriptionFromImageVision(true); 
            } else {
                const { poseDescription, personaDescription, rawFilteredDescription } = sanitizeAndCategorizeDescription(rawCaption);
                setJapaneseDescription(rawFilteredDescription); 
                setIsDescriptionFromImageVision(true);

                const textForTagExtraction = personaDescription.trim() || rawFilteredDescription.trim();
                let extractedEnglishTags: string[] = [];
                if (textForTagExtraction) {
                    setLoadingMessage('画像キャプションからタグを抽出中...');
                    extractedEnglishTags = await extractTagsFromText(textForTagExtraction);
                }
                
                if (extractedEnglishTags.length > 0) {
                    await handleBulkAddTags(extractedEnglishTags, VISION_DERIVED_TAG_CATEGORY.id);
                } else if (rawCaption.trim() !== "") { 
                    setInfoMessage("画像からキャプションは抽出できましたが、タグ化可能なキーワードは見つかりませんでした。");
                }
            }

          } catch (innerErr: any) {
            console.error("画像内容記述・タグ抽出・追加処理エラー:", innerErr);
             if (innerErr.message === "AI_REQUEST_BLOCKED") {
                setError("AIによる画像からの情報抽出がブロックされました。");
                setJapaneseDescription("(AIリクエストがブロックされました)");
             } else {
                setError(innerErr.message || "画像からの情報抽出・追加処理中にエラーが発生しました。");
             }
             setIsDescriptionFromImageVision(true); 
          } finally {
            if (imageInputRef.current) imageInputRef.current.value = ""; 
            setIsLoading(false);
            setLoadingMessage('');
          }
        };
        reader.onerror = () => {
            console.error("FileReader error");
            setError("画像の読み込み中にエラーが発生しました。");
            setIsLoading(false);
            setLoadingMessage('');
            if (imageInputRef.current) imageInputRef.current.value = "";
        };
        reader.readAsDataURL(file);
      } catch (err: any) { 
        console.error("ファイル処理開始エラー:",err);
        setError(err.message || "画像処理の開始中にエラーが発生しました。");
        setIsLoading(false);
        setLoadingMessage('');
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    }
  };

  const triggerImageUpload = () => {
    if (isLoading || isGeneratingAnyImage ) return; 
    imageInputRef.current?.click();
  };

  const handleMetadataFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setLoadingMessage('画像メタデータを読取り中...');
      setError(null);
      setInfoMessage(null);
      setExtractedNegativePromptText(null);
      setIsDescriptionFromPingInfo(false); 
      setIsDescriptionFromImageVision(false);

      const lockedTags = selectedTags.filter(t => t.isLocked);
      updateAndSortSelectedTags(lockedTags); 

      try {
        const { positivePrompt, negativePrompt } = await extractPromptFromImageMetadata(file);
        
        if (positivePrompt && positivePrompt.trim().length > 0) {
          setJapaneseDescription(positivePrompt); 
          setIsDescriptionFromPingInfo(true); 
          
          const cleanedPositivePromptForTags = cleanImagePromptString(positivePrompt);
          const tagsToAdd = cleanedPositivePromptForTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
          
          if (tagsToAdd.length > 0) {
            await handleBulkAddTags(tagsToAdd, DERIVED_PINGINFO_TAG_CATEGORY.id); 
          }
        } else {
          setError('画像からポジティブプロンプト情報を抽出できませんでした。対応フォーマット (PNG, JPEG, WebP) を確認するか、別の画像をお試しください。');
          setJapaneseDescription(''); 
          setIsDescriptionFromPingInfo(false);
        }

        if (negativePrompt && negativePrompt.trim().length > 0) {
          const cleanedNegative = cleanImagePromptString(negativePrompt);
          setExtractedNegativePromptText(cleanedNegative);
          console.log("抽出・整形されたネガティブプロンプト:", cleanedNegative); 
        }

      } catch (err: any) {
        console.error("メタデータ抽出エラー:", err);
        setError(err.message || "画像メタデータの読み取り中にエラーが発生しました。");
        setJapaneseDescription(''); 
        setIsDescriptionFromPingInfo(false);
      } finally {
        if (metadataInputRef.current) metadataInputRef.current.value = "";
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const triggerMetadataUpload = () => {
    if (isLoading || isGeneratingAnyImage ) return;
    metadataInputRef.current?.click();
  };


  const handleGenerateAllOutputs = useCallback(async () => {
    setError(null);
    setInfoMessage(null);
    const hasSourceText = (isDescriptionFromPingInfo || isDescriptionFromImageVision) && japaneseDescription.trim().length > 0;
    if (!hasSourceText && selectedTags.length === 0) {
      setError("プロンプトを生成するには、まずタグを選択するか、画像読取り/メタデータ読取りを行ってください。");
      return;
    }
    if (!hasSourceText && selectedTags.length > MAX_TOKENS) {
      setError(`トークン数が上限を超えています (${MAX_TOKENS}個まで)。タグを減らしてください。`);
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('各種プロンプトを生成中...');
    setGeneratedPrompts(null);
    setGeneratedImageItems(null);

    let baseTextForProcessing = '';
    let finalSelectedTagsForOutput = [...selectedTags];
    let initialJapaneseDescriptionFromSource = japaneseDescription; 
    let isFromSourceTextFlag = isDescriptionFromPingInfo || isDescriptionFromImageVision;


    if (isFromSourceTextFlag && initialJapaneseDescriptionFromSource.trim().length > 0) {
        baseTextForProcessing = initialJapaneseDescriptionFromSource; 
        if (isSensitiveFilterEnabled) {
            const {cleanedText, flagged} = filterSensitiveWords(baseTextForProcessing); 
            if (flagged) {
                setInfoMessage("情報：入力テキスト内のセンシティブな可能性のある単語を処理しました。");
            }
            baseTextForProcessing = cleanedText;
        }
    } else {
        const promptParts: string[] = [];
        let i = 0;
        while (i < finalSelectedTagsForOutput.length) {
            const currentTag = finalSelectedTagsForOutput[i];
            if (currentTag.name.endsWith('-') && i + 1 < finalSelectedTagsForOutput.length) {
                const nextTag = finalSelectedTagsForOutput[i+1];
                promptParts.push(currentTag.name + nextTag.name);
                i += 2; 
            } else {
                promptParts.push(currentTag.name);
                i += 1; 
            }
        }
        baseTextForProcessing = cleanImagePromptString(promptParts.join(', '));
        if (isSensitiveFilterEnabled) {
             const {cleanedText, flagged} = filterSensitiveWords(baseTextForProcessing); 
             if (flagged && !infoMessage) { 
                setInfoMessage("情報：選択タグ内のセンシティブな可能性のある単語を処理しました。");
            }
            baseTextForProcessing = cleanedText;
        }
    }

    let currentJapaneseDescriptionForDisplay = japaneseDescription; 

    if (isFromSourceTextFlag) {
        try {
            setLoadingMessage('原文(メタデータ/画像解析)を日本語に翻訳し、キーワードを抽出しています...');
            let aiTranslatedJapaneseText = currentJapaneseDescriptionForDisplay; 
            if (baseTextForProcessing.trim().length > 0 && process.env.API_KEY) { 
                 aiTranslatedJapaneseText = await translateToJapanese(baseTextForProcessing); 
            } else if (isSensitiveFilterEnabled && infoMessage && baseTextForProcessing.trim().length === 0 && initialJapaneseDescriptionFromSource.trim().length > 0) { 
                aiTranslatedJapaneseText = "(フィルター処理により内容は削除されました)";
            } else if (!process.env.API_KEY) {
                aiTranslatedJapaneseText = baseTextForProcessing; 
            }
            
            currentJapaneseDescriptionForDisplay = aiTranslatedJapaneseText; 

            let derivedEnglishKeywordsString = "";
            if (baseTextForProcessing.trim().length > 0 && process.env.API_KEY) {
                derivedEnglishKeywordsString = await extractEnglishKeywordsFromJapaneseText(aiTranslatedJapaneseText);
            }
            
            if (derivedEnglishKeywordsString.trim().length > 0) {
                const derivedEnglishKeywordsArray = derivedEnglishKeywordsString.split(',').map(k => k.trim()).filter(k => k.length > 0);
                
                setLoadingMessage('派生キーワードを日本語に一括翻訳中...');
                const translatedJapaneseNames = await translateTagsToJapaneseBulk(derivedEnglishKeywordsArray);

                const newDerivedTags: Tag[] = [];
                for (let i = 0; i < derivedEnglishKeywordsArray.length; i++) {
                    const baseIdPart = derivedEnglishKeywordsArray[i].toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                    const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
                    const categoryForDerived = isDescriptionFromPingInfo ? DERIVED_PINGINFO_TAG_CATEGORY.id : VISION_DERIVED_TAG_CATEGORY.id;
                    newDerivedTags.push({
                        id: `derived-${categoryForDerived}-${baseIdPart}${uniqueSuffix}`,
                        name: derivedEnglishKeywordsArray[i],
                        japaneseName: translatedJapaneseNames[i] || derivedEnglishKeywordsArray[i],
                        categoryId: categoryForDerived,
                        isLocked: false, 
                    });
                }
                updateAndSortSelectedTags(prev => { 
                    const locked = prev.filter(t => t.isLocked);
                    const combined = [...locked, ...newDerivedTags.filter(ndt => !locked.some(l => l.name.toLowerCase() === ndt.name.toLowerCase()))];
                    finalSelectedTagsForOutput = combined.slice(0, MAX_TOKENS); 
                    return finalSelectedTagsForOutput;
                }); 
                baseTextForProcessing = cleanImagePromptString(finalSelectedTagsForOutput.map(tag => tag.name).join(', '));
                isFromSourceTextFlag = false; 
                if (isSensitiveFilterEnabled) { 
                    const {cleanedText, flagged} = filterSensitiveWords(baseTextForProcessing);
                     if (flagged && !infoMessage) {
                        setInfoMessage("情報：派生キーワード内のセンシティブな可能性のある単語を処理しました。");
                    }
                    baseTextForProcessing = cleanedText;
                }
            } else {
                 if(baseTextForProcessing.trim().length > 0 && process.env.API_KEY) { 
                    setLoadingMessage('キーワード抽出に失敗。元の翻訳済みテキストまたはタグを使用します。');
                 } else if (baseTextForProcessing.trim().length > 0 && !process.env.API_KEY){
                    const potentialTagsFromBase = baseTextForProcessing.split(',').map(t=>t.trim()).filter(t=>t.length > 0);
                     if (potentialTagsFromBase.length > 0) {
                        finalSelectedTagsForOutput = potentialTagsFromBase.map((pt, i) => {
                            const baseIdPart = pt.toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                            const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
                            const categoryForDerived = isDescriptionFromPingInfo ? DERIVED_PINGINFO_TAG_CATEGORY.id : VISION_DERIVED_TAG_CATEGORY.id;
                            return {
                                id: `derived-${categoryForDerived}-${baseIdPart}${uniqueSuffix}`,
                                name: pt,
                                japaneseName: pt, 
                                categoryId: categoryForDerived,
                                isLocked: false,
                            };
                        });
                        updateAndSortSelectedTags(finalSelectedTagsForOutput.slice(0, MAX_TOKENS));
                        isFromSourceTextFlag = false; 
                     }
                 }
            }
        } catch(sourceProcessingError: any) {
            console.error("PingInfo/Vision由来プロンプト処理エラー:", sourceProcessingError);
            if (sourceProcessingError.message === "AI_REQUEST_BLOCKED") {
                setError("AIによる原文処理（翻訳またはキーワード抽出）がブロックされました。");
            } else {
                setError(`原文の処理中にエラー: ${sourceProcessingError.message}。`);
            }
             isFromSourceTextFlag = false; 
             baseTextForProcessing = cleanImagePromptString(finalSelectedTagsForOutput.map(t=>t.name).join(', '));
             if (isSensitiveFilterEnabled) {
                const {cleanedText, flagged} = filterSensitiveWords(baseTextForProcessing);
                if(flagged && !infoMessage) setInfoMessage("エラー発生後、タグからプロンプトを生成する際にフィルター処理を行いました。");
                baseTextForProcessing = cleanedText;
             }
        }
    }
    
    if (!baseTextForProcessing && finalSelectedTagsForOutput.length === 0) { 
        setError("フィルター処理後、プロンプト生成に使用できるテキスト/タグが残っていませんでした。");
        setIsLoading(false);
        setLoadingMessage('');
        if (isDescriptionFromPingInfo) setIsDescriptionFromPingInfo(false);
        if (isDescriptionFromImageVision) setIsDescriptionFromImageVision(false);
        return;
    }
    setJapaneseDescription(currentJapaneseDescriptionForDisplay); 

    const yamlOutput = YAML.stringify(finalSelectedTagsForOutput.map(t => ({
        name: t.name, 
        japanese_name: t.japaneseName, 
        category: CATEGORIES.find(c=>c.id === t.categoryId)?.name || t.categoryId, 
        sub_category: t.subCategoryId ? CATEGORIES.find(c=>c.id === t.categoryId)?.subCategories?.find(sc=>sc.id === t.subCategoryId)?.name : 'N/A',
        is_locked: t.isLocked || false,
    })));

    let currentPrompts: GeneratedPrompts = {
        stableDiffusion: STABLE_DIFFUSION_QUALITY_PREFIX + baseTextForProcessing,
        midjourney: baseTextForProcessing + MIDJOURNEY_PARAMS, 
        imagePrompt: baseTextForProcessing, 
        yaml: yamlOutput,
      };
    
    let descForHistory = currentJapaneseDescriptionForDisplay; 
    
    if (!process.env.API_KEY) {
        setError("APIキーが設定されていません。Geminiを利用したプロンプト生成はできません。基本的なプロンプトのみ表示します。");
        setGeneratedPrompts(currentPrompts);
        
        const placeholderMessages = ["現在の選択タグに基づいた", "画像からキャプションを抽出しました", "(フィルター処理により内容は削除されました)"];
        const isCurrentDescAPlaceholderOrRawEnglishFromSource = !descForHistory || 
            placeholderMessages.some(msg => descForHistory.startsWith(msg)) ||
            ( (isDescriptionFromPingInfo || isDescriptionFromImageVision) && /[a-zA-Z]/.test(descForHistory) && !/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9faf]/.test(descForHistory));

        if (finalSelectedTagsForOutput.length > 0 && isCurrentDescAPlaceholderOrRawEnglishFromSource && !(isDescriptionFromPingInfo || isDescriptionFromImageVision)) {
            descForHistory = "現在の選択タグに基づいた標準的な説明です。より詳細な説明はAPIキー設定後に「プロンプト生成」で取得できます。";
            setJapaneseDescription(descForHistory);
        } else if (finalSelectedTagsForOutput.length === 0 && !(isDescriptionFromPingInfo || isDescriptionFromImageVision)) { 
            setJapaneseDescription('');
            descForHistory = '';
        }
        
        setIsLoading(false);
        setLoadingMessage('');
        addHistoryEntry({
            type: 'prompt_generation',
            promptText: currentPrompts.imagePrompt || baseTextForProcessing,
            selectedTagsSnapshot: [...finalSelectedTagsForOutput],
            japaneseDescriptionSnapshot: descForHistory,
            generatedPromptsSnapshot: { ...currentPrompts },
            modelName: 'N/A (API Key Missing)',
        });
        if (isDescriptionFromPingInfo) setIsDescriptionFromPingInfo(false);
        if (isDescriptionFromImageVision) setIsDescriptionFromImageVision(false);
        return;
    }

    try {
      setLoadingMessage('Midjourneyプロンプトを生成中...');
      // Pass false for applySensitiveFilter as App.tsx handles it
      const mjPrompt = await generateMidjourneyPrompt(baseTextForProcessing); 
      currentPrompts.midjourney = mjPrompt;
      
      let finalJapaneseDescriptionForDisplayAndHistory = descForHistory; 
      
      const placeholderMessagesForDescRegen = ["現在の選択タグに基づいた", "画像からキャプションを抽出しました", "(フィルター処理により内容は削除されました)"];
      const needsDescRegeneration = 
                                    ((isDescriptionFromPingInfo || isDescriptionFromImageVision) && (!descForHistory || !descForHistory.match(/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9faf]/))) || 
                                    !descForHistory || 
                                    descForHistory.startsWith("プロンプト生成中にエラーが発生しましたが") ||
                                    placeholderMessagesForDescRegen.some(msg => descForHistory.startsWith(msg)) ||
                                    (!(isDescriptionFromPingInfo || isDescriptionFromImageVision) && selectedTags.length > 0 && (!japaneseDescription || japaneseDescription.length === 0));

      if (needsDescRegeneration && baseTextForProcessing.trim().length > 0 && mjPrompt.trim().length > 0 && !mjPrompt.startsWith(MIDJOURNEY_PARAMS.trim())) { 
        setLoadingMessage('日本語説明文を生成中...');
        finalJapaneseDescriptionForDisplayAndHistory = await generateJapaneseDescription(mjPrompt); 
        setJapaneseDescription(finalJapaneseDescriptionForDisplayAndHistory);
      } else if (baseTextForProcessing.trim().length === 0 && needsDescRegeneration) {
        const filteredMsg = "(フィルター処理により内容は削除されました)";
        setJapaneseDescription(filteredMsg);
        finalJapaneseDescriptionForDisplayAndHistory = filteredMsg;
      }
      descForHistory = finalJapaneseDescriptionForDisplayAndHistory;


      setLoadingMessage('ImagePrompt (自然言語)を生成中...');
      // Pass false for applySensitiveFilter
      const ipPrompt = await generateImagePromptNaturalLanguage(baseTextForProcessing); 
      currentPrompts.imagePrompt = ipPrompt;
      
      setGeneratedPrompts(currentPrompts);
      setCurrentOutputFormat('stableDiffusion');

      addHistoryEntry({
        type: 'prompt_generation',
        promptText: currentPrompts.imagePrompt || baseTextForProcessing,
        selectedTagsSnapshot: [...finalSelectedTagsForOutput],
        japaneseDescriptionSnapshot: descForHistory,
        generatedPromptsSnapshot: { ...currentPrompts },
        modelName: GEMINI_TEXT_MODEL_NAME,
      });

    } catch (err: any) {
      console.error("プロンプト生成エラー:", err);
      if (err.message === "AI_REQUEST_BLOCKED") {
        setError("AIによるプロンプト生成がブロックされました。プロンプトの内容やフィルター設定を確認してください。");
      } else {
        setError(err.message || "プロンプトの生成中にエラーが発生しました。");
      }
      setGeneratedPrompts(currentPrompts); 
      
      let errorDesc = descForHistory; 
      const isDescStillPlaceholderOrRawEnglishFromSource = 
          !errorDesc ||
          ["現在の選択タグに基づいた", "画像からキャプションを抽出しました", "(フィルター処理により内容は削除されました)"].some(msg => errorDesc.startsWith(msg)) ||
          ( (isDescriptionFromPingInfo || isDescriptionFromImageVision) && (!errorDesc.match(/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9faf]/) && errorDesc.length > 0) ); 

      if (isDescStillPlaceholderOrRawEnglishFromSource && errorDesc !== "(フィルター処理により内容は削除されました)") {
         errorDesc = "プロンプト生成中にエラーが発生しましたが、基本的な説明は以下の通りです。";
         setJapaneseDescription(errorDesc);
      } else {
         setJapaneseDescription(errorDesc); 
      }

       addHistoryEntry({ 
        type: 'prompt_generation',
        promptText: currentPrompts.imagePrompt || baseTextForProcessing,
        selectedTagsSnapshot: [...finalSelectedTagsForOutput],
        japaneseDescriptionSnapshot: errorDesc,
        generatedPromptsSnapshot: { ...currentPrompts },
        modelName: GEMINI_TEXT_MODEL_NAME + " (Error Occurred)",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      if (isDescriptionFromPingInfo) setIsDescriptionFromPingInfo(false); 
      if (isDescriptionFromImageVision) setIsDescriptionFromImageVision(false);
    }
  }, [selectedTags, japaneseDescription, addHistoryEntry, handleBulkAddTags, isDescriptionFromPingInfo, isDescriptionFromImageVision, updateAndSortSelectedTags, isSensitiveFilterEnabled, infoMessage]);

  const handleGenerateImageWithSelectedPrompt = useCallback(async (promptTextForImage?: string, formatForImage?: OutputFormat | 'ImagePrompt') => {
    if (!process.env.API_KEY) {
      setGeneratedImageItems([{ id: 'error-no-apikey', format: formatForImage || currentOutputFormat, imageUrl: null, isLoading: false, error: "APIキーが未設定のため、画像生成はできません。", promptText: promptTextForImage || "N/A", modelName: "N/A" }]);
      setShowImageGenerationModal(true);
      return;
    }
    
    const targetFormat = formatForImage || currentOutputFormat;
    let finalPromptText = promptTextForImage;

    if (!finalPromptText) {
        if (!generatedPrompts) {
             setGeneratedImageItems([{ id: `error-no-prompts-obj-${targetFormat}`, format: targetFormat, imageUrl: null, isLoading: false, error: "まず「プロンプトを生成」を実行してください。", promptText: "N/A", modelName: "N/A" }]);
             setShowImageGenerationModal(true);
             return;
        }
        finalPromptText = generatedPrompts[targetFormat as OutputFormat]; // YAML won't be passed here usually
    }
    
    if (!finalPromptText || targetFormat === 'yaml') {
      const errorMsg = targetFormat === 'yaml' 
          ? "YAML形式では画像生成できません。" 
          : `画像生成に使用できる「${formatLabels[targetFormat as OutputFormat] || targetFormat}」プロンプトがありません。`;
      setGeneratedImageItems([{ id: `error-no-prompt-${targetFormat}`, format: targetFormat, imageUrl: null, isLoading: false, error: errorMsg, promptText: "N/A", modelName: "N/A" }]);
      setShowImageGenerationModal(true);
      return;
    }

    let processedPrompt = finalPromptText;
    if (isSensitiveFilterEnabled) {
        const {cleanedText, flagged} = filterSensitiveWords(finalPromptText); 
        if (flagged && !infoMessage) { 
            setInfoMessage("情報：画像生成プロンプト内のセンシティブな可能性のある単語を処理しました。");
        }
        processedPrompt = cleanedText;
    }
    
    if(!processedPrompt || processedPrompt.trim().length === 0) {
        setGeneratedImageItems([{ id: `error-filtered-${targetFormat}`, format: targetFormat, imageUrl: null, isLoading: false, error: "フィルター処理後、画像生成に使用できるプロンプトが残りませんでした。", promptText: finalPromptText, modelName: "N/A" }]);
        setShowImageGenerationModal(true);
        return;
    }

    setIsGeneratingAnyImage(true);
    const singleImageItem: GeneratedImageItem = {
      id: `single-${targetFormat}-${Date.now()}`,
      format: targetFormat,
      imageUrl: null,
      isLoading: true,
      error: null,
      promptText: processedPrompt,
      modelName: IMAGEN_MODEL_NAME
    };
    setGeneratedImageItems([singleImageItem]);
    setShowImageGenerationModal(true);

    try {
      const imageBase64Bytes = await generateImageWithImagen(processedPrompt);
      const dataUrl = `data:image/jpeg;base64,${imageBase64Bytes}`;
      setGeneratedImageItems(prevItems => prevItems ? prevItems.map(item => item.id === singleImageItem.id ? {...item, imageUrl: dataUrl, isLoading: false } : item) : null);
      
      addHistoryEntry({
        type: 'image_generation',
        promptText: processedPrompt,
        format: targetFormat,
        generatedImageUrl: dataUrl,
        modelName: IMAGEN_MODEL_NAME,
      });

    } catch (err: any) {
      console.error("Gemini画像生成エラー:", err);
      let errorMsg = err.message || "Geminiでの画像生成中にエラーが発生しました。";
      if (err.message === "AI_REQUEST_BLOCKED") {
        errorMsg = "AIによる画像生成がブロックされました。プロンプトの内容がガイドラインに準拠しているか確認してください。";
      }
      setGeneratedImageItems(prevItems => prevItems ? prevItems.map(item => item.id === singleImageItem.id ? {...item, error: errorMsg, isLoading: false } : item) : null);
    } finally {
      setIsGeneratingAnyImage(false);
    }
  }, [generatedPrompts, currentOutputFormat, addHistoryEntry, isSensitiveFilterEnabled, infoMessage]);

  const handleGenerateImagesForAllPrompts = useCallback(async () => {
    if (!generatedPrompts) {
      setError("まず「プロンプトを生成」を実行して、各種プロンプトを作成してください。");
      return;
    }
    if (!process.env.API_KEY) {
      setError("APIキーが未設定のため、画像生成はできません。");
      return;
    }

    setIsGeneratingAnyImage(true); 
    setLoadingMessage("全プロンプトで画像を順次生成中...");
    setInfoMessage(null);
    
    let promptsToProcessInput: { format: OutputFormat | 'ImagePrompt'; text: string | undefined }[] = [
        { format: 'stableDiffusion', text: generatedPrompts.stableDiffusion },
        { format: 'midjourney', text: generatedPrompts.midjourney },
        { format: 'imagePrompt', text: generatedPrompts.imagePrompt },
    ];

    let localInfoMessages: string[] = [];
    const processedPromptsForGeneration = promptsToProcessInput.map(p => {
        let processedText = p.text;
        if (p.text && isSensitiveFilterEnabled) {
            const {cleanedText, flagged} = filterSensitiveWords(p.text);
            if (flagged) {
                 localInfoMessages.push(`「${formatLabels[p.format as OutputFormat] || p.format}」プロンプト`);
            }
            processedText = cleanedText;
        }
        return { ...p, text: processedText };
    }).filter(p => p.text && p.text.trim().length > 0 && p.format !== 'yaml');


    if (localInfoMessages.length > 0) {
        setInfoMessage(`情報：${localInfoMessages.join('、')}内のセンシティブな可能性のある単語を処理しました。`);
    }
    
    if (processedPromptsForGeneration.length === 0) {
        setError("フィルター処理後、画像生成に使用できる有効なプロンプトがありませんでした。");
        setIsGeneratingAnyImage(false);
        setLoadingMessage("");
        setGeneratedImageItems([]);
        setShowImageGenerationModal(true);
        return;
    }

    const initialItems: GeneratedImageItem[] = processedPromptsForGeneration
      .map((p, index) => ({
        id: `multi-${p.format}-${index}-${Date.now()}`,
        format: p.format,
        imageUrl: null,
        isLoading: true,
        error: null,
        promptText: p.text!,
        modelName: IMAGEN_MODEL_NAME,
      }));

    setGeneratedImageItems(initialItems);
    setShowImageGenerationModal(true);

    for (const item of initialItems) { // Iterate over a copy, or the initialItems directly
        if (!item.promptText || item.promptText.trim().length === 0) continue; 

        try {
            const imageBase64Bytes = await generateImageWithImagen(item.promptText);
            const dataUrl = `data:image/jpeg;base64,${imageBase64Bytes}`;
            setGeneratedImageItems(prev => prev ? prev.map(i => i.id === item.id ? { ...i, imageUrl: dataUrl, isLoading: false } : i) : null);
            addHistoryEntry({
                type: 'image_generation',
                promptText: item.promptText,
                format: item.format,
                generatedImageUrl: dataUrl,
                modelName: IMAGEN_MODEL_NAME,
            });
        } catch (err: any) {
            console.error(`Error generating image for ${item.format}:`, err);
            let errorMsg = err.message || `「${formatLabels[item.format as OutputFormat] || item.format}」の画像生成中にエラーが発生しました。`;
             if (err.message === "AI_REQUEST_BLOCKED") {
                errorMsg = `「${formatLabels[item.format as OutputFormat] || item.format}」の画像生成がAIによりブロックされました。`;
             }
            setGeneratedImageItems(prev => prev ? prev.map(i => i.id === item.id ? { ...i, error: errorMsg, isLoading: false } : i) : null);
        }
    }
    
    setIsGeneratingAnyImage(false);
    setLoadingMessage("");
  }, [generatedPrompts, addHistoryEntry, isSensitiveFilterEnabled, infoMessage]);
  
  useEffect(() => {
    if (!activeTagCategoryId && CATEGORIES.length > 0) {
        const firstCategory = CATEGORIES.find(cat => !cat.isInputCategory && !cat.isNsfwCategory && cat.id !== DERIVED_PINGINFO_TAG_CATEGORY.id && cat.id !== VISION_DERIVED_TAG_CATEGORY.id) || CATEGORIES.find(cat => !cat.isInputCategory && !cat.isNsfwCategory ) || CATEGORIES.find(cat => !cat.isInputCategory) || CATEGORIES[0];
        if (firstCategory) setActiveTagCategoryId(firstCategory.id);
    }
  }, [activeTagCategoryId]);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    HistoryService.deleteHistoryItem(id);
    loadHistory();
  }, [loadHistory]);

  const handleClearAllHistory = useCallback(() => {
    if (window.confirm("本当にすべての履歴を削除しますか？この操作は元に戻せません。")) {
      HistoryService.clearAllHistory();
      loadHistory();
    }
  }, [loadHistory]);

  const handleReuseHistoryItem = useCallback((item: HistoryItem) => {
    setError(null);
    setInfoMessage(null);
    setExtractedNegativePromptText(null); 
    setIsDescriptionFromPingInfo(false); 
    setIsDescriptionFromImageVision(false);
    if (item.type === 'prompt_generation') {
      if (item.selectedTagsSnapshot) {
        updateAndSortSelectedTags(item.selectedTagsSnapshot); 
      }
      setJapaneseDescription(item.japaneseDescriptionSnapshot || '');
      setGeneratedPrompts(item.generatedPromptsSnapshot || null);
      setGeneratedImageItems(null);
    } else if (item.type === 'image_generation') {
      const singleImageItem: GeneratedImageItem = {
        id: `history-${item.id}`,
        format: item.format || 'imagePrompt',
        imageUrl: item.generatedImageUrl || null,
        isLoading: false,
        error: null,
        promptText: item.promptText,
        modelName: item.modelName || IMAGEN_MODEL_NAME
      };
      setGeneratedImageItems([singleImageItem]);
      
      const correspondingPromptItem = historyItems.find(h => h.type === 'prompt_generation' && 
                                                        (h.generatedPromptsSnapshot?.imagePrompt === item.promptText || 
                                                         h.generatedPromptsSnapshot?.stableDiffusion === item.promptText ||
                                                         h.generatedPromptsSnapshot?.midjourney === item.promptText));
      if (correspondingPromptItem) {
          if (correspondingPromptItem.selectedTagsSnapshot) updateAndSortSelectedTags(correspondingPromptItem.selectedTagsSnapshot);
          setJapaneseDescription(correspondingPromptItem.japaneseDescriptionSnapshot || '');
          setGeneratedPrompts(correspondingPromptItem.generatedPromptsSnapshot || null);
      } else {
        setJapaneseDescription(''); 
        setGeneratedPrompts(prev => ({ // Keep other prompts if they exist, update only relevant one
            stableDiffusion: prev?.stableDiffusion || (item.format === 'stableDiffusion' ? item.promptText : ''),
            midjourney: prev?.midjourney || (item.format === 'midjourney' ? item.promptText : ''),
            imagePrompt: prev?.imagePrompt || (item.format === 'imagePrompt' ? item.promptText : item.promptText),
            yaml: prev?.yaml || '',
        }));
      }
      setShowImageGenerationModal(true); 
    }
    setShowHistoryPanel(false); 
  }, [updateAndSortSelectedTags, historyItems]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-3 sm:p-6 md:p-8">
      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageFileChange} style={{ display: 'none' }} disabled={isLoading || isGeneratingAnyImage } />
      <input type="file" accept="image/png,image/jpeg,image/webp" ref={metadataInputRef} onChange={handleMetadataFileChange} style={{ display: 'none' }} disabled={isLoading || isGeneratingAnyImage } />
      
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <header className="mb-6 md:mb-10">
          <div className="flex justify-between items-center">
            <div className="w-14 md:w-16"></div> 
            <div className="flex-1 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-100">タグ選択式プロンプトビルダー</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-2">タグを選択・生成してAI画像用のプロンプトを作成しましょう</p>
            </div>
            <div className="flex flex-col items-center w-14 md:w-16"> 
              <button
                onClick={() => setShowHistoryPanel(true)}
                className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                title="履歴を表示"
                aria-label="履歴を表示"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-gray-400">
                  <path fillRule="evenodd" d="M2 5.5A2.5 2.5 0 014.5 3h11A2.5 2.5 0 0118 5.5v2.533a2.504 2.504 0 00-1.145-.9V5.5a1 1 0 00-1-1h-11a1 1 0 00-1 1v1.171C2.946 7.11 2 8.2 2 9.5V14.5A2.5 2.5 0 004.5 17h5.085a2.504 2.504 0 01.9-.145V15.5a1 1 0 01-1-1h-3.5a.5.5 0 01-.5-.5V10a.5.5 0 01.5.5h11a.5.5 0 01.5.5v2.085c.386.079.75.21 1.085.385H18A1.5 1.5 0 0016.5 11h-13A1.5 1.5 0 002 12.5v-3zm14.585 3.702a.75.75 0 00-1.06-1.06L12.5 11.168V8.25a.75.75 0 00-1.5 0v3.623c0 .33.12.645.337.89l2.5 3a.75.75 0 001.1-.98l-2.187-2.624 2.835-2.836z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-xs text-gray-400 mt-0.5">履歴</span>
            </div>
          </div>
        </header>


        {apiKeyStatus.startsWith("警告:") && (
          <div className="bg-yellow-500/20 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-md shadow-md text-sm" role="alert">
            {apiKeyStatus}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-700 text-red-300 px-4 py-3 rounded-md shadow-md text-sm flex justify-between items-center" role="alert">
            <div>
                <strong className="font-bold">エラー: </strong>
                <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="ml-2 text-xs underline hover:text-red-200">閉じる</button>
          </div>
        )}
        {infoMessage && (
            <div className="bg-sky-500/20 border border-sky-700 text-sky-300 px-4 py-3 rounded-md shadow-md text-sm flex justify-between items-center" role="status">
                <div>
                    <strong className="font-bold">情報: </strong>
                    <span>{infoMessage}</span>
                </div>
                <button onClick={() => setInfoMessage(null)} className="ml-2 text-xs underline hover:text-sky-200">閉じる</button>
            </div>
        )}
        {(isLoading || isGeneratingAnyImage) && loadingMessage && (
            <div className="bg-blue-500/20 border border-blue-700 text-blue-300 px-4 py-3 rounded-md shadow-md text-sm flex items-center" role="status">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingMessage}
            </div>
        )}

        <SelectedTagsArea
          selectedTags={selectedTags}
          categories={CATEGORIES}
          onRemoveTag={handleRemoveSelectedTag}
          onReorderTags={handleReorderSelectedTags}
          onShowPersonaModal={() => setShowPersonaModal(true)}
          onShowImageTagger={triggerImageUpload} 
          onTriggerMetadataUpload={triggerMetadataUpload} 
          onGenerateRandomPersonaTags={handleRandomPersonaTagGeneration}
          onClearAllTags={handleClearAllTags}
          maxTokens={MAX_TOKENS}
          onToggleLock={handleToggleTagLock}
          showLockedOnlyFilter={showLockedOnlyFilter}
          onToggleShowLockedOnlyFilter={handleToggleShowLockedOnlyFilter}
          onUnlockAllTags={handleUnlockAllTags}
        />

        <TagSelector
          categories={CATEGORIES.filter(c => 
            c.id !== DERIVED_PINGINFO_TAG_CATEGORY.id && 
            c.id !== VISION_DERIVED_TAG_CATEGORY.id 
          )} 
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          activeCategoryId={activeTagCategoryId}
          setActiveCategoryId={setActiveTagCategoryId}
          onBulkAddTags={handleBulkAddTags}
          onUnlockNsfw={handleUnlockNsfwRequest} 
          isNsfwUnlocked={isNsfwSectionUnlocked}
        />
        
        <PromptOutputArea
            selectedTagsCount={selectedTags.length}
            japaneseDescription={japaneseDescription}
            onGenerate={handleGenerateAllOutputs}
            generatedPrompts={generatedPrompts}
            currentFormat={currentOutputFormat}
            onSetFormat={setCurrentOutputFormat}
            onCopy={handleCopyToClipboard}
            isLoading={isLoading} // Only text generation loading
            onGenerateImage={handleGenerateImageWithSelectedPrompt}
            isGeneratingImage={isGeneratingAnyImage && (generatedImageItems ? generatedImageItems.length === 1 && generatedImageItems[0].isLoading : false)}
            canGenerateImage={!!currentOutputFormat && currentOutputFormat !== 'yaml' && !!generatedPrompts && !!process.env.API_KEY}
            onGenerateImagesForAllPrompts={handleGenerateImagesForAllPrompts}
            isGeneratingAllImages={isGeneratingAnyImage && (generatedImageItems ? generatedImageItems.length > 1 && generatedImageItems.some(item => item.isLoading) : false)}
            isSensitiveFilterEnabled={isSensitiveFilterEnabled}
            onToggleSensitiveFilter={handleToggleSensitiveFilter}
        />
         {extractedNegativePromptText && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg shadow">
                <h3 className="text-sm font-semibold text-gray-400 mb-1.5">抽出されたネガティブプロンプト:</h3>
                <p className="text-xs text-gray-300 whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar">
                    {extractedNegativePromptText}
                </p>
            </div>
        )}


        {showPersonaModal && (
          <PersonaThemeModal
            isOpen={showPersonaModal}
            onClose={() => setShowPersonaModal(false)}
            personaThemes={PERSONA_THEMES}
            onCreatePersonaByTheme={handleCreatePersonaByTheme}
          />
        )}

        {showImageGenerationModal && generatedImageItems && (
          <ImageGenerationModal
            isOpen={showImageGenerationModal}
            onClose={() => {
              setShowImageGenerationModal(false);
              // Do not clear generatedImageItems here, let App.tsx manage it
              // This allows re-showing modal if needed without re-fetching
            }}
            imageItems={generatedImageItems}
            overallIsLoading={isGeneratingAnyImage && generatedImageItems.some(item => item.isLoading)}
            yamlToDownload={generatedPrompts?.yaml || null}
          />
        )}

        {showHistoryPanel && (
          <HistoryPanel
            isOpen={showHistoryPanel}
            onClose={() => setShowHistoryPanel(false)}
            historyItems={historyItems}
            onReuseItem={handleReuseHistoryItem}
            onDeleteItem={handleDeleteHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onRegenerateImage={(prompt, format) => handleGenerateImageWithSelectedPrompt(prompt, format || 'imagePrompt')}
          />
        )}


         <footer className="text-center text-gray-500 text-xs mt-10 pb-6">
            タグ選択式プロンプトビルダー &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default App;
