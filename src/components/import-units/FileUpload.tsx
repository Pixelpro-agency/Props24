import { useRef, useState, useCallback } from 'react';
import { Upload, Pencil, Trash2, FileCheck2 } from 'lucide-react';
import { ACCEPTED_FORMATS } from './importUnitsSchema';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
    id?: string;
    onChange: (files: FileList | null) => void;
    onBlur: () => void;
    error?: string;
    name: string;
}

export function FileUpload({ id, onChange, onBlur, error, name }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const acceptString = ACCEPTED_FORMATS.map((f) => `.${f}`).join(',');

    const handleFileSelect = useCallback(
        (files: FileList | null) => {
            if (files && files.length > 0) {
                setSelectedFile(files[0]);
                onChange(files);
            }
        },
        [onChange]
    );

    const handleBrowse = () => {
        inputRef.current?.click();
    };

    const handleRemove = () => {
        setSelectedFile(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onChange(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileExtensionColor = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'xlsx': return 'bg-green-100 text-green-700';
            case 'csv': return 'bg-gray-100 text-gray-700';
            case 'ods': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-1">
            <input
                ref={inputRef}
                type="file"
                id={id}
                name={name}
                accept={acceptString}
                onChange={handleInputChange}
                onBlur={onBlur}
                className="sr-only"
                aria-describedby={error ? `${id}-error` : undefined}
            />

            <AnimatePresence mode="wait">
                {!selectedFile ? (
                    /* Stato NEW — drop zone */
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
              relative flex flex-col items-center justify-center gap-3 p-8
              border-2 border-dashed rounded-xl cursor-pointer
              transition-colors duration-200
              ${isDragging
                                ? 'border-green-400 bg-green-50'
                                : error
                                    ? 'border-red-300 bg-red-50/50'
                                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                            }
            `}
                        onClick={handleBrowse}
                    >
                        <div className={`
              p-3 rounded-full transition-colors duration-200
              ${isDragging ? 'bg-green-100' : 'bg-gray-100'}
            `}>
                            <Upload className={`w-6 h-6 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium text-green-600 hover:text-green-700">Sfoglia</span>
                                {' '}o trascina qui il file
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Formati accettati: {ACCEPTED_FORMATS.join(', ')}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    /* Stato EXISTS — file selezionato */
                    <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                    >
                        {/* Icona tipo file */}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${getFileExtensionColor(selectedFile.name)}`}>
                            <FileCheck2 className="w-6 h-6" />
                        </div>

                        {/* Info file */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {formatFileSize(selectedFile.size)} •{' '}
                                <span className="uppercase">
                                    {selectedFile.name.split('.').pop()}
                                </span>
                            </p>
                        </div>

                        {/* Azioni */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleBrowse}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                                title="Modifica"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                title="Rimuovi"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Errore */}
            {error && (
                <p id={`${id}-error`} className="text-xs text-red-500 mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
