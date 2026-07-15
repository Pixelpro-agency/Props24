import { Search, X } from 'lucide-react';

interface SearchInputProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({ id, value, onChange, placeholder = 'Ricerca...', className = '' }: SearchInputProps) {
    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="
          w-full
          bg-white border border-gray-200 rounded-md
          pl-9 pr-8 py-2
          text-sm text-gray-700
          placeholder:text-gray-400
          hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
          transition-colors duration-200
        "
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute right-2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                    aria-label="Cancella ricerca"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
