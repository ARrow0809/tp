
import React from 'react';
import { OutputFormat, GeneratedPrompts } from '../types';
import { IMAGEN_MODEL_NAME } from '../constants'; 

interface PromptOutputAreaProps {
  selectedTagsCount: number;
  onGenerate: () => void;
  japaneseDescription: string;
  generatedPrompts: GeneratedPrompts | null;
  currentFormat: OutputFormat;
  onSetFormat: (format: OutputFormat) => void;
  onCopy: (text: string) => void;
  isLoading: boolean; // For main prompt generation
  onGenerateImage: () => void; // Callback to trigger single image generation
  isGeneratingImage: boolean; // True if single image generation is in progress
  canGenerateImage: boolean; // True if conditions are met to enable single image generation
  onGenerateImagesForAllPrompts: () => void; // New: Callback for all prompts
  isGeneratingAllImages: boolean; // New: True if all prompts image generation is in progress
  isSensitiveFilterEnabled: boolean; // New prop for filter state
  onToggleSensitiveFilter: () => void; // New prop for filter toggle
}

const formatLabels: Record<OutputFormat, string> = {
  stableDiffusion: 'Stable Diffusion',
  midjourney: 'Midjourney',
  imagePrompt: 'ImagePrompt (自然言語)',
  yaml: 'YAML Code',
};

const PromptOutputArea: React.FC<PromptOutputAreaProps> = ({
  selectedTagsCount,
  onGenerate,
  japaneseDescription,
  generatedPrompts,
  currentFormat,
  onSetFormat,
  onCopy,
  isLoading,
  onGenerateImage,
  isGeneratingImage,
  canGenerateImage,
  onGenerateImagesForAllPrompts,
  isGeneratingAllImages,
  isSensitiveFilterEnabled,
  onToggleSensitiveFilter,
}) => {
  const currentPromptText = generatedPrompts ? generatedPrompts[currentFormat] : '';
  const generalLoading = isLoading || isGeneratingImage || isGeneratingAllImages;

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-xl shadow-lg space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">プロンプト出力</h2>
      </div>

      <div className="flex items-center justify-start space-x-3 my-3">
        <label htmlFor="sensitiveFilterCheckbox" className="flex items-center text-xs text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            id="sensitiveFilterCheckbox"
            checked={isSensitiveFilterEnabled}
            onChange={onToggleSensitiveFilter}
            className="h-4 w-4 rounded border-gray-500 text-teal-500 focus:ring-teal-400 bg-gray-700 mr-1.5"
            disabled={generalLoading}
          />
          センシティブワードフィルターを有効にする
        </label>
      </div>
      
      <button
        onClick={onGenerate}
        disabled={generalLoading || selectedTagsCount === 0}
        className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 text-base flex items-center justify-center shadow-md"
      >
        {isLoading && !isGeneratingAllImages ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            生成中...
          </>
        ) : `プロンプトを生成 (${selectedTagsCount} タグ)`}
      </button>

      {japaneseDescription && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-sky-400">
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
              </svg>
              生成されたプロンプト (AIによる説明)
            </h3>
            <button
              onClick={() => onCopy(japaneseDescription)}
              disabled={!japaneseDescription.trim()}
              className="px-2.5 py-1 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="説明文をコピー"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                <path d="M5.5 2.5A2.5 2.5 0 0 0 3 5v6.5A2.5 2.5 0 0 0 5.5 14h5A2.5 2.5 0 0 0 13 11.5V5A2.5 2.5 0 0 0 10.5 2.5h-5Z" />
                <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H6v1H4.5a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 4.5 13H6v1H4.5A2.5 2.5 0 0 1 2 10.5v-6Z" />
              </svg>
              コピー
            </button>
          </div>
          <div className="p-3 bg-gray-700/70 border border-dashed border-sky-500/50 rounded-lg text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
            {japaneseDescription}
          </div>
        </div>
      )}

      {generatedPrompts && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {(Object.keys(formatLabels) as OutputFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => onSetFormat(format)}
                disabled={generalLoading}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-60
                  ${currentFormat === format 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
              >
                {formatLabels[format]}
              </button>
            ))}
          </div>
          
          <textarea
            readOnly
            value={currentPromptText}
            className="w-full h-36 p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-teal-500 custom-scrollbar text-sm"
            aria-label="選択された形式のプロンプトテキスト"
            placeholder="ここにプロンプトが表示されます..."
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onCopy(currentPromptText)}
              disabled={!currentPromptText || generalLoading}
              className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              現在のプロンプトをコピー
            </button>
            <button
              onClick={onGenerateImage}
              disabled={!canGenerateImage || generalLoading || !generatedPrompts?.imagePrompt}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title={!generatedPrompts?.imagePrompt ? "ImagePrompt (自然言語) が利用可能である必要があります" : `ImagePromptで画像生成 (${IMAGEN_MODEL_NAME})`}
            >
              {isGeneratingImage ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  画像生成中...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-3.69l-2.76-2.76a.75.75 0 00-1.06 0l-1.94 1.94-1.44-1.44a.75.75 0 00-1.06 0L8 12.56l-1.22-1.22a.75.75 0 00-1.06 0L2.5 11.06zM5 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                  ImagePromptで画像生成
                </>
              )}
            </button>
          </div>
          <button
              onClick={onGenerateImagesForAllPrompts}
              disabled={!generatedPrompts || generalLoading}
              className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title="生成された全てのプロンプト形式で画像を生成します"
            >
              {isGeneratingAllImages ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  全プロンプトで画像生成中...
                </>
              ) : (
                <>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path d="M10 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM17.5 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM2.5 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM10 11.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM17.5 11.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM2.5 11.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                 </svg>
                  全プロンプトで画像生成
                </>
              )}
          </button>
          <div className="text-center pt-2 space-y-0.5">
            <p className="text-xs text-gray-400">
              画像生成モデル: <code className="text-xs bg-gray-700 px-1 py-0.5 rounded">{IMAGEN_MODEL_NAME}</code> (Imagen 3 高品質)
            </p>
            <p className="text-xs text-gray-400">
              参考料金: $0.04 / 画像1枚 (約5.8円)
            </p>
            <p className="text-xs text-gray-500">
              ※最新の料金は必ずGoogle Cloud公式ドキュメントをご確認ください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptOutputArea;
