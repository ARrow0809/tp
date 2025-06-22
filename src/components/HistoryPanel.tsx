
import React from 'react';
import { HistoryItem, OutputFormat } from '../types'; // Import OutputFormat

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onReuseItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAllHistory: () => void;
  onRegenerateImage: (prompt: string, format?: OutputFormat | 'ImagePrompt') => void; // Updated signature
}

const formatDate = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleString('ja-JP', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) {
    return isoString; // fallback
  }
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  historyItems,
  onReuseItem,
  onDeleteItem,
  onClearAllHistory,
  onRegenerateImage
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center p-4 z-[70] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-panel-title"
    >
      <div
        className="bg-gray-800 p-5 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-100" // animation handled by isOpen
        onClick={(e) => e.stopPropagation()}
        style={{ animation: isOpen ? 'modalShowAnimation 0.3s forwards' : undefined }} // Assuming modalShowAnimation is defined globally or reused
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
          <h2 id="history-panel-title" className="text-xl font-semibold text-gray-100">
            生成履歴
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {historyItems.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-gray-500 italic">
            履歴はありません。
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {historyItems.map((item) => (
              <div key={item.id} className="bg-gray-700/70 p-3 rounded-lg shadow hover:bg-gray-700 transition-colors duration-150">
                <div className="flex items-start space-x-3">
                  {item.type === 'image_generation' && item.generatedImageUrl && (
                    <img
                      src={item.generatedImageUrl}
                      alt="生成画像サムネイル"
                      className="w-16 h-16 object-cover rounded border border-gray-600 flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  {item.type === 'prompt_generation' && (
                     <div className="w-16 h-16 flex-shrink-0 bg-gray-600 rounded flex items-center justify-center text-gray-400 text-2xl" title="プロンプト生成">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a15.995 15.995 0 00-4.764 4.648l-3.876 5.814a1.151 1.151 0 001.597 1.597l5.814-3.875a15.996 15.996 0 004.649-4.763m-3.42-3.42a15.995 15.995 0 00-4.764-4.648" />
                        </svg>
                     </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{formatDate(item.timestamp)} {item.modelName && `(${item.modelName})`}</p>
                    <p className="text-sm text-gray-200 truncate" title={item.promptText}>
                      {item.type === 'image_generation' && item.format && item.format !== 'imagePrompt' ? `(${item.format}) ` : ''}{item.promptText}
                    </p>
                     {item.type === 'prompt_generation' && item.selectedTagsSnapshot && item.selectedTagsSnapshot.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {item.selectedTagsSnapshot.length} タグ: {item.selectedTagsSnapshot.slice(0,3).map(t => t.japaneseName || t.name).join(', ')}{item.selectedTagsSnapshot.length > 3 ? '...' : ''}
                        </p>
                    )}
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-gray-600/50 flex items-center justify-end space-x-2">
                   {item.type === 'image_generation' && (
                     <button
                        onClick={() => item.promptText && onRegenerateImage(item.promptText, item.format || 'imagePrompt')}
                        className="px-2.5 py-1 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors"
                        disabled={!item.promptText}
                        title="このプロンプトで画像を再生成"
                      >
                        画像再生成
                      </button>
                   )}
                  <button
                    onClick={() => onReuseItem(item)}
                    className="px-2.5 py-1 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors"
                    title={item.type === 'image_generation' ? "このプロンプトと画像結果を再利用" : "このタグ構成を再利用"}
                  >
                    再利用
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="px-2.5 py-1 text-xs font-medium bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors"
                    title="この履歴を削除"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {historyItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={onClearAllHistory}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-md transition-colors"
            >
              すべての履歴をクリア
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
