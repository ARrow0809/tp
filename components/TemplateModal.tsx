
import React, { useEffect, useState } from 'react';
import { PersonaTheme } from '../types';

interface PersonaThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaThemes: PersonaTheme[];
  onCreatePersonaByTheme: (themeId: string, themeName: string) => void;
}

const animationStyleId = 'modal-animation-style';

const PersonaThemeModal: React.FC<PersonaThemeModalProps> = ({ isOpen, onClose, personaThemes, onCreatePersonaByTheme }) => {
  const [customTheme, setCustomTheme] = useState('');

  useEffect(() => {
    if (isOpen && !document.getElementById(animationStyleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = animationStyleId;
      styleElement.innerHTML = `
        @keyframes modalShowAnimation {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomThemeSubmit = () => {
    if (customTheme.trim()) {
      onCreatePersonaByTheme('custom_theme', customTheme.trim());
      setCustomTheme(''); // Clear input after submission
      // Closing is handled in App.tsx
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-theme-modal-title"
    >
      <div 
        className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar transform transition-all duration-300 ease-in-out scale-95 opacity-0"
        onClick={(e) => e.stopPropagation()}
        style={{animation: isOpen ? 'modalShowAnimation 0.3s ease forwards' : undefined}}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="persona-theme-modal-title" className="text-xl font-semibold text-gray-100">
            AIペルソナ作成
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-400 mb-3">作成したいペルソナのテーマを選択するか、カスタムテーマを入力してください。</p>
            <ul className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
              {personaThemes.map((theme) => (
                <li key={theme.id}>
                  <button
                    onClick={() => {
                      onCreatePersonaByTheme(theme.id, theme.name);
                    }}
                    className="w-full text-left px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium flex items-center group"
                    title={theme.description}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2.5 text-indigo-300 group-hover:text-indigo-200">
                      <path d="M10 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.092 11.026a2.748 2.748 0 000 3.901l1.83 1.83c.952.952 2.493.952 3.444 0l1.83-1.83a2.748 2.748 0 000-3.901A2.585 2.585 0 0012.5 10.5h-5a2.585 2.585 0 00-1.638.526zM17 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    </svg>
                    {theme.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <hr className="border-gray-700" />

          <div>
            <label htmlFor="customThemeInput" className="block text-sm font-medium text-gray-300 mb-2">
              カスタムテーマ入力:
            </label>
            <input
              type="text"
              id="customThemeInput"
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-teal-500 focus:border-teal-500 p-2.5 custom-scrollbar"
              placeholder="例: 未来の女戦士、サイバーパンクな探偵"
            />
            <button
              onClick={handleCustomThemeSubmit}
              disabled={!customTheme.trim()}
              className="mt-3 w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              カスタムテーマでペルソナ生成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaThemeModal;
