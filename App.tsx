
import React, { useState, useCallback, useEffect, useRef } from 'react';
import YAML from 'yaml';
import { Tag, OutputFormat, GeneratedPrompts, PersonaTheme as PersonaThemeType, Category, HistoryItem } from './types';
import { CATEGORIES, PERSONA_THEMES, MAX_TOKENS, STABLE_DIFFUSION_QUALITY_PREFIX, ALL_TAGS_WITH_CATEGORY_ID, MIDJOURNEY_PARAMS, GEMINI_TEXT_MODEL_NAME, IMAGEN_MODEL_NAME, DERIVED_PINGINFO_TAG_CATEGORY, BANNED_WORDS } from './constants';
import * as HistoryService from './services/historyService'; // Import history service
import SelectedTagsArea from './components/SelectedTagsList';
import TagSelector from './components/CategoryTagSelector';
import PromptOutputArea from './components/PromptOutputArea';
import PersonaThemeModal from './components/TemplateModal'; 
import ImageGenerationModal from './components/ImageGenerationModal';
import HistoryPanel from './components/HistoryPanel'; // Import HistoryPanel
import LoginScreen from './components/LoginScreen'; // Import LoginScreen
import SecureLoginScreen from './components/SecureLoginScreen'; // Import SecureLoginScreen
import ApiKeyModal from './components/ApiKeyModal'; // Import ApiKeyModal
import { 
  generateJapaneseDescription, 
  generateImagePromptNaturalLanguage, 
  generateMidjourneyPrompt,
  translateToJapanese,
  translateToEnglish,
  extractTagsFromImage,
  generateCharacterPersona,
  extractTagsFromText,
  generateImageWithImagen,
  extractPromptFromImageMetadata, 
  translateTagsToJapaneseBulk,
  cleanImagePromptString, 
  extractEnglishKeywordsFromJapaneseText,
  filterSensitiveWords, // Import the filter function
} from './services/geminiService';

if (typeof process === 'undefined') {
  // @ts-ignore
  window.process = { env: {} };
}

// Defines the "slots" for random persona tag generation
// Hair style is handled specially to pick EITHER length OR style.
const PERSONA_TAG_SLOTS: Array<{ categoryId: string; subCategoryId?: string; count: number; required?: boolean; isHairShape?: boolean }> = [
  { categoryId: 'styleArt', count: 1, required: true },
  { categoryId: 'features', subCategoryId: 'race', count: 1, required: true },
  { categoryId: 'features', subCategoryId: 'gender', count: 1, required: true },
  { categoryId: 'features', subCategoryId: 'age', count: 1, required: true },
  { categoryId: 'face', subCategoryId: 'eyes', count: 1, required: true },
  { categoryId: 'face', subCategoryId: 'mouth', count: 1, required: false },
  { categoryId: 'hair', isHairShape: true, count: 1, required: true }, // Special slot for hair length/style
  { categoryId: 'hair', subCategoryId: 'hairColor', count: 1, required: true },
  { categoryId: 'body', subCategoryId: 'bodyType', count: 1, required: true },
  { categoryId: 'clothing', count: 1, required: true },
  { categoryId: 'action', count: 1, required: false },
  { categoryId: 'expression', count: 1, required: false },
  { categoryId: 'decoration', count: 1, required: false },
];

