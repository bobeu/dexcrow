import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '',
  label,
  error,
  disabled = false,
  required = false,
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
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border border-[#ffff00] bg-[#1a1a1a] text-white
          rounded-md focus:ring-[#ffff00] focus:border-[#ffff00]
          font-mono disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
      >
        {placeholder && (
          <option value="" className="bg-[#1a1a1a] text-white">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#1a1a1a] text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-sm font-mono">{error}</p>
      )}
    </div>
  );
};

export default Select;
