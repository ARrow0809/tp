
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Category as CategoryType, Tag, SubCategory } from '../types';
import TagChip from './TagChip';

interface TagSelectorProps {
  categories: CategoryType[];
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string | null) => void;
  // onAddCustomTag: (name: string, categoryId: string) => void; // Removed
  onBulkAddTags: (names: string[], categoryId: string) => void;
  initialSubCategoryId?: string | null; // 初期表示するサブカテゴリID
}

const TagSelector: React.FC<TagSelectorProps> = ({
  categories,
  selectedTags,
  onTagSelect,
  activeCategoryId,
  setActiveCategoryId,
  // onAddCustomTag, // Removed
  onBulkAddTags,
  initialSubCategoryId = null,
}) => {
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(initialSubCategoryId);
  // const [customTagInput, setCustomTagInput] = useState<string>(''); // Removed
  const [bulkTagsInput, setBulkTagsInput] = useState<string>('');

  const currentCategory = categories.find(cat => cat.id === activeCategoryId);

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setActiveSubCategoryId(null); // Reset subcategory when main category changes
    const category = categories.find(cat => cat.id === categoryId);
    if (category?.subCategories && category.subCategories.length > 0) {
      setActiveSubCategoryId(category.subCategories[0].id); // Auto-select first subcategory
    }
  };
  
  // const handleCustomTagSubmit = (e: FormEvent) => { // Removed
  //   e.preventDefault();
  //   if (customTagInput.trim() && currentCategory?.isInputCategory) {
  //     onAddCustomTag(customTagInput.trim(), currentCategory.id);
  //     setCustomTagInput('');
  //   }
  // };

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
  
  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-xl shadow-lg">
      <h2 id="tag-selector-heading" className="text-xl font-semibold text-gray-100 mb-4">
        タグを選択
      </h2>
      {/* Category Tabs */}
      <div className="flex border-b border-gray-700 mb-4 overflow-x-auto custom-scrollbar pb-px">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap focus:outline-none transition-all duration-150 ease-in-out
              ${activeCategoryId === category.id
                ? `border-b-2 ${category.color.replace('bg-','border-')} text-gray-100`
                : 'border-b-2 border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            role="tab"
            aria-selected={activeCategoryId === category.id}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* SubCategory Tabs (if any) */}
      {currentCategory?.subCategories && currentCategory.subCategories.length > 0 && !currentCategory.isInputCategory && (
        <div className="flex border-b border-gray-700/50 mb-4 overflow-x-auto custom-scrollbar pb-px">
          {currentCategory.subCategories.map((subCat) => (
            <button
              key={subCat.id}
              onClick={() => setActiveSubCategoryId(subCat.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap focus:outline-none transition-all duration-150 ease-in-out
                ${activeSubCategoryId === subCat.id
                  ? `border-b-2 ${currentCategory.color.replace('bg-','border-').replace('-600', '-400')} text-gray-200` // Lighter shade for subcat
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

      {/* Tags Area / Input Area */}
      {currentCategory && (
        <div role="tabpanel">
          {currentCategory.isInputCategory ? (
            <div className="space-y-6 p-2">
              {/* <form onSubmit={handleCustomTagSubmit} className="space-y-2"> // Removed
                <label htmlFor="customTag" className="block text-sm font-medium text-gray-300">カスタムタグ入力:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="customTag"
                    value={customTagInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomTagInput(e.target.value)}
                    className="flex-grow bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-teal-500 focus:border-teal-500 p-2.5 custom-scrollbar"
                    placeholder="例: red dress"
                  />
                  <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-md transition-colors">追加</button>
                </div>
              </form> */}
              <form onSubmit={handleBulkTagsSubmit} className="space-y-2">
                 <label htmlFor="bulkTags" className="block text-sm font-medium text-gray-300">一括テキスト読み込み (カンマ区切り):</label>
                <textarea
                  id="bulkTags"
                  value={bulkTagsInput}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBulkTagsInput(e.target.value)}
                  className="w-full h-24 bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-teal-500 focus:border-teal-500 p-2.5 custom-scrollbar"
                  placeholder="例: tag1, another tag, 赤いドレス, cyberpunk cityscape"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-md transition-colors">一括追加</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (bulkTagsInput.trim()) {
                        onBulkAddTags([`enhance:${bulkTagsInput.trim()}`], 'input');
                        setBulkTagsInput('');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-md transition-colors"
                    title="AIがテキストを分析し、詳細を自動的に補完してカンマ区切りのタグに変換します"
                  >
                    プロンプト強化
                  </button>
                </div>
              </form>
            </div>
          ) : (
            tagsToShow.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {tagsToShow.map((tag) => {
                  const isSelected = selectedTags.some(st => st.id === tag.id);
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
              (currentCategory.subCategories && currentCategory.subCategories.length > 0 && !currentSubCategory) || // Subcategories exist but none selected
              (!currentCategory.subCategories && !currentCategory.tags) ? // No subcategories and no direct tags
              <p className="text-gray-500 py-8 text-center">
                {(currentCategory.subCategories && currentCategory.subCategories.length > 0) ? "サブカテゴリを選択してください。" : "このカテゴリには定義済みのタグがありません。"}
              </p> 
              : null // Handles case where category might be loading or truly empty
            )
          )}
        </div>
      )}

      {!activeCategoryId && categories.length > 0 && (
        <p className="text-gray-500 py-8 text-center">カテゴリを選択して利用可能なタグを表示します。</p>
      )}
       {!categories.length && (
        <p className="text-gray-500 py-8 text-center">利用可能なカテゴリがありません。</p>
      )}
    </div>
  );
};

export default TagSelector;