const formatLabels: Record<OutputFormat, string> = {
  stableDiffusion: 'Stable Diffusion',
  midjourney: 'Midjourney',
  imagePrompt: 'ImagePrompt (自然言語)',
  yaml: 'YAML Code',
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [activeTagCategoryId, setActiveTagCategoryId] = useState<string | null>(
    CATEGORIES.length > 0 ? CATEGORIES[0].id : null
  );
  
  const [japaneseDescription, setJapaneseDescription] = useState<string>('');
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompts | null>(null);
  const [currentOutputFormat, setCurrentOutputFormat] = useState<OutputFormat>('stableDiffusion');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('APIキーを確認中...');
  const [showPersonaModal, setShowPersonaModal] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  const [showImageGenerationModal, setShowImageGenerationModal] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [promptUsedForImageGen, setPromptUsedForImageGen] = useState<string | null>(null);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState<boolean>(false);
  
  const [extractedNegativePromptText, setExtractedNegativePromptText] = useState<string | null>(null);
  const [isDescriptionFromPingInfo, setIsDescriptionFromPingInfo] = useState<boolean>(false);
  const [showLockedOnlyFilter, setShowLockedOnlyFilter] = useState<boolean>(false);
  const [isSensitiveFilterEnabled, setIsSensitiveFilterEnabled] = useState<boolean>(true);


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

  // Handle logout function defined early to avoid circular dependency
  const handleLogout = useCallback(() => {
    localStorage.removeItem("userId");
    localStorage.removeItem("login");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("expiryTime");
    setIsLoggedIn(false);
    setCurrentUser('');
  }, []);

  // Check login status and session expiration on component mount
  useEffect(() => {
    const loginStatus = localStorage.getItem("login");
    const storedUserId = localStorage.getItem("userId");
    const expiryTime = localStorage.getItem("expiryTime");
    
    if (loginStatus === "true" && storedUserId) {
      // Check if session has expired
      if (expiryTime) {
        const currentTime = new Date().getTime();
        if (currentTime > parseInt(expiryTime)) {
          // Session expired, log out
          handleLogout();
          return;
        }
      }
      
      setIsLoggedIn(true);
      setCurrentUser(storedUserId);
    }
  }, [handleLogout]);

  // Check API key status on component mount
  useEffect(() => {
    try {
      // Check if API key exists in localStorage
      const apiKeysEncrypted = localStorage.getItem('secure_api_keys');
      const selectedApiType = localStorage.getItem('selected_api_type');
      
      if (apiKeysEncrypted && selectedApiType) {
        // API key exists in localStorage, set status to detected
        setApiKeyStatus('APIキー検出済み');
        
        // Try to apply the API key from localStorage
        if (typeof window !== 'undefined') {
          if (!window.process) {
            window.process = { env: {} };
          } else if (!window.process.env) {
            window.process.env = {};
          }
          
          // We don't decrypt the key here as it's handled by ApiKeyManager
          // This just ensures the app knows an API key is available
          window.process.env.API_KEY = 'stored-key-exists';
          window.process.env.GEMINI_API_KEY = 'stored-key-exists';
        }
      } else if (process.env.API_KEY) {
        // API key exists in environment variables
        setApiKeyStatus('APIキー検出済み');
      } else {
        // No API key found
        setApiKeyStatus('警告: APIキーが見つかりません。Gemini連携機能（説明生成、翻訳、画像読取り、ペルソナ作成、画像生成等）は利用できません。');
      }
    } catch (error) {
      console.error('Error checking API key status:', error);
      setApiKeyStatus('警告: APIキーの確認中にエラーが発生しました。');
    }
  }, []);
  
  // Handle API key change
  const handleApiKeyChange = useCallback((apiKey: string | null) => {
    if (apiKey) {
      setApiKeyStatus('APIキー検出済み');
    } else {
      setApiKeyStatus('警告: APIキーが見つかりません。Gemini連携機能（説明生成、翻訳、画像読取り、ペルソナ作成、画像生成等）は利用できません。');
    }
  }, []);
  
  // Handle login
  const handleLogin = (userId: string) => {
    setIsLoggedIn(true);
    setCurrentUser(userId);
  };

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

  const handleTagSelect = useCallback((tag: Tag) => {
    setIsDescriptionFromPingInfo(false); 
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
    const loadingMsgPrefix = isTaggerOrPersona ? '生成タグ' : 'カスタムタグ';

    const japaneseRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/;
    const isInputJapanese = japaneseRegex.test(originalInput);

    if (process.env.API_KEY) {
      try {
        if (isInputJapanese) {
          setLoadingMessage(`${loadingMsgPrefix}「${originalInput}」を英語に翻訳中...`);
          name = await translateToEnglish(originalInput);
          japaneseName = originalInput;
        } else {
          setLoadingMessage(`${loadingMsgPrefix}「${originalInput}」を日本語に翻訳中...`);
          japaneseName = await translateToJapanese(originalInput);
          name = originalInput; 
        }
      } catch (translationError: any) {
        if (translationError.message === "AI_REQUEST_BLOCKED") {
          setError("翻訳処理がAIによりブロックされました。テキスト内容を確認してください。");
        } else {
          const targetLang = isInputJapanese ? "英語" : "日本語";
          console.warn(`「${originalInput}」の${targetLang}への翻訳に失敗しました:`, translationError.message, "元のテキストを使用します。");
          setError(`「${originalInput}」の翻訳に失敗しました。`);
        }
        name = originalInput; 
        japaneseName = originalInput; 
      }
    } else {
      console.warn("APIキーが未設定のため、翻訳は行われません。");
    }
    
    const tagTypePrefix = isTaggerOrPersona ? (categoryId === 'persona' ? 'persona' : (categoryId === 'metadata' ? 'metadata' : (categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id ? 'derived' : 'tagger'))) : 'custom';
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
    if (categoryId !== 'metadata' && categoryId !== DERIVED_PINGINFO_TAG_CATEGORY.id) { 
      setIsDescriptionFromPingInfo(false);
    }
    setIsLoading(true);
    setLoadingMessage('タグを一括追加・処理中...');
    let newTagsBatch: Tag[] = [];
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    const allowMultipleForCategory = category?.allowMultipleSelections;

    const currentSelectedTagsSnapshot = selectedTags; 

    if (categoryId === 'metadata' || categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) { 
        const englishTagNames = tagNamesFromInput; 
        if (englishTagNames.length > 0) {
            setLoadingMessage('メタデータタグを日本語に一括翻訳中...');
            try {
                const translatedJapaneseNames = await translateTagsToJapaneseBulk(englishTagNames);
                for (let i = 0; i < englishTagNames.length; i++) {
                    if (currentSelectedTagsSnapshot.length + newTagsBatch.length >= MAX_TOKENS) {
                        setError(`トークン数の上限 (${MAX_TOKENS}) に達するため、一部のタグのみ処理されます。`);
                        break;
                    }
                    const baseIdPart = englishTagNames[i].toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                    const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;

                    const newTag: Tag = {
                        id: `${categoryId === 'metadata' ? 'metadata' : 'derived'}-${categoryId}-${baseIdPart}${uniqueSuffix}`,
                        name: englishTagNames[i],
                        japaneseName: translatedJapaneseNames[i] || englishTagNames[i], 
                        categoryId: categoryId,
                        isLocked: false,
                    };

                    if (allowMultipleForCategory) { 
                        newTag.id = `${newTag.id}_instance_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
                        newTagsBatch.push(newTag);
                    } else {
                        const alreadyExists = currentSelectedTagsSnapshot.some(st => st.name.toLowerCase() === newTag.name.toLowerCase() && st.categoryId === categoryId) ||
                                           newTagsBatch.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase() && nt.categoryId === categoryId);
                        
                        if (!alreadyExists || categoryId === 'metadata' || categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) { 
                           newTagsBatch.push(newTag);
                        }
                    }
                }
            } catch (e: any) {
                console.error("Bulk translation failed for tags:", e);
                if (e.message === "AI_REQUEST_BLOCKED") {
                  setError("タグの一括翻訳がAIによりブロックされました。");
                } else {
                  setError("タグの一括翻訳に失敗しました。元の英語名を使用します。");
                }
                for (let i = 0; i < englishTagNames.length; i++) { 
                    if (currentSelectedTagsSnapshot.length + newTagsBatch.length >= MAX_TOKENS) break;
                    const baseIdPart = englishTagNames[i].toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                    const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
                    const newTag: Tag = {
                        id: `${categoryId === 'metadata' ? 'metadata' : 'derived'}-${categoryId}-${baseIdPart}${uniqueSuffix}`,
                        name: englishTagNames[i],
                        japaneseName: englishTagNames[i],
                        categoryId: categoryId,
                        isLocked: false,
                    };
                    if (allowMultipleForCategory) { 
                        newTag.id = `${newTag.id}_instance_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
                        newTagsBatch.push(newTag);
                     } 
                    else { 
                        if (!currentSelectedTagsSnapshot.some(st => st.name.toLowerCase() === newTag.name.toLowerCase() && st.categoryId === categoryId) &&
                            !newTagsBatch.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase() && nt.categoryId === categoryId)) {
                           newTagsBatch.push(newTag);
                        }
                    }
                }
            }
        }
    } else { 
        for (const name of tagNamesFromInput) {
            if (currentSelectedTagsSnapshot.length + newTagsBatch.length >= MAX_TOKENS) {
                setError(`トークン数の上限 (${MAX_TOKENS}) に達するため、一部のタグのみ処理されます。`);
                break;
            }
            const newTag = await addTagWithTranslation(name, categoryId, categoryId === 'input');
            if (newTag) {
                if (allowMultipleForCategory) {
                    newTag.id = `${newTag.id}_instance_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
                    newTagsBatch.push(newTag);
                } else {
                    if (!currentSelectedTagsSnapshot.some(st => st.name.toLowerCase() === newTag.name.toLowerCase() && st.categoryId === categoryId) &&
                        !newTagsBatch.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase() && nt.categoryId === categoryId)) {
                        newTagsBatch.push(newTag);
                    }
                }
            }
        }
    }

    if (categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) {
        updateAndSortSelectedTags(newTagsBatch.slice(0,MAX_TOKENS)); 
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
  }, [selectedTags, addTagWithTranslation, updateAndSortSelectedTags]); 


  const handleRemoveSelectedTag = useCallback((tagId: string) => {
    const tagToRemove = selectedTags.find(t => t.id === tagId);
    if (tagToRemove && tagToRemove.isLocked) {
        alert("このタグはロックされています。削除するにはまずアンロックしてください。");
        return;
    }
    setIsDescriptionFromPingInfo(false);
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
    setGeneratedImageUrl(null);
    setImageGenerationError(null);
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
    setGeneratedPrompts(null);
    setJapaneseDescription(''); 
    setExtractedNegativePromptText(null);
    setIsDescriptionFromPingInfo(false);

    const existingLockedTags = selectedTags.filter(t => t.isLocked);

    try {
      const isRandomGeneration = themeId === 'random_persona';
      const personaText = await generateCharacterPersona(themeName, isRandomGeneration);
      setJapaneseDescription(personaText); 

      const extractedEnglishTags = await extractTagsFromText(personaText);
      
      let newPersonaTags: Tag[] = [];
      const personaSourceCategoryId = 'input'; 

      if (extractedEnglishTags.length > 0 && process.env.API_KEY) {
        setLoadingMessage('ペルソナタグを日本語に一括翻訳中...');
        const translatedJapaneseNames = await translateTagsToJapaneseBulk(extractedEnglishTags);

        for (let i = 0; i < extractedEnglishTags.length; i++) {
           if (existingLockedTags.length + newPersonaTags.length >= MAX_TOKENS) {
                setError(`トークン数の上限 (${MAX_TOKENS}) に達するため、ペルソナからの一部のタグのみ追加されました。`);
                break;
            }
            const baseIdPart = extractedEnglishTags[i].toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
            const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
            const newTag: Tag = {
                id: `persona-${personaSourceCategoryId}-${baseIdPart}${uniqueSuffix}`,
                name: extractedEnglishTags[i],
                japaneseName: translatedJapaneseNames[i] || extractedEnglishTags[i],
                categoryId: personaSourceCategoryId,
                isLocked: false,
            };
            if (!existingLockedTags.some(st => st.name.toLowerCase() === newTag.name.toLowerCase()) && 
                !newPersonaTags.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase())) {
                newPersonaTags.push(newTag);
            }
        }
      } else { 
         for (const tagName of extractedEnglishTags) { 
            if (existingLockedTags.length + newPersonaTags.length >= MAX_TOKENS) break;
            const newTag = await addTagWithTranslation(tagName, personaSourceCategoryId , true); 
            if (newTag && !existingLockedTags.some(st => st.name.toLowerCase() === newTag.name.toLowerCase()) && 
                !newPersonaTags.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase())) {
                newPersonaTags.push(newTag);
            }
         }
      }
      
      updateAndSortSelectedTags(prev => {
        const currentLocked = prev.filter(t => t.isLocked); 
        const combined = [...currentLocked, ...newPersonaTags.filter(np => !currentLocked.some(cl => cl.name.toLowerCase() === np.name.toLowerCase()))];
         if (combined.length > MAX_TOKENS) {
            setError(`トークン数の上限 (${MAX_TOKENS}) を超えるため、一部のタグのみ追加されました。`);
            return combined.slice(0, MAX_TOKENS);
        }
        return combined;
      });

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
  }, [selectedTags, addTagWithTranslation, updateAndSortSelectedTags]); 

  const handleRandomPersonaTagGeneration = useCallback(() => {
    setIsDescriptionFromPingInfo(false);
    setIsLoading(true);
    setLoadingMessage('ランダムにタグを生成中...');
    setError(null);
    setJapaneseDescription('');
    setGeneratedPrompts(null);
    setGeneratedImageUrl(null);
    setImageGenerationError(null);
    setExtractedNegativePromptText(null);

    const lockedTags = selectedTags.filter(t => t.isLocked);
    let newGeneratedTags: Tag[] = [...lockedTags];
    let currentTokenCount = newGeneratedTags.length;

    const categoriesCoveredByLocked = new Set<string>(lockedTags.map(t => t.categoryId));
    const slotsFilledByLocked = new Set<string>();

    for (const lockedTag of lockedTags) {
        for (const slot of PERSONA_TAG_SLOTS) {
            if (lockedTag.categoryId === slot.categoryId && 
                (slot.subCategoryId ? lockedTag.subCategoryId === slot.subCategoryId : true) || 
                (slot.isHairShape && lockedTag.categoryId === 'hair' && (lockedTag.subCategoryId === 'hairLength' || lockedTag.subCategoryId === 'hairStyle'))) {
                const slotKey = slot.isHairShape ? 'hair-shape' : (slot.subCategoryId ? `${slot.categoryId}-${slot.subCategoryId}` : slot.categoryId);
                slotsFilledByLocked.add(slotKey);
                break; 
            }
        }
    }
    
    const maleGenderIds = ALL_TAGS_WITH_CATEGORY_ID.filter(t => t.categoryId === 'features' && t.subCategoryId === 'gender' && (t.name === '1boy' || t.name === 'man')).map(t => t.id);
    const femaleGenderIds = ALL_TAGS_WITH_CATEGORY_ID.filter(t => t.categoryId === 'features' && t.subCategoryId === 'gender' && (t.name === '1girl' || t.name === 'woman')).map(t => t.id);
    const elderlyWomanAgeId = ALL_TAGS_WITH_CATEGORY_ID.find(t=> t.categoryId === 'features' && t.subCategoryId === 'age' && t.name === 'elderly woman')?.id;
    const elderlyManAgeId = ALL_TAGS_WITH_CATEGORY_ID.find(t => t.categoryId === 'features' && t.subCategoryId === 'age' && t.name === 'elderly man')?.id;
    const baldOrVeryShortHairLengthIds = ALL_TAGS_WITH_CATEGORY_ID.filter(t => t.categoryId === 'hair' && t.subCategoryId === 'hairLength' && (t.name === 'bald' || t.name === 'very short hair')).map(t=>t.id);
    const braidHairStyleIds = ALL_TAGS_WITH_CATEGORY_ID.filter(t => t.categoryId === 'hair' && t.subCategoryId === 'hairStyle' && t.name.includes('braid')).map(t => t.id);


    for (const slot of PERSONA_TAG_SLOTS) {
        if (currentTokenCount >= MAX_TOKENS && slot.required) {
            console.warn(`MAX_TOKENS reached, but slot ${slot.categoryId}/${slot.subCategoryId || ''} is required.`);
        } else if (currentTokenCount >= MAX_TOKENS && !slot.required) {
            continue;
        }

        const slotKey = slot.isHairShape ? 'hair-shape' : (slot.subCategoryId ? `${slot.categoryId}-${slot.subCategoryId}` : slot.categoryId);
        
        if (slotsFilledByLocked.has(slotKey)) {
            continue; 
        }
        if (categoriesCoveredByLocked.has(slot.categoryId) && !slot.isHairShape) { 
            const isLockMoreGeneral = lockedTags.some(lt => lt.categoryId === slot.categoryId && 
                (slot.subCategoryId ? lt.subCategoryId !== slot.subCategoryId : true) 
            );
            if (isLockMoreGeneral) continue;
        }


        let availableTagsForSlot: Tag[] = [];
        if (slot.isHairShape) {
            const hairLengthTags = ALL_TAGS_WITH_CATEGORY_ID.filter(tag => 
                tag.categoryId === 'hair' && tag.subCategoryId === 'hairLength' &&
                !categoriesCoveredByLocked.has('hair') 
            );
            const hairStyleTags = ALL_TAGS_WITH_CATEGORY_ID.filter(tag => 
                tag.categoryId === 'hair' && tag.subCategoryId === 'hairStyle' &&
                !categoriesCoveredByLocked.has('hair') 
            );
            availableTagsForSlot = [...hairLengthTags, ...hairStyleTags];

            const selectedHairLengthTag = newGeneratedTags.find(t => t.categoryId === 'hair' && t.subCategoryId === 'hairLength' && !t.isLocked);
            const selectedHairStyleTag = newGeneratedTags.find(t => t.categoryId === 'hair' && t.subCategoryId === 'hairStyle' && !t.isLocked);

            if (selectedHairLengthTag && baldOrVeryShortHairLengthIds.includes(selectedHairLengthTag.id)) {
                availableTagsForSlot = availableTagsForSlot.filter(t => t.subCategoryId !== 'hairStyle' || !braidHairStyleIds.includes(t.id));
            }
            if (selectedHairStyleTag && braidHairStyleIds.includes(selectedHairStyleTag.id)) {
                 availableTagsForSlot = availableTagsForSlot.filter(t => t.subCategoryId !== 'hairLength' || !baldOrVeryShortHairLengthIds.includes(t.id));
            }
        } else {
            availableTagsForSlot = ALL_TAGS_WITH_CATEGORY_ID.filter(tag =>
                tag.categoryId === slot.categoryId &&
                (slot.subCategoryId ? tag.subCategoryId === slot.subCategoryId : true) && 
                !(tag.categoryId === 'free' || tag.categoryId === 'input' || tag.categoryId === DERIVED_PINGINFO_TAG_CATEGORY.id) &&
                !categoriesCoveredByLocked.has(tag.categoryId) 
            );
        }
        
        if (slot.categoryId === 'features' && slot.subCategoryId === 'age') {
            const newlySelectedGenderTag = newGeneratedTags.find(t => t.categoryId === 'features' && t.subCategoryId === 'gender' && !t.isLocked);
            if (newlySelectedGenderTag) {
                if (maleGenderIds.includes(newlySelectedGenderTag.id) && elderlyWomanAgeId) availableTagsForSlot = availableTagsForSlot.filter(t => t.id !== elderlyWomanAgeId);
                else if (femaleGenderIds.includes(newlySelectedGenderTag.id) && elderlyManAgeId) availableTagsForSlot = availableTagsForSlot.filter(t => t.id !== elderlyManAgeId);
            }
        }
        if (slot.categoryId === 'hair' && slot.subCategoryId === 'hairStyle') {
            const existingHairLengthTag = newGeneratedTags.find(t => t.categoryId === 'hair' && t.subCategoryId === 'hairLength' && !t.isLocked);
            if (existingHairLengthTag && baldOrVeryShortHairLengthIds.includes(existingHairLengthTag.id)) {
                availableTagsForSlot = availableTagsForSlot.filter(t => !braidHairStyleIds.includes(t.id));
            }
        }
        if (slot.categoryId === 'hair' && slot.subCategoryId === 'hairLength') {
             const existingHairStyleTag = newGeneratedTags.find(t => t.categoryId === 'hair' && t.subCategoryId === 'hairStyle' && !t.isLocked);
             if (existingHairStyleTag && braidHairStyleIds.includes(existingHairStyleTag.id)) {
                availableTagsForSlot = availableTagsForSlot.filter(t => !baldOrVeryShortHairLengthIds.includes(t.id));
             }
        }

        availableTagsForSlot = availableTagsForSlot.filter(candidateTag => 
            !newGeneratedTags.some(existingTag => !existingTag.isLocked && existingTag.categoryId === candidateTag.categoryId)
        );


        if (availableTagsForSlot.length > 0) {
            for (let i = 0; i < slot.count; i++) {
                if (currentTokenCount >= MAX_TOKENS) break;
                if (availableTagsForSlot.length === 0) break;

                const randomIndex = Math.floor(Math.random() * availableTagsForSlot.length);
                const randomTagCandidate = { ...availableTagsForSlot[randomIndex], isLocked: false }; 

                const isAlreadySelectedThisSession = newGeneratedTags.some(rt =>
                    !rt.isLocked && 
                    ((rt.originalId && rt.originalId === randomTagCandidate.originalId) || rt.id === randomTagCandidate.id || rt.name === randomTagCandidate.name)
                );
                
                if (!isAlreadySelectedThisSession) {
                    newGeneratedTags.push(randomTagCandidate);
                    currentTokenCount++;
                     if (slot.isHairShape) { 
                        slotsFilledByLocked.add('hair-shape'); 
                        if (randomTagCandidate.subCategoryId === 'hairLength') {
                             availableTagsForSlot = availableTagsForSlot.filter(t => t.subCategoryId !== 'hairStyle');
                        } else if (randomTagCandidate.subCategoryId === 'hairStyle') {
                             availableTagsForSlot = availableTagsForSlot.filter(t => t.subCategoryId !== 'hairLength');
                        }
                    } else {
                       slotsFilledByLocked.add(slotKey);
                    }
                }
            }
        } else if (slot.required) {
            console.warn(`No tags found for required slot after filtering: ${slot.categoryId} / ${slot.subCategoryId || ''}`);
        }
    }
    
    const finalHairLengthTags = newGeneratedTags.filter(t => t.categoryId === 'hair' && t.subCategoryId === 'hairLength' && !t.isLocked);
    const finalHairStyleTags = newGeneratedTags.filter(t => t.categoryId === 'hair' && t.subCategoryId === 'hairStyle' && !t.isLocked);

    if (finalHairLengthTags.length > 0 && finalHairStyleTags.length > 0) {
        if (Math.random() < 0.5 && finalHairLengthTags[0]) { 
            newGeneratedTags = newGeneratedTags.filter(t => t.id !== finalHairLengthTags[0].id);
        } else if (finalHairStyleTags[0]) { 
            newGeneratedTags = newGeneratedTags.filter(t => t.id !== finalHairStyleTags[0].id);
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
  }, [selectedTags, updateAndSortSelectedTags]);


  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!process.env.API_KEY) {
        setError("APIキーが未設定のため、画像からのタグ抽出はできません。");
        if (imageInputRef.current) imageInputRef.current.value = ""; 
        return;
      }
      setIsLoading(true);
      setLoadingMessage('画像を処理し、タグを抽出・翻訳・追加中...');
      setError(null);
      setExtractedNegativePromptText(null);
      setIsDescriptionFromPingInfo(false);
      
      const existingLockedTags = selectedTags.filter(t => t.isLocked);

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64ImageData = (reader.result as string).split(',')[1];
            if (!base64ImageData) {
              throw new Error("画像の読み込みに失敗しました。");
            }
            const extractedEnglishTags = await extractTagsFromImage(base64ImageData, file.type);
            
            let newTagsFromImage: Tag[] = [];
            const taggerSourceCategoryId = 'input'; 

            if (extractedEnglishTags.length > 0) {
                 setLoadingMessage('抽出タグを日本語に一括翻訳中...');
                 const translatedJapaneseNames = await translateTagsToJapaneseBulk(extractedEnglishTags);
                 for (let i = 0; i < extractedEnglishTags.length; i++) {
                    if (existingLockedTags.length + newTagsFromImage.length >= MAX_TOKENS) {
                        setError(`トークン数の上限 (${MAX_TOKENS}) に達するため、画像からの一部のタグのみ追加されました。`);
                        break;
                    }
                    const baseIdPart = extractedEnglishTags[i].toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                    const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
                    const newTag: Tag = {
                        id: `tagger-${taggerSourceCategoryId}-${baseIdPart}${uniqueSuffix}`,
                        name: extractedEnglishTags[i],
                        japaneseName: translatedJapaneseNames[i] || extractedEnglishTags[i],
                        categoryId: taggerSourceCategoryId,
                        isLocked: false,
                    };
                    if (!existingLockedTags.some(st => st.name.toLowerCase() === newTag.name.toLowerCase()) && 
                        !newTagsFromImage.some(nt => nt.name.toLowerCase() === newTag.name.toLowerCase())) {
                        newTagsFromImage.push(newTag);
                    }
                 }
            }
            
            updateAndSortSelectedTags(prev => {
              const currentLocked = prev.filter(t => t.isLocked);
              const combined = [...currentLocked, ...newTagsFromImage.filter(ntfi => !currentLocked.some(cl => cl.name.toLowerCase() === ntfi.name.toLowerCase()))];
              if (combined.length > MAX_TOKENS) {
                  setError(`トークン数の上限 (${MAX_TOKENS}) を超えるため、一部のタグのみ追加されました。`);
                  return combined.slice(0, MAX_TOKENS);
              }
              return combined;
            });
            setJapaneseDescription('画像からタグを抽出しました。「プロンプトを生成」でAIによる説明文の生成も可能です。');


          } catch (innerErr: any) {
            console.error("タグ抽出・追加処理エラー:", innerErr);
             if (innerErr.message === "AI_REQUEST_BLOCKED") {
                setError("AIによる画像からのタグ抽出がブロックされました。");
             } else {
                setError(innerErr.message || "画像からのタグ抽出・追加処理中にエラーが発生しました。");
             }
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
    if (isLoading || isGeneratingImage || isGeneratingAllImages) return; 
    imageInputRef.current?.click();
  };

  const handleMetadataFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setLoadingMessage('画像メタデータを読取り中...');
      setError(null);
      // setJapaneseDescription(''); // Keep existing description for now
      setExtractedNegativePromptText(null);
      // setIsDescriptionFromPingInfo(false); // Don't reset this yet

      // Clear only non-locked tags before adding metadata tags
      const lockedTags = selectedTags.filter(t => t.isLocked);
      updateAndSortSelectedTags(lockedTags); 

      try {
        const { positivePrompt, negativePrompt } = await extractPromptFromImageMetadata(file);
        
        // The positivePrompt from extractPromptFromImageMetadata is the "rawer" version.
        // This will be set to japaneseDescription.
        if (positivePrompt && positivePrompt.trim().length > 0) {
          setJapaneseDescription(positivePrompt); 
          setIsDescriptionFromPingInfo(true); 
          
          // Now, clean this positivePrompt specifically for tag generation
          const cleanedPositivePromptForTags = cleanImagePromptString(positivePrompt);
          const tagsToAdd = cleanedPositivePromptForTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
          
          if (tagsToAdd.length > 0) {
            await handleBulkAddTags(tagsToAdd, 'metadata'); 
          }
        } else {
          setError('画像からポジティブプロンプト情報を抽出できませんでした。対応フォーマット (PNG, JPEG, WebP) を確認するか、別の画像をお試しください。');
          setJapaneseDescription(''); // Clear if no positive prompt found
          setIsDescriptionFromPingInfo(false);
        }

        if (negativePrompt && negativePrompt.trim().length > 0) {
          // Clean the negative prompt before storing/displaying
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
    if (isLoading || isGeneratingImage || isGeneratingAllImages) return;
    metadataInputRef.current?.click();
  };


  const handleGenerateAllOutputs = useCallback(async () => {
    if (!process.env.API_KEY && !isDescriptionFromPingInfo && selectedTags.length === 0) {
      setError("プロンプトを生成するには、まずタグを選択するか、メタデータを読み込んでください。");
      return;
    }
    if (!isDescriptionFromPingInfo && selectedTags.length === 0) {
        setError("プロンプトを生成するには、まずタグを選択してください。");
        return;
    }
    if (selectedTags.length > MAX_TOKENS && !isDescriptionFromPingInfo) {
      setError(`トークン数が上限を超えています (${MAX_TOKENS}個まで)。タグを減らしてください。`);
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('各種プロンプトを生成中...');
    setError(null);
    setGeneratedPrompts(null);
    setGeneratedImageUrl(null);
    setImageGenerationError(null);

    let basePromptForAI = '';
    let finalSelectedTagsForOutput = [...selectedTags]; 
    let sourceWasPinginfo = isDescriptionFromPingInfo; 
    let initialPromptForJapaneseDesc = japaneseDescription; 

    if (isDescriptionFromPingInfo && japaneseDescription.trim().length > 0) {
        try {
            setLoadingMessage('メタデータ原文を日本語に翻訳し、キーワードを抽出しています...');
            const filteredRawEnglishPrompt = isSensitiveFilterEnabled 
                ? filterSensitiveWords(japaneseDescription, BANNED_WORDS) 
                : japaneseDescription;

            const aiTranslatedJapaneseText = await translateToJapanese(filteredRawEnglishPrompt); 
            const derivedEnglishKeywordsString = await extractEnglishKeywordsFromJapaneseText(aiTranslatedJapaneseText);
            
            if (derivedEnglishKeywordsString.trim().length > 0) {
                const derivedEnglishKeywordsArray = derivedEnglishKeywordsString.split(',').map(k => k.trim()).filter(k => k.length > 0);
                
                setLoadingMessage('派生キーワードを日本語に一括翻訳中...');
                const translatedJapaneseNames = await translateTagsToJapaneseBulk(derivedEnglishKeywordsArray);

                const newDerivedTags: Tag[] = [];
                for (let i = 0; i < derivedEnglishKeywordsArray.length; i++) {
                    const baseIdPart = derivedEnglishKeywordsArray[i].toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
                    const uniqueSuffix = `-${Date.now().toString(36).substring(2,5)}-${i}`;
                    newDerivedTags.push({
                        id: `derived-${DERIVED_PINGINFO_TAG_CATEGORY.id}-${baseIdPart}${uniqueSuffix}`,
                        name: derivedEnglishKeywordsArray[i],
                        japaneseName: translatedJapaneseNames[i] || derivedEnglishKeywordsArray[i],
                        categoryId: DERIVED_PINGINFO_TAG_CATEGORY.id,
                        isLocked: false, 
                    });
                }
                updateAndSortSelectedTags(newDerivedTags.slice(0, MAX_TOKENS)); 
                finalSelectedTagsForOutput = newDerivedTags.slice(0, MAX_TOKENS);
                basePromptForAI = cleanImagePromptString(finalSelectedTagsForOutput.map(tag => tag.name).join(', '));
                initialPromptForJapaneseDesc = aiTranslatedJapaneseText; 
            } else {
                setLoadingMessage('キーワード抽出に失敗。元のタグを使用します。');
                basePromptForAI = cleanImagePromptString(selectedTags.map(tag => tag.name).join(', '));
                initialPromptForJapaneseDesc = filteredRawEnglishPrompt;
            }
            // setIsDescriptionFromPingInfo(false); // Do not reset here, reset after full generation cycle
        } catch(pingInfoProcessingError: any) {
            console.error("PingInfo由来プロンプト処理エラー:", pingInfoProcessingError);
            if (pingInfoProcessingError.message === "AI_REQUEST_BLOCKED") {
                setError("AIによるメタデータ処理（翻訳またはキーワード抽出）がブロックされました。フィルター設定を確認するか、内容を調整してください。");
            } else {
                setError(`メタデータ由来プロンプトの処理中にエラー: ${pingInfoProcessingError.message}。既存のタグで続行します。`);
            }
            basePromptForAI = cleanImagePromptString(selectedTags.map(tag => tag.name).join(', '));
            initialPromptForJapaneseDesc = japaneseDescription; 
            // setIsDescriptionFromPingInfo(false); // Reset here on error path too
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
        basePromptForAI = cleanImagePromptString(promptParts.join(', '));
    }

    if (isSensitiveFilterEnabled) {
        basePromptForAI = filterSensitiveWords(basePromptForAI, BANNED_WORDS);
    }

    const yamlOutput = YAML.stringify(finalSelectedTagsForOutput.map(t => ({
        name: t.name, 
        japanese_name: t.japaneseName, 
        category: CATEGORIES.find(c=>c.id === t.categoryId)?.name || t.categoryId, 
        sub_category: t.subCategoryId ? CATEGORIES.find(c=>c.id === t.categoryId)?.subCategories?.find(sc=>sc.id === t.subCategoryId)?.name : 'N/A',
        is_locked: t.isLocked || false,
    })));

    let currentPrompts: GeneratedPrompts = {
        stableDiffusion: STABLE_DIFFUSION_QUALITY_PREFIX + basePromptForAI,
        midjourney: basePromptForAI + MIDJOURNEY_PARAMS, 
        imagePrompt: basePromptForAI, 
        yaml: yamlOutput,
      };
    
    let descForHistory = initialPromptForJapaneseDesc; 
    
    if (!process.env.API_KEY) {
        setError("APIキーが設定されていません。Geminiを利用したプロンプト生成はできません。基本的なプロンプトのみ表示します。");
        setGeneratedPrompts(currentPrompts);
        
        const placeholderMessages = ["現在の選択タグに基づいた", "画像からタグを抽出しました"];
        const isCurrentDescAPlaceholderOrRawEnglish = !initialPromptForJapaneseDesc || 
            placeholderMessages.some(msg => initialPromptForJapaneseDesc.startsWith(msg)) ||
            (sourceWasPinginfo && /[a-zA-Z]/.test(initialPromptForJapaneseDesc) && !/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9faf]/.test(initialPromptForJapaneseDesc));

        if (finalSelectedTagsForOutput.length > 0 && isCurrentDescAPlaceholderOrRawEnglish) {
            descForHistory = "現在の選択タグに基づいた標準的な説明です。より詳細な説明はAPIキー設定後に「プロンプト生成」で取得できます。";
            setJapaneseDescription(descForHistory);
        } else if (finalSelectedTagsForOutput.length === 0 && !sourceWasPinginfo) { 
            setJapaneseDescription('');
        } else if (sourceWasPinginfo && initialPromptForJapaneseDesc.trim().length > 0) {
            setJapaneseDescription(initialPromptForJapaneseDesc);
            descForHistory = initialPromptForJapaneseDesc;
        }
        
        setIsLoading(false);
        setLoadingMessage('');
        addHistoryEntry({
            type: 'prompt_generation',
            promptText: currentPrompts.imagePrompt || basePromptForAI,
            selectedTagsSnapshot: [...finalSelectedTagsForOutput],
            japaneseDescriptionSnapshot: descForHistory,
            generatedPromptsSnapshot: { ...currentPrompts },
            modelName: 'N/A (API Key Missing)',
        });
        setIsDescriptionFromPingInfo(false); // Reset after the cycle
        return;
    }

    try {
      setLoadingMessage('Midjourneyプロンプトを生成中...');
      const mjPrompt = await generateMidjourneyPrompt(basePromptForAI, sourceWasPinginfo && isSensitiveFilterEnabled);
      currentPrompts.midjourney = mjPrompt;
      
      let newJapaneseDescription = descForHistory; 
      
      const placeholderMessagesForDescRegen = ["現在の選択タグに基づいた", "画像からタグを抽出しました"];
      const needsDescRegeneration = sourceWasPinginfo || 
                                    !newJapaneseDescription || 
                                    newJapaneseDescription.startsWith("プロンプト生成中にエラーが発生しましたが") ||
                                    placeholderMessagesForDescRegen.some(msg => newJapaneseDescription.startsWith(msg)) ||
                                    (!sourceWasPinginfo && selectedTags.length > 0 && japaneseDescription.length === 0); // If not pinginfo, tags exist, but JD is empty

      if (needsDescRegeneration) {
        setLoadingMessage('日本語説明文を生成中...');
        newJapaneseDescription = await generateJapaneseDescription(mjPrompt); 
        setJapaneseDescription(newJapaneseDescription);
      }
      descForHistory = newJapaneseDescription;


      setLoadingMessage('ImagePrompt (自然言語)を生成中...');
      const ipPrompt = await generateImagePromptNaturalLanguage(basePromptForAI, sourceWasPinginfo && isSensitiveFilterEnabled);
      currentPrompts.imagePrompt = ipPrompt;
      
      setGeneratedPrompts(currentPrompts);
      setCurrentOutputFormat('stableDiffusion');

      addHistoryEntry({
        type: 'prompt_generation',
        promptText: currentPrompts.imagePrompt || basePromptForAI,
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
      const isDescStillPlaceholderOrRawEnglish = 
          !errorDesc ||
          ["現在の選択タグに基づいた", "画像からタグを抽出しました"].some(msg => errorDesc.startsWith(msg)) ||
          (sourceWasPinginfo && !errorDesc.match(/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9faf]/)); 

      if (isDescStillPlaceholderOrRawEnglish) {
         errorDesc = "プロンプト生成中にエラーが発生しましたが、基本的な説明は以下の通りです。";
         setJapaneseDescription(errorDesc);
      } else {
         setJapaneseDescription(errorDesc); 
      }

       addHistoryEntry({ 
        type: 'prompt_generation',
        promptText: currentPrompts.imagePrompt || basePromptForAI,
        selectedTagsSnapshot: [...finalSelectedTagsForOutput],
        japaneseDescriptionSnapshot: errorDesc,
        generatedPromptsSnapshot: { ...currentPrompts },
        modelName: GEMINI_TEXT_MODEL_NAME + " (Error Occurred)",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      if (sourceWasPinginfo) setIsDescriptionFromPingInfo(false); // Reset after the full cycle including description generation
    }
  }, [selectedTags, japaneseDescription, addHistoryEntry, handleBulkAddTags, isDescriptionFromPingInfo, updateAndSortSelectedTags, isSensitiveFilterEnabled]);

  const handleGenerateImageWithGemini = useCallback(async (promptOverride?: string) => {
    if (!process.env.API_KEY) {
      setImageGenerationError("APIキーが未設定のため、画像生成はできません。");
      setShowImageGenerationModal(true);
      return;
    }
    let promptForImage = promptOverride || generatedPrompts?.imagePrompt;
    if (!promptForImage) {
      setImageGenerationError("画像生成に使用できるImagePrompt (自然言語) がありません。まず「プロンプトを生成」を実行するか、履歴から選択してください。");
      setShowImageGenerationModal(true);
      return;
    }

    if (isSensitiveFilterEnabled) {
        promptForImage = filterSensitiveWords(promptForImage, BANNED_WORDS);
    }

    setIsGeneratingImage(true);
    setImageGenerationError(null);
    setGeneratedImageUrl(null);
    setPromptUsedForImageGen(promptForImage);
    setShowImageGenerationModal(true);

    try {
      const imageBase64Bytes = await generateImageWithImagen(promptForImage);
      const dataUrl = `data:image/jpeg;base64,${imageBase64Bytes}`;
      setGeneratedImageUrl(dataUrl);

      addHistoryEntry({
        type: 'image_generation',
        promptText: promptForImage,
        generatedImageUrl: dataUrl,
        modelName: IMAGEN_MODEL_NAME,
      });

    } catch (err: any) {
      console.error("Gemini画像生成エラー:", err);
      if (err.message === "AI_REQUEST_BLOCKED") {
        setImageGenerationError("AIによる画像生成がブロックされました。プロンプトの内容がガイドラインに準拠しているか確認してください。");
      } else {
        setImageGenerationError(err.message || "Geminiでの画像生成中にエラーが発生しました。");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  }, [generatedPrompts, addHistoryEntry, isSensitiveFilterEnabled]);

  const handleGenerateImagesForAllPrompts = useCallback(async () => {
    if (!generatedPrompts) {
      setError("まず「プロンプトを生成」を実行して、各種プロンプトを作成してください。");
      return;
    }
    if (!process.env.API_KEY) {
      setError("APIキーが未設定のため、画像生成はできません。");
      return;
    }

    setIsGeneratingAllImages(true);
    setLoadingMessage("全プロンプトで画像を順次生成中...");
    setImageGenerationError(null);
    
    let promptsToGenerate: { format: OutputFormat; text: string | undefined }[] = [
        { format: 'stableDiffusion', text: generatedPrompts.stableDiffusion },
        { format: 'midjourney', text: generatedPrompts.midjourney },
        { format: 'imagePrompt', text: generatedPrompts.imagePrompt },
        // { format: 'yaml', text: generatedPrompts.yaml } // YAML is not for image generation
    ];

    if (isSensitiveFilterEnabled) {
        promptsToGenerate = promptsToGenerate.map(p => ({
            ...p,
            text: p.text ? filterSensitiveWords(p.text, BANNED_WORDS) : undefined,
        }));
    }


    let lastGeneratedImageUrl: string | null = null;
    let lastPromptUsed: string | null = null;

    for (const p of promptsToGenerate) {
        if (!p.text || p.format === 'yaml') { 
            console.warn(`Prompt for ${p.format} is empty or not imageable, skipping image generation.`);
            continue;
        }
        setLoadingMessage(`${formatLabels[p.format]} のプロンプトで画像を生成中...`);
        try {
            const imageBase64Bytes = await generateImageWithImagen(p.text);
            const dataUrl = `data:image/jpeg;base64,${imageBase64Bytes}`;
            lastGeneratedImageUrl = dataUrl;
            lastPromptUsed = p.text;
            addHistoryEntry({
                type: 'image_generation',
                promptText: p.text,
                generatedImageUrl: dataUrl,
                modelName: IMAGEN_MODEL_NAME,
            });
        } catch (err: any) {
            console.error(`Error generating image for ${p.format}:`, err);
             if (err.message === "AI_REQUEST_BLOCKED") {
                setError(`「${formatLabels[p.format]}」の画像生成がAIによりブロックされました。`);
             } else {
                setError(`「${formatLabels[p.format]}」の画像生成中にエラー: ${err.message}`);
             }
        }
    }
    
    if (lastGeneratedImageUrl && lastPromptUsed) {
        setGeneratedImageUrl(lastGeneratedImageUrl);
        setPromptUsedForImageGen(lastPromptUsed);
        setShowImageGenerationModal(true);
    } else if (!error && promptsToGenerate.filter(p => p.text && p.format !== 'yaml').length > 0) { 
        setError("画像生成可能なプロンプトがありませんでした、または全ての生成に失敗しました。");
    }


    setIsGeneratingAllImages(false);
    setLoadingMessage("");
  }, [generatedPrompts, addHistoryEntry, error, isSensitiveFilterEnabled]);
  
  useEffect(() => {
    if (!activeTagCategoryId && CATEGORIES.length > 0) {
        const firstCategory = CATEGORIES.find(cat => !cat.isInputCategory && cat.id !== DERIVED_PINGINFO_TAG_CATEGORY.id) || CATEGORIES[0];
        setActiveTagCategoryId(firstCategory.id);
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
    setExtractedNegativePromptText(null); 
    setIsDescriptionFromPingInfo(false); 
    if (item.type === 'prompt_generation') {
      if (item.selectedTagsSnapshot) {
        updateAndSortSelectedTags(item.selectedTagsSnapshot); 
      }
      setJapaneseDescription(item.japaneseDescriptionSnapshot || '');
      setGeneratedPrompts(item.generatedPromptsSnapshot || null);
      if (item.generatedPromptsSnapshot?.imagePrompt) {
        setPromptUsedForImageGen(item.generatedPromptsSnapshot.imagePrompt);
      } else {
        setPromptUsedForImageGen(null);
      }
      setGeneratedImageUrl(null); 
    } else if (item.type === 'image_generation') {
      setPromptUsedForImageGen(item.promptText);
      setGeneratedImageUrl(item.generatedImageUrl || null);
      setGeneratedPrompts(prev => ({
          stableDiffusion: prev?.stableDiffusion || '', 
          midjourney: prev?.midjourney || '', 
          imagePrompt: item.promptText, 
          yaml: prev?.yaml || '', 
      }));
      setShowImageGenerationModal(true); 
    }
    setShowHistoryPanel(false); 
  }, [updateAndSortSelectedTags]);


  // If not logged in, show secure login screen
  if (!isLoggedIn) {
    return <SecureLoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-3 sm:p-6 md:p-8">
      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageFileChange} style={{ display: 'none' }} disabled={isLoading || isGeneratingImage || isGeneratingAllImages} />
      <input type="file" accept="image/png,image/jpeg,image/webp" ref={metadataInputRef} onChange={handleMetadataFileChange} style={{ display: 'none' }} disabled={isLoading || isGeneratingImage || isGeneratingAllImages} />
      
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <header className="mb-6 md:mb-10">
          <div className="flex justify-between items-center">
            <div className="w-14 md:w-16">
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                title="ログアウト"
                aria-label="ログアウト"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-gray-400">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-100">タグ選択式プロンプトビルダー</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-2">
                タグを選択・生成してAI画像用のプロンプトを作成しましょう
                <span className="ml-2 text-xs text-blue-400">({currentUser}としてログイン中)</span>
              </p>
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
          <div className="bg-yellow-500/20 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-md shadow-md text-sm flex justify-between items-center" role="alert">
            <div>{apiKeyStatus}</div>
            <button 
              onClick={() => setShowApiKeyModal(true)} 
              className="ml-4 px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-xs font-medium"
            >
              APIキー設定
            </button>
          </div>
        )}
        
        {!apiKeyStatus.startsWith("警告:") && (
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowApiKeyModal(true)} 
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-300"
            >
              APIキー設定
            </button>
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
        {(isLoading || isGeneratingAllImages) && loadingMessage && (
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
          categories={CATEGORIES.filter(c => c.id !== DERIVED_PINGINFO_TAG_CATEGORY.id)} 
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          activeCategoryId={activeTagCategoryId}
          setActiveCategoryId={setActiveTagCategoryId}
          onBulkAddTags={handleBulkAddTags}
        />
        
        <PromptOutputArea
            selectedTagsCount={selectedTags.length}
            onGenerate={handleGenerateAllOutputs}
            japaneseDescription={japaneseDescription}
            generatedPrompts={generatedPrompts}
            currentFormat={currentOutputFormat}
            onSetFormat={setCurrentOutputFormat}
            onCopy={handleCopyToClipboard}
            isLoading={isLoading && (loadingMessage.includes('プロンプトを生成中') || loadingMessage.includes('ランダムにタグを生成中') || loadingMessage.includes('各種プロンプトを生成中') || loadingMessage.includes('AIが') || loadingMessage.includes('ペルソナタグを日本語に') || loadingMessage.includes('メタデータ') || loadingMessage.includes('キーワードを抽出中') || loadingMessage.includes('派生キーワードを日本語に') )}
            onGenerateImage={() => handleGenerateImageWithGemini()}
            isGeneratingImage={isGeneratingImage}
            canGenerateImage={!!generatedPrompts?.imagePrompt && !!process.env.API_KEY}
            onGenerateImagesForAllPrompts={handleGenerateImagesForAllPrompts}
            isGeneratingAllImages={isGeneratingAllImages}
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

        {showImageGenerationModal && (
          <ImageGenerationModal
            isOpen={showImageGenerationModal}
            onClose={() => {
              setShowImageGenerationModal(false);
            }}
            imageUrl={generatedImageUrl}
            isLoading={isGeneratingImage}
            error={imageGenerationError}
            promptUsed={promptUsedForImageGen}
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
            onRegenerateImage={(prompt) => handleGenerateImageWithGemini(prompt)}
          />
        )}
        
        {showApiKeyModal && (
          <ApiKeyModal
            isOpen={showApiKeyModal}
            onClose={() => setShowApiKeyModal(false)}
            onApiKeyChange={handleApiKeyChange}
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
