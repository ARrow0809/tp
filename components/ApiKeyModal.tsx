import React from 'react';
import ApiKeyManager from './ApiKeyManager';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyChange: (apiKey: string | null) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onApiKeyChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <ApiKeyManager onApiKeyChange={onApiKeyChange} onClose={onClose} />
      </div>
    </div>
  );
};

export default ApiKeyModal;