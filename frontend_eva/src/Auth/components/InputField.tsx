import React from 'react';

interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  error?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  type,
  label,
  value,
  onChange,
  onKeyPress,
  error,
  placeholder,
  icon
}) => {
  return (
    <div className="mb-6">
      <label htmlFor={id} className="block text-sm font-medium text-purple-100 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-purple-300 
                   focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
                   transition-all duration-300 ease-in-out backdrop-blur-sm
                   ${error ? 'border-red-400 focus:ring-red-400' : 'border-purple-300/50 hover:border-purple-300'}`}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-300 animate-pulse">{error}</p>
      )}
    </div>
  );
};

export default InputField;