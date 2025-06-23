import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Tag, Category as CategoryType } from '../types';
import { SavedCharacter } from '../types';
import TagChip from './TagChip';

interface SelectedTagsAreaProps {
  selectedTags: Tag[];
  categories: CategoryType[];
  onRemoveTag: (tagId: string) => void;
  onReorderTags: (reorderedTags: Tag[]) => void;
  onShowPersonaModal: () => void;
  onShowImageTagger: () => void;
  onTriggerMetadataUpload: () => void; 
  onGenerateRandomPersonaTags: (mode: 'all' | 'background-only') => void;
  onClearAllTags: () => void; 
  maxTokens: number;
  onToggleLock: (tagId: string) => void;
  showLockedOnlyFilter: boolean; // New prop for filter state
  onToggleShowLockedOnlyFilter: () => void; // New prop for filter toggle
  onUnlockAllTags: () => void; // New prop for unlocking all
  onLoadCharacter: (lockedTagIds: string[]) => void; // New prop for loading character
}

const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const CHARACTER_STORAGE_KEY = 'savedCharactersV1';

const SelectedTagsArea: React.FC<SelectedTagsAreaProps> = ({
  selectedTags,
  categories,
  onRemoveTag,
  onReorderTags,
  onShowPersonaModal,
  onShowImageTagger,
  onTriggerMetadataUpload,
  onGenerateRandomPersonaTags,
  onClearAllTags,
  maxTokens,
  onToggleLock,
  showLockedOnlyFilter,
  onToggleShowLockedOnlyFilter,
  onUnlockAllTags,
  onLoadCharacter,
}) => {
  const [characterName, setCharacterName] = React.useState('');
  const [savedCharacters, setSavedCharacters] = React.useState<SavedCharacter[]>([]);
  const [showCharacterList, setShowCharacterList] = React.useState(false);
  const [renameIndex, setRenameIndex] = React.useState<number | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  // Load from localStorage on mount
  React.useEffect(() => {
    const raw = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (raw) {
      try {
        setSavedCharacters(JSON.parse(raw));
      } catch {
        setSavedCharacters([]);
      }
    }
  }, []);

  // Save to localStorage when savedCharacters changes
  React.useEffect(() => {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(savedCharacters));
  }, [savedCharacters]);

  // Save current locked tags as a character
  const handleSaveCharacter = () => {
    const lockedTags = selectedTags.filter(t => t.isLocked).map(t => t.id);
    if (!characterName.trim()) {
      alert('保存名を入力してください');
      return;
    }
    if (lockedTags.length === 0) {
      alert('ロック中のタグがありません');
      return;
    }
    if (savedCharacters.some(c => c.name === characterName.trim())) {
      alert('同じ名前のキャラクターが既に存在します');
      return;
    }
    setSavedCharacters([...savedCharacters, { name: characterName.trim(), lockedTags }]);
    setCharacterName('');
    setShowCharacterList(true);
  };

  // Load a character's locked tags
  const handleLoadCharacter = (lockedTagIds: string[]) => {
    onLoadCharacter(lockedTagIds);
    setShowCharacterList(false);
  };

  // Delete a character
  const handleDeleteCharacter = (idx: number) => {
    if (!window.confirm('本当に削除しますか？')) return;
    setSavedCharacters(savedCharacters.filter((_, i) => i !== idx));
  };

  // Start renaming
  const handleStartRename = (idx: number) => {
    setRenameIndex(idx);
    setRenameValue(savedCharacters[idx].name);
  };

  // Confirm rename
  const handleConfirmRename = (idx: number) => {
    if (!renameValue.trim()) return;
    setSavedCharacters(savedCharacters.map((c, i) => i === idx ? { ...c, name: renameValue.trim() } : c));
    setRenameIndex(null);
    setRenameValue('');
  };

  // Cancel rename
  const handleCancelRename = () => {
    setRenameIndex(null);
    setRenameValue('');
  };

  const tagsToDisplay = showLockedOnlyFilter 
    ? selectedTags.filter(tag => tag.isLocked) 
    : selectedTags;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || (result.destination.droppableId === result.source.droppableId && result.destination.index === result.source.index)) {
      return;
    }

    const currentDisplayList = showLockedOnlyFilter 
      ? selectedTags.filter(tag => tag.isLocked)
      : selectedTags;
    
    const reorderedSubList = reorder(
      currentDisplayList,
      result.source.index,
      result.destination.index
    );

    let finalReorderedFullList: Tag[];
    if (showLockedOnlyFilter) {
      // Reconstruct the full list: reordered locked tags + original unlocked tags
      const unlockedTags = selectedTags.filter(tag => !tag.isLocked);
      // Ensure all original tag objects are used, just reordered
      const reorderedLockedTagIds = reorderedSubList.map(t => t.id);
      const originalLockedTagsInNewOrder = reorderedLockedTagIds.map(id => selectedTags.find(st => st.id === id)!);
      
      finalReorderedFullList = [...originalLockedTagsInNewOrder, ...unlockedTags];
    } else {
      finalReorderedFullList = reorderedSubList;
    }
    onReorderTags(finalReorderedFullList);
  };


  const handleMoveTag = (tagId: string, direction: 'left' | 'right') => {
    const currentDisplayList = showLockedOnlyFilter 
        ? selectedTags.filter(tag => tag.isLocked)
        : selectedTags;

    const currentIndexInDisplay = currentDisplayList.findIndex(t => t.id === tagId);
    if (currentIndexInDisplay === -1) return;

    const newIndexInDisplay = direction === 'left' ? currentIndexInDisplay - 1 : currentIndexInDisplay + 1;

    if (newIndexInDisplay < 0 || newIndexInDisplay >= currentDisplayList.length) return;

    const reorderedSubList = reorder(currentDisplayList, currentIndexInDisplay, newIndexInDisplay);
    
    let finalReorderedFullList: Tag[];
    if (showLockedOnlyFilter) {
      const unlockedTags = selectedTags.filter(tag => !tag.isLocked);
      const reorderedLockedTagIds = reorderedSubList.map(t => t.id);
      const originalLockedTagsInNewOrder = reorderedLockedTagIds.map(id => selectedTags.find(st => st.id === id)!);
      finalReorderedFullList = [...originalLockedTagsInNewOrder, ...unlockedTags];
    } else {
      finalReorderedFullList = reorderedSubList;
    }
    onReorderTags(finalReorderedFullList);
  };

  const getCategoryForTag = (tag: Tag): CategoryType | undefined => {
    return categories.find(cat => cat.id === tag.categoryId);
  };
  
  const tokenCount = selectedTags.length; // Token count should be based on all selected tags, not just displayed
  const generalLoading = false; 
  const hasAnyLockedTags = selectedTags.some(t => t.isLocked);

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-xl shadow-lg">
      {/* キャラクター保存・読込UI */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <input
            type="text"
            className="px-2 py-1 rounded border border-gray-600 bg-gray-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="保存名を入力 (例: 夏制服のミユ)"
            value={characterName}
            onChange={e => setCharacterName(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <button
            onClick={handleSaveCharacter}
            className="px-3 py-1 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white rounded transition-colors"
          >
            キャラクター保存
          </button>
          <button
            onClick={() => setShowCharacterList(v => !v)}
            className="px-3 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            {showCharacterList ? '保存リストを隠す' : '保存リストを表示'}
          </button>
        </div>
        {showCharacterList && (
          <div className="bg-gray-700 rounded p-3 mt-1 max-w-full overflow-x-auto">
            {savedCharacters.length === 0 && (
              <div className="text-gray-400 text-xs">保存済みキャラクターはありません</div>
            )}
            {savedCharacters.length > 0 && (
              <ul className="space-y-1">
                {savedCharacters.map((c, idx) => (
                  <li key={c.name + idx} className="flex items-center gap-2 text-sm text-gray-100">
                    {renameIndex === idx ? (
                      <>
                        <input
                          type="text"
                          className="px-1 py-0.5 rounded border border-gray-500 bg-gray-800 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          style={{ minWidth: 100 }}
                        />
                        <button onClick={() => handleConfirmRename(idx)} className="px-2 py-0.5 text-xs bg-teal-600 hover:bg-teal-500 rounded text-white">OK</button>
                        <button onClick={handleCancelRename} className="px-2 py-0.5 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white">キャンセル</button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold truncate max-w-[8rem]" title={c.name}>{c.name}</span>
                        <span className="text-xs text-gray-400">({c.lockedTags.length}タグ)</span>
                        <button onClick={() => handleLoadCharacter(c.lockedTags)} className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white">読込</button>
                        <button onClick={() => handleStartRename(idx)} className="px-2 py-0.5 text-xs bg-yellow-600 hover:bg-yellow-500 rounded text-white">リネーム</button>
                        <button onClick={() => handleDeleteCharacter(idx)} className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-500 rounded text-white">削除</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {/* ここまでキャラクター保存・読込UI */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-y-2">
        <h2 id="selected-tags-heading" className="text-xl font-semibold text-gray-100">
          選択済みタグ
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Buttons: Random, Persona, Image, Metadata, Clear */}
          <button
            onClick={() => onGenerateRandomPersonaTags('all')}
            className="px-3 py-1.5 text-xs font-medium bg-purple-700 hover:bg-purple-600 text-gray-100 rounded-md transition-colors flex items-center"
            title="各カテゴリ・サブカテゴリから1つずつランダムにタグを選択します"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.223 3.802 5.5 5.5 0 019.223-3.802zM4.688 8.576a5.5 5.5 0 019.223-3.802 5.5 5.5 0 01-9.223 3.802z" clipRule="evenodd" />
              <path d="M6.75 7.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM10 12.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75z" />
            </svg>
            全体ランダム
          </button>
          <button
            onClick={() => onGenerateRandomPersonaTags('background-only')}
            className="px-3 py-1.5 text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-gray-100 rounded-md transition-colors flex items-center"
            title="背景（場所・天気・時間・ライティング・アングル・カメラ）のみランダムに選択し、AIで臨場感を向上させます"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.223 3.802 5.5 5.5 0 019.223-3.802zM4.688 8.576a5.5 5.5 0 019.223-3.802 5.5 5.5 0 01-9.223 3.802z" clipRule="evenodd" />
              <path d="M6.75 7.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM10 12.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75z" />
            </svg>
            背景のみ
          </button>
          <button
            onClick={onShowPersonaModal}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-700 hover:bg-indigo-600 text-gray-100 rounded-md transition-colors flex items-center"
            title="AIでペルソナを生成します"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path d="M10 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.092 11.026a2.748 2.748 0 000 3.901l1.83 1.83c.952.952 2.493.952 3.444 0l1.83-1.83a2.748 2.748 0 000-3.901A2.585 2.585 0 0012.5 10.5h-5a2.585 2.585 0 00-1.638.526zM17 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            </svg>
            ペルソナ作成
          </button>
          <button
            onClick={onShowImageTagger}
            className="px-3 py-1.5 text-xs font-medium bg-sky-700 hover:bg-sky-600 text-gray-100 rounded-md transition-colors flex items-center"
            title="画像からタグを抽出します (Gemini Vision)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-3.69l-2.76-2.76a.75.75 0 00-1.06 0l-1.94 1.94-1.44-1.44a.75.75 0 00-1.06 0L8 12.56l-1.22-1.22a.75.75 0 00-1.06 0L2.5 11.06zM5 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            画像読取り
          </button>
          <button
            onClick={onTriggerMetadataUpload}
            className="px-3 py-1.5 text-xs font-medium bg-teal-700 hover:bg-teal-600 text-gray-100 rounded-md transition-colors flex items-center"
            title="画像ファイルからメタデータ(プロンプト等)を読み取ります"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 8.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm-2.25.75a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75zm1.5-2.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" />
            </svg>
            メタデータ読取り
          </button>
          {selectedTags.length > 0 && (
             <button
                onClick={onClearAllTags}
                disabled={generalLoading} 
                className="px-3 py-1.5 text-xs font-medium bg-red-700 hover:bg-red-600 text-gray-100 rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                title="選択された全てのタグと生成結果をクリアします"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 01-1.255 8.914A4.25 4.25 0 0110.995 17h-1.99a4.25 4.25 0 01-4.25-3.381A48.817 48.817 0 013.5 4.705v-.227c0-1.13.91-2.042 2.031-2.042h8.938c1.121 0 2.031.912 2.031 2.042zM18 4.478v.227a51.305 51.305 0 01-1.306 9.174A5.75 5.75 0 0111.005 18.5h-1.99a5.75 5.75 0 01-5.699-4.62A51.305 51.305 0 012 4.705v-.227c0-1.933 1.567-3.5 3.5-3.5H14.5c1.933 0 3.5 1.567 3.5 3.5zm-7.086-1.428A.75.75 0 0010.25 2.5h-.5a.75.75 0 00-.664.449L8.336 4.5H5.5a.75.75 0 000 1.5h9a.75.75 0 000-1.5H11.664l-.75-1.551zM9.25 7.5a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0v-5a.75.75 0 01.75-.75zm2.25.75a.75.75 0 00-1.5 0v5a.75.75 0 001.5 0v-5z" clipRule="evenodd" />
                </svg>
                すべてクリア
              </button>
          )}
        </div>
      </div>
       {/* Filter and Unlock All controls */}
       {selectedTags.length > 0 && (
        <div className="flex flex-wrap justify-start items-center gap-x-4 gap-y-2 mb-3 mt-1 p-2 border-b border-t border-gray-700">
          <label htmlFor="showLockedOnlyCheckbox" className="flex items-center text-xs text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              id="showLockedOnlyCheckbox"
              checked={showLockedOnlyFilter}
              onChange={onToggleShowLockedOnlyFilter}
              className="h-4 w-4 rounded border-gray-500 text-teal-500 focus:ring-teal-400 bg-gray-700 mr-1.5"
            />
            ロックされたタグのみ表示
          </label>
          <button
            onClick={onUnlockAllTags}
            disabled={!hasAnyLockedTags || generalLoading}
            className="px-2.5 py-1 text-xs font-medium bg-yellow-600 hover:bg-yellow-500 text-white rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="全てのタグのロックを解除します"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 mr-1">
              <path fillRule="evenodd" d="M8 1a3.5 3.5 0 00-3.5 3.5V7H4a1 1 0 00-1 1v4.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V8a1 1 0 00-1-1h-.5V4.5A3.5 3.5 0 008 1Zm2 6V4.5a2 2 0 10-4 0V7h4Z" clipRule="evenodd" />
            </svg>
            全てのロックを解除
          </button>
        </div>
      )}

      {tagsToDisplay.length === 0 && selectedTags.length > 0 && showLockedOnlyFilter && (
         <div className="h-24 flex items-center justify-center text-gray-500 italic p-4 border-2 border-dashed border-gray-700 rounded-lg">
          ロックされたタグはありません。フィルターを解除して全てのタグを表示します。
        </div>
      )}
      {tagsToDisplay.length === 0 && !showLockedOnlyFilter && (
         <div className="h-24 flex items-center justify-center text-gray-500 italic p-4 border-2 border-dashed border-gray-700 rounded-lg">
          下の「タグを選択」エリアからタグを選んでください。または各種生成・読取りボタンでタグを追加します。
        </div>
      )}

      {tagsToDisplay.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="selectedTagsDroppable" direction="horizontal">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex flex-wrap gap-2 p-3 min-h-[4.5rem] rounded-lg border ${snapshot.isDraggingOver ? 'border-teal-500 bg-gray-700/50' : 'border-gray-700'} transition-colors custom-scrollbar overflow-x-auto`}
                style={{ WebkitOverflowScrolling: 'touch' }}
                aria-labelledby="selected-tags-heading"
              >
                {tagsToDisplay.map((tag, index) => {
                  const category = getCategoryForTag(tag);
                  const originalIndexInFullList = selectedTags.findIndex(st => st.id === tag.id);
                  return (
                    <Draggable key={tag.id} draggableId={tag.id} index={index}>
                      {(providedDraggable, snapshotDraggable) => (
                        <TagChip
                          tag={tag}
                          categoryColor={category?.color || 'bg-gray-500'}
                          categoryTextColor={category?.textColor || 'text-white'}
                          onRemove={onRemoveTag}
                          isDraggable={true}
                          provided={providedDraggable}
                          isDragging={snapshotDraggable.isDragging}
                          onMoveLeft={(tagId) => handleMoveTag(tagId, 'left')}
                          onMoveRight={(tagId) => handleMoveTag(tagId, 'right')}
                          indexInSelectedList={index} // Index in the currently displayed list
                          totalSelectedTagsCount={tagsToDisplay.length} // Count of currently displayed tags
                          onToggleLock={onToggleLock} 
                        />
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
       {tokenCount > maxTokens && (
        <p className="mt-2 text-xs text-red-400 text-center">トークン数が上限を超えています。({maxTokens}まで)</p>
      )}
    </div>
  );
};

export default SelectedTagsArea;
