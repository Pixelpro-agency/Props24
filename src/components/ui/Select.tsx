import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
}

export function Select({ id, value, onChange, options, placeholder, className = '' }: SelectProps) {
    return (
        <div className={`relative inline-block ${className}`}>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="
          appearance-none w-full
          bg-white border border-gray-200 rounded-md
          px-3 py-2 pr-8
          text-sm text-gray-700
          hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
          transition-colors duration-200
          cursor-pointer
        "
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            />
        </div>
    );
}
