
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Category as CategoryType, Tag, SubCategory } from '../types';
import TagChip from './TagChip';
import { CATEGORIES, DERIVED_PINGINFO_TAG_CATEGORY, VISION_DERIVED_TAG_CATEGORY } from '../constants';

interface TagSelectorProps {
  categories: CategoryType[];
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string | null) => void;
  onBulkAddTags: (names: string[], categoryId: string) => void;
  onUnlockNsfw: () => void; // New prop
  isNsfwUnlocked: boolean; // New prop
}

const TagSelector: React.FC<TagSelectorProps> = ({
  categories,
  selectedTags,
  onTagSelect,
  activeCategoryId,
  setActiveCategoryId,
  onBulkAddTags,
  onUnlockNsfw,
  isNsfwUnlocked,
}) => {
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);
  const [bulkTagsInput, setBulkTagsInput] = useState<string>('');

  const currentCategory = categories.find(cat => cat.id === activeCategoryId);

  const handleCategorySelect = (categoryId: string) => {
    const categoryToSelect = CATEGORIES.find(cat => cat.id === categoryId); // Use original CATEGORIES to check for NSFW
    if (categoryToSelect?.isNsfwCategory && !isNsfwUnlocked) {
      onUnlockNsfw();
      return; 
    }
    setActiveCategoryId(categoryId);
    setActiveSubCategoryId(null); 
    const category = categories.find(cat => cat.id === categoryId); // Use filtered categories for display
    if (category?.subCategories && category.subCategories.length > 0) {
      setActiveSubCategoryId(category.subCategories[0].id); 
    }
  };
  
  const handleBulkTagsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (bulkTagsInput.trim() && currentCategory?.isInputCategory) {
      const tagNames = bulkTagsInput.split(',').map(name => name.trim()).filter(name => name.length > 0);
      if (tagNames.length > 0) {
        onBulkAddTags(tagNames, currentCategory.id);
      }
      setBulkTagsInput('');
    }
  };

  let tagsToShow: Tag[] = [];
  let currentSubCategory: SubCategory | undefined | null = null;

  if (currentCategory) {
    if (currentCategory.subCategories && currentCategory.subCategories.length > 0) {
      currentSubCategory = currentCategory.subCategories.find(sc => sc.id === activeSubCategoryId);
      if (currentSubCategory) {
        tagsToShow = currentSubCategory.tags.map(tag => ({
          ...tag,
          id: `${currentCategory.id}-${currentSubCategory!.id}-${tag.id}`,
          categoryId: currentCategory.id,
          subCategoryId: currentSubCategory.id,
        }));
      }
    } else if (currentCategory.tags) {
      tagsToShow = currentCategory.tags.map(tag => ({
        ...tag,
        id: `${currentCategory.id}-${tag.id}`,
        categoryId: currentCategory.id
      }));
    }
  }
  
  // Find all actual categories for tab display, including NSFW ones for the unlock button
  const allDisplayableCategories = CATEGORIES.filter(c => 
    c.id !== DERIVED_PINGINFO_TAG_CATEGORY.id && 
    c.id !== VISION_DERIVED_TAG_CATEGORY.id
  );

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-xl shadow-lg">
      <h2 id="tag-selector-heading" className="text-xl font-semibold text-gray-100 mb-4">
        タグを選択
      </h2>
      <div className="flex border-b border-gray-700 mb-4 overflow-x-auto custom-scrollbar pb-px">
        {allDisplayableCategories.map((category) => {
          const isDisabledNsfw = category.isNsfwCategory && !isNsfwUnlocked;
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              disabled={isDisabledNsfw && category.id !== activeCategoryId} // Allow clicking active NSFW to try unlock
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap focus:outline-none transition-all duration-150 ease-in-out
                ${activeCategoryId === category.id && (!isDisabledNsfw || category.id === activeCategoryId)
                  ? `border-b-2 ${category.color.replace('bg-','border-')} text-gray-100`
                  : `border-b-2 border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500`
                }
                ${isDisabledNsfw ? 'opacity-50 cursor-not-allowed hover:border-red-500/50 relative' : ''}
              `}
              role="tab"
              aria-selected={activeCategoryId === category.id && !isDisabledNsfw}
              title={isDisabledNsfw ? "クリックしてロック解除 (年齢確認)" : category.name}
            >
              {category.name}
              {isDisabledNsfw && <span className="text-xs absolute -top-1 -right-0.5 transform scale-75">🔞</span>}
            </button>
          );
        })}
      </div>

      {currentCategory?.subCategories && currentCategory.subCategories.length > 0 && !currentCategory.isInputCategory && (
        <div className="flex border-b border-gray-700/50 mb-4 overflow-x-auto custom-scrollbar pb-px">
          {currentCategory.subCategories.map((subCat) => (
            <button
              key={subCat.id}
              onClick={() => setActiveSubCategoryId(subCat.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap focus:outline-none transition-all duration-150 ease-in-out
                ${activeSubCategoryId === subCat.id
                  ? `border-b-2 ${currentCategory.color.replace('bg-','border-').replace('-600', '-400').replace('-700', '-500')} text-gray-200` 
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                }`}
              role="tab"
              aria-selected={activeSubCategoryId === subCat.id}
            >
              {subCat.name}
            </button>
          ))}
        </div>
      )}

      {currentCategory && (
        <div role="tabpanel">
          {currentCategory.isInputCategory ? (
            <div className="space-y-6 p-2">
              <form onSubmit={handleBulkTagsSubmit} className="space-y-2">
                 <label htmlFor="bulkTags" className="block text-sm font-medium text-gray-300">一括テキスト読み込み (カンマ区切り):</label>
                <textarea
                  id="bulkTags"
                  value={bulkTagsInput}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBulkTagsInput(e.target.value)}
                  className="w-full h-24 bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-teal-500 focus:border-teal-500 p-2.5 custom-scrollbar"
                  placeholder="例: tag1, another tag, 赤いドレス, cyberpunk cityscape"
                />
                <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-md transition-colors">一括追加</button>
              </form>
            </div>
          ) : (
            tagsToShow.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {tagsToShow.map((tag) => {
                  const isSelected = selectedTags.some(st => st.id === tag.id || (st.originalId && st.originalId === tag.id));
                  return (
                    <TagChip
                      key={tag.id}
                      tag={tag}
                      categoryColor={currentCategory.color}
                      categoryTextColor={currentCategory.textColor}
                      onClick={() => onTagSelect(tag)}
                      isSelectedInSelector={isSelected}
                    />
                  );
                })}
              </div>
            ) : (
              (currentCategory.subCategories && currentCategory.subCategories.length > 0 && !currentSubCategory) || 
              (!currentCategory.subCategories && !currentCategory.tags) ? 
              <p className="text-gray-500 py-8 text-center">
                {(currentCategory.subCategories && currentCategory.subCategories.length > 0) ? "サブカテゴリを選択してください。" : "このカテゴリには定義済みのタグがありません。"}
              </p> 
              : null 
            )
          )}
        </div>
      )}

      {!activeCategoryId && categories.length > 0 && (
        <p className="text-gray-500 py-8 text-center">カテゴリを選択して利用可能なタグを表示します。</p>
      )}
       {!categories.length && (!CATEGORIES.find(c => c.isNsfwCategory) || isNsfwUnlocked) && ( // Check if any categories would be shown
        <p className="text-gray-500 py-8 text-center">利用可能なカテゴリがありません。</p>
      )}
      {CATEGORIES.some(c => c.isNsfwCategory && !isNsfwUnlocked) && !categories.some(c => !c.isNsfwCategory) && !activeCategoryId && (
         <p className="text-gray-500 py-8 text-center">
           すべての通常カテゴリがフィルターされています。🔞カテゴリをアンロックするか、フィルター設定を確認してください。
         </p>
      )}
    </div>
  );
};

export default TagSelector;
