import React, { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'user_gemini_api_key';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedKey) setApiKey(savedKey);
    else setApiKey('');
  }, [isOpen]);

  const handleSave = () => {
    if (!apiKey) {
      alert('APIキーが入力されていません。');
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, apiKey);
    alert('APIキーを保存しました。');
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setApiKey('');
    alert('APIキーをクリアしました。');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">APIキー設定</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="閉じる">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-300 mb-4">お持ちのGemini APIキーを入力してください。</p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="ここにAPIキーを貼り付け"
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        />
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            クリア
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          ※ APIキーはローカルストレージにのみ保存され、外部には送信されません。
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;