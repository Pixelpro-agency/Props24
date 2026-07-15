import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    id?: string;
    options: Option[];
    value: string[]; // array of selected values
    onChange: (value: string[]) => void;
    placeholder?: string;
    maxSelections?: number;
    className?: string;
}

export function MultiSelect({
    id,
    options,
    value,
    onChange,
    placeholder = 'Seleziona...',
    maxSelections = 2,
    className = ''
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue));
        } else {
            if (value.length < maxSelections) {
                onChange([...value, optionValue]);
            }
        }
    };

    const handleRemove = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== optionValue));
    };

    const selectedOptions = options.filter(opt => value.includes(opt.value));

    return (
        <div ref={ref} className={`relative inline-block ${className}`}>
            <div
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className="
                    min-h-[38px] w-full flex items-center flex-wrap gap-1
                    bg-white border border-gray-200 rounded-md
                    px-2 py-1.5 pr-8
                    text-sm text-gray-700
                    hover:border-gray-300
                    focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-500
                    transition-colors duration-200 cursor-pointer
                "
            >
                {selectedOptions.length === 0 ? (
                    <span className="text-gray-500 px-1 truncate">{placeholder}</span>
                ) : (
                    selectedOptions.map(opt => (
                        <span key={opt.value} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-xs font-medium border border-green-200">
                            <span className="truncate max-w-[120px]">{opt.label}</span>
                            <button
                                type="button"
                                onClick={(e) => handleRemove(e, opt.value)}
                                className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))
                )}

                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full min-w-[200px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                        {options.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">Nessuna opzione</div>
                        ) : (
                            <div className="p-1">
                                {options.map(opt => {
                                    const isSelected = value.includes(opt.value);
                                    const isDisabled = !isSelected && value.length >= maxSelections;

                                    return (
                                        <div
                                            key={opt.value}
                                            onClick={() => !isDisabled && handleSelect(opt.value)}
                                            className={`
                                                flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer
                                                ${isSelected ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
                                                ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}
                                            `}
                                        >
                                            <span className="truncate pr-4">{opt.label}</span>
                                            {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
