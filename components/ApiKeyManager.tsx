import React, { useState, useEffect } from 'react';
import { encrypt, decrypt } from './utils/encryption';

// API provider types
export type ApiProvider = 'gemini' | 'openai' | 'other';

interface ApiKeyManagerProps {
  onApiKeyChange: (apiKey: string | null) => void;
  onClose: () => void;
}

const LOCAL_STORAGE_API_KEYS = 'secure_api_keys';
const LOCAL_STORAGE_SELECTED_API = 'selected_api_type';

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onApiKeyChange, onClose }) => {
  const [apiKeys, setApiKeys] = useState<Record<ApiProvider, string>>({
    gemini: '',
    openai: '',
    other: ''
  });
  const [selectedApiType, setSelectedApiType] = useState<ApiProvider>('gemini');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Load saved API keys and selected type from localStorage
  useEffect(() => {
    try {
      const savedApiKeysEncrypted = localStorage.getItem(LOCAL_STORAGE_API_KEYS);
      const savedSelectedApiType = localStorage.getItem(LOCAL_STORAGE_SELECTED_API) as ApiProvider;
      
      if (savedApiKeysEncrypted) {
        const decryptedKeys = JSON.parse(decrypt(savedApiKeysEncrypted));
        setApiKeys(decryptedKeys);
      }
      
      if (savedSelectedApiType && ['gemini', 'openai', 'other'].includes(savedSelectedApiType)) {
        setSelectedApiType(savedSelectedApiType);
      }
    } catch (error) {
      console.error('Error loading API keys from localStorage:', error);
    }
  }, []);

  // Handle API key change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKeys = { ...apiKeys };
    newApiKeys[selectedApiType] = e.target.value;
    setApiKeys(newApiKeys);
  };

  // Handle API type selection
  const handleApiTypeChange = (type: ApiProvider) => {
    setSelectedApiType(type);
  };

  // Save API keys to localStorage
  const handleSaveApiKey = () => {
    try {
      // Encrypt API keys before saving to localStorage
      const encryptedKeys = encrypt(JSON.stringify(apiKeys));
      localStorage.setItem(LOCAL_STORAGE_API_KEYS, encryptedKeys);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_API, selectedApiType);
      
      // Apply the selected API key
      const currentApiKey = apiKeys[selectedApiType];
      if (currentApiKey) {
        onApiKeyChange(currentApiKey);
        
        // ページをリロードして新しいAPIキーを適用
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving API keys to localStorage:', error);
    }
  };

  // Clear API keys from localStorage
  const handleClearApiKeys = () => {
    if (window.confirm('APIキーをクリアしますか？この操作は元に戻せません。')) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_API_KEYS);
        setApiKeys({
          gemini: '',
          openai: '',
          other: ''
        });
        
        // ページをリロードしてAPIキーのクリアを反映
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
        onApiKeyChange(null);
        
        setClearSuccess(true);
        setTimeout(() => setClearSuccess(false), 3000);
      } catch (error) {
        console.error('Error clearing API keys from localStorage:', error);
      }
    }
  };

  return (
    <div className="api-key-manager bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">APIキー設定</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">APIプロバイダーを選択:</div>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={selectedApiType === 'gemini'}
              onChange={() => handleApiTypeChange('gemini')}
              className="mr-2"
            />
            <span className="text-white">Gemini</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={selectedApiType === 'openai'}
              onChange={() => handleApiTypeChange('openai')}
              className="mr-2"
            />
            <span className="text-white">OpenAI</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={selectedApiType === 'other'}
              onChange={() => handleApiTypeChange('other')}
              className="mr-2"
            />
            <span className="text-white">その他</span>
          </label>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-2">
          {selectedApiType === 'gemini' ? 'Gemini API キー:' : 
           selectedApiType === 'openai' ? 'OpenAI API キー:' : 'その他の API キー:'}
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKeys[selectedApiType]}
            onChange={handleApiKeyChange}
            placeholder="APIキーを入力してください"
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showApiKey ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">※ APIキーはローカルでのみ暗号化して保存され、外部には送信されません。</p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleClearApiKeys}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          クリア
        </button>
        <button
          onClick={handleSaveApiKey}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          disabled={!apiKeys[selectedApiType]}
        >
          保存して適用
        </button>
      </div>

      {saveSuccess && (
        <div className="mt-4 p-2 bg-green-600/20 border border-green-700 text-green-300 rounded text-sm">
          APIキーを保存し、適用しました。
        </div>
      )}

      {clearSuccess && (
        <div className="mt-4 p-2 bg-blue-600/20 border border-blue-700 text-blue-300 rounded text-sm">
          APIキーをクリアしました。
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;