import React from 'react';
import { Plus, Search } from 'lucide-react';
import { AppMode } from '../lib/types';

interface ModeSelectorProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange, disabled = false }) => {
  return (
    <div className="mb-8">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
        <button
          onClick={() => onModeChange('create')}
          disabled={disabled}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all ${
            mode === 'create'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Escrow</span>
        </button>
        
        <button
          onClick={() => onModeChange('interact')}
          disabled={disabled}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all ${
            mode === 'interact'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Search className="w-4 h-4" />
          <span>Interact with Escrow</span>
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;
