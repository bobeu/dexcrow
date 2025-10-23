import React from 'react';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
  id?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  placeholder = '',
  label,
  error,
  disabled = false,
  required = false,
  rows = 3,
  className = '',
  id
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-white font-mono"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`
          w-full px-3 py-2 border border-[#ffff00] bg-[#1a1a1a] text-white
          rounded-md focus:ring-[#ffff00] focus:border-[#ffff00]
          font-mono placeholder-[#666] resize-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
      />
      {error && (
        <p className="text-red-500 text-sm font-mono">{error}</p>
      )}
    </div>
  );
};

export default Textarea;
