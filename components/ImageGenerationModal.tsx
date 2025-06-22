
import React, { useEffect, useState } from 'react';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  promptUsed: string | null;
}

const animationStyleId = 'image-modal-animation-style';

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  isLoading,
  error,
  promptUsed
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

  const handleDownloadImage = () => {
    if (imageUrl) {
      const imageName = `generated_image_${Date.now()}`;
      
      // Download image
      const imageLink = document.createElement('a');
      imageLink.href = imageUrl;
      imageLink.download = `${imageName}.jpg`;
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);

      // Download prompt text if checked
      if (downloadPromptTextChecked && promptUsed) {
        const blob = new Blob([promptUsed], { type: 'text/plain;charset=utf-8' });
        const textLink = document.createElement('a');
        textLink.href = URL.createObjectURL(blob);
        textLink.download = `${imageName}_prompt.txt`;
        document.body.appendChild(textLink);
        textLink.click();
        document.body.removeChild(textLink);
        URL.revokeObjectURL(textLink.href); // Clean up
      }
      onClose(); // Close the modal after initiating downloads
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center p-4 z-[60] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-generation-modal-title"
    >
      <div
        className="bg-gray-800 p-5 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar transform transition-all duration-300 ease-in-out scale-95 opacity-0 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: isOpen ? 'imageModalShowAnimation 0.3s ease forwards' : undefined }}
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
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <svg className="animate-spin h-12 w-12 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-300 text-lg">画像を生成中です...</p>
              <p className="text-gray-400 text-sm mt-1">しばらくお待ちください。</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-700/20 border border-red-600 text-red-300 p-4 rounded-lg w-full text-sm">
              <p className="font-semibold mb-1">画像生成エラー:</p>
              <p>{error}</p>
            </div>
          )}

          {imageUrl && !isLoading && !error && (
            <div className="w-full aspect-square bg-gray-700 rounded-lg overflow-hidden shadow-lg border border-gray-600">
              <img src={imageUrl} alt="Geminiによって生成された画像" className="w-full h-full object-contain" />
            </div>
          )}
          
          {!isLoading && !imageUrl && !error && (
             <div className="text-gray-500 text-center p-8">
                <p>画像生成を開始してください。</p>
             </div>
          )}
        </div>
        
        {promptUsed && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-1">使用されたプロンプト:</p>
              <p className="text-xs text-gray-500 bg-gray-700 p-2 rounded max-h-20 overflow-y-auto custom-scrollbar">{promptUsed}</p>
            </div>
          )}

        {!isLoading && !error && imageUrl && (
           <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="downloadPromptCheckbox"
                  checked={downloadPromptTextChecked}
                  onChange={(e) => setDownloadPromptTextChecked(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-500 text-teal-600 focus:ring-teal-500 bg-gray-700 cursor-pointer"
                />
                <label htmlFor="downloadPromptCheckbox" className="text-xs text-gray-300 cursor-pointer select-none">
                  プロンプトのテキストデータもダウンロード
                </label>
              </div>
              <button
                onClick={handleDownloadImage}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-md transition-colors"
              >
                画像をダウンロード
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerationModal;
