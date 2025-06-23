export interface Tag {
  id: string; // Unique ID, can include instance suffix for free tags
  name: string; // English name (value for prompt)
  japaneseName: string; // Japanese display name
  categoryId: string; 
  subCategoryId?: string; // Optional: To link to sub-category
  originalId?: string; // For free tags, to link back to the base tag definition
  allowMultipleSelections?: boolean; // Indicates if this tag (typically from a free category) can be selected multiple times
  isLocked?: boolean; // True if the tag is locked by the user
}

export interface SubCategory {
  id: string;
  name: string; // Japanese sub-category name
  tags: Omit<Tag, 'categoryId' | 'subCategoryId' | 'allowMultipleSelections' | 'isLocked'>[]; // Base definitions
}

export interface Category {
  id: string;
  name: string; // Japanese category name
  color: string; // Tailwind background color class
  textColor: string; // Tailwind text color class
  tags?: Omit<Tag, 'categoryId' | 'allowMultipleSelections' | 'isLocked'>[]; // Optional: For categories without sub-categories
  subCategories?: SubCategory[]; // Optional: For categories with sub-categories
  isInputCategory?: boolean; // Flag for special input handling
  allowMultipleSelections?: boolean; // If true, tags from this category can be selected multiple times
  isNsfwCategory?: boolean; // True if the category contains potentially NSFW content and requires age verification
}

export interface PersonaTheme {
  id: string;
  name: string;
  description?: string;
}

export type OutputFormat = 'stableDiffusion' | 'midjourney' | 'imagePrompt' | 'yaml';

export interface GeneratedPrompts {
  stableDiffusion: string;
  midjourney: string;
  imagePrompt?: string; 
  yaml: string;
}

export interface GeneratedImageItem {
  id: string; // Unique ID for the item, e.g., based on format or a timestamp
  format: OutputFormat | 'ImagePrompt'; // Format of the prompt used
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  promptText: string;
  modelName: string;
}

export interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageItems: GeneratedImageItem[] | null; // Can be single or multiple
  overallIsLoading: boolean; // Indicates if any image generation is in progress
  yamlToDownload: string | null;
}


export interface HistoryItem {
  id: string; 
  type: 'prompt_generation' | 'image_generation';
  promptText: string; 
  selectedTagsSnapshot?: Tag[]; 
  japaneseDescriptionSnapshot?: string; 
  generatedPromptsSnapshot?: GeneratedPrompts; 
  generatedImageUrl?: string | null; 
  timestamp: string; 
  modelName?: string; 
  format?: OutputFormat | 'ImagePrompt'; // To store the format of the prompt used for image generation
}

export interface SavedCharacter {
  name: string;
  lockedTags: string[]; // Array of tag IDs (Tag.id)
}