
import React, { useEffect, useState } from 'react';
import { GeneratedImageItem, OutputFormat, ImageGenerationModalProps } from '../types'; // Import GeneratedImageItem and ImageGenerationModalProps


const animationStyleId = 'image-modal-animation-style';

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  onClose,
  imageItems,
  overallIsLoading,
  yamlToDownload
}) => {
  const [downloadPromptTextChecked, setDownloadPromptTextChecked] = useState(true);

  useEffect(() => {
    if (isOpen && !document.getElementById(animationStyleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = animationStyleId;
      styleElement.innerHTML = `
        @keyframes imageModalShowAnimation {
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

  const handleDownloadImage = (item: GeneratedImageItem) => {
    if (item.imageUrl) {
      const imageName = `generated_image_${item.format}_${Date.now()}`;
      
      const imageLink = document.createElement('a');
      imageLink.href = item.imageUrl;
      imageLink.download = `${imageName}.jpg`;
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);

      if (downloadPromptTextChecked && item.promptText) {
        const blob = new Blob([item.promptText], { type: 'text/plain;charset=utf-8' });
        const textLink = document.createElement('a');
        textLink.href = URL.createObjectURL(blob);
        textLink.download = `${imageName}_prompt.txt`;
        document.body.appendChild(textLink);
        textLink.click();
        document.body.removeChild(textLink);
        URL.revokeObjectURL(textLink.href);
      }
    }
  };

  const handleDownloadYaml = () => {
    if (yamlToDownload) {
      const blob = new Blob([yamlToDownload], { type: 'application/x-yaml;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `prompts_config_${Date.now()}.yaml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  };

  const formatDisplayNames: Record<OutputFormat | 'ImagePrompt', string> = {
    stableDiffusion: 'Stable Diffusion',
    midjourney: 'Midjourney',
    imagePrompt: 'ImagePrompt (自然言語)',
    ImagePrompt: 'ImagePrompt (自然言語)', // Handles literal 'ImagePrompt'
    yaml: 'YAML Code',
  };


  const renderItem = (item: GeneratedImageItem, index: number, isSingleItemView: boolean) => (
    <div key={item.id || index} className={`bg-gray-700 p-3 rounded-lg shadow-md flex flex-col ${isSingleItemView ? 'w-full' : 'w-full'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-teal-400">
          {formatDisplayNames[item.format] || item.format}
        </h3>
        <span className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
          {item.modelName}
        </span>
      </div>

      <div className={`aspect-square w-full bg-gray-600 rounded overflow-hidden flex items-center justify-center mb-2 border border-gray-500 ${isSingleItemView ? 'max-h-[60vh]' : ''}`}>
        {item.isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <svg className="animate-spin h-8 w-8 text-purple-300 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-300 text-sm">生成中...</p>
          </div>
        )}
        {item.error && !item.isLoading && (
          <div className="p-3 text-red-300 text-xs text-center">
            <p className="font-semibold">エラー:</p>
            <p>{item.error}</p>
          </div>
        )}
        {item.imageUrl && !item.isLoading && !item.error && (
          <img src={item.imageUrl} alt={`Generated for ${item.format}`} className="w-full h-full object-contain" />
        )}
         {!item.isLoading && !item.imageUrl && !item.error && (
             <div className="text-gray-500 text-center p-4 text-sm">
                <p>画像生成を開始してください。</p>
             </div>
          )}
      </div>
      {item.promptText && (
        <p className="text-xs text-gray-400 bg-gray-800 p-1.5 rounded max-h-16 overflow-y-auto custom-scrollbar mb-2" title={item.promptText}>
          {item.promptText.length > 100 ? item.promptText.substring(0, 97) + "..." : item.promptText}
        </p>
      )}
      {item.imageUrl && !item.isLoading && !item.error && (
        <button
          onClick={() => handleDownloadImage(item)}
          className="w-full mt-auto px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors"
        >
          この画像をダウンロード
        </button>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center p-4 z-[60] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-generation-modal-title"
    >
      <div
        className="bg-gray-800 p-5 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar transform transition-all duration-300 ease-in-out scale-95 opacity-0 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: isOpen ? 'imageModalShowAnimation 0.3s forwards' : undefined }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="image-generation-modal-title" className="text-xl font-semibold text-gray-100">
            Gemini 画像生成結果
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

        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          {overallIsLoading && (!imageItems || imageItems.every(item => item.isLoading)) && ( 
            <div className="flex flex-col items-center justify-center text-center p-8">
              <svg className="animate-spin h-12 w-12 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-300 text-lg">画像を生成中です...</p>
              <p className="text-gray-400 text-sm mt-1">しばらくお待ちください。</p>
            </div>
          )}

          {imageItems && imageItems.length > 0 && (
            <div className={`grid gap-4 w-full ${imageItems.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {imageItems.map((item, index) => renderItem(item, index, imageItems.length === 1))}
            </div>
          )}
          
          {!overallIsLoading && (!imageItems || imageItems.length === 0) && (
             <div className="text-gray-500 text-center p-8">
                <p>画像生成を開始してください。</p>
             </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
          {yamlToDownload && (
            <button
              onClick={handleDownloadYaml}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
            >
              関連YAMLデータをダウンロード
            </button>
          )}
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="downloadPromptCheckboxModal"
              checked={downloadPromptTextChecked}
              onChange={(e) => setDownloadPromptTextChecked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-500 text-teal-600 focus:ring-teal-500 bg-gray-700 cursor-pointer"
            />
            <label htmlFor="downloadPromptCheckboxModal" className="text-xs text-gray-300 cursor-pointer select-none">
              画像ダウンロード時にプロンプトのテキストデータも保存
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationModal;
