import React from 'react';
import { Plus, Search, TrendingUp, Shield } from 'lucide-react';
import { AppMode } from '../../lib/types';

interface ModeSelectorProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  disabled?: boolean;
  isAdmin?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange, disabled = false, isAdmin = false }) => {
  return (
    <div className="mb-8">
      <div className="flex space-x-1 bg-[#333] p-1 rounded-lg w-fit mx-auto border border-[#ffff00]">
        <button
          onClick={() => onModeChange('create')}
          disabled={disabled}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all font-mono ${
            mode === 'create'
              ? 'bg-[#ffff00] text-[#1a1a1a] shadow-sm'
              : 'text-white hover:text-[#ffff00]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Escrow</span>
        </button>
        
        <button
          onClick={() => onModeChange('interact')}
          disabled={disabled}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all font-mono ${
            mode === 'interact'
              ? 'bg-[#ffff00] text-[#1a1a1a] shadow-sm'
              : 'text-white hover:text-[#ffff00]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Search className="w-4 h-4" />
          <span>Interact with Escrow</span>
        </button>
        
        <button
          onClick={() => onModeChange('trading')}
          disabled={disabled}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all font-mono ${
            mode === 'trading'
              ? 'bg-[#ffff00] text-[#1a1a1a] shadow-sm'
              : 'text-white hover:text-[#ffff00]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trading Interface</span>
        </button>
        
        {isAdmin && (
          <button
            onClick={() => onModeChange('admin')}
            disabled={disabled}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all font-mono ${
              mode === 'admin'
                ? 'bg-[#ffff00] text-[#1a1a1a] shadow-sm'
                : 'text-white hover:text-[#ffff00]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ModeSelector;
