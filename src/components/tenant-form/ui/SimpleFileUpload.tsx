// Upload file semplice per documenti identità e altri file
// Senza drag & drop, solo file input standard
import { useState, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Upload, X, FileText } from 'lucide-react';
import {
    calculateTenantAttachmentBytes,
    MAX_TENANT_DOCUMENT_BYTES,
    MAX_TENANT_TOTAL_ATTACHMENT_BYTES,
    type TenantFormData,
} from '../schema';

interface SimpleFileUploadProps {
    name: string;
    label: string;
    className?: string;
    helpText?: string;
    maxSizeMB?: number;
    accept?: string;
    orientation?: 'vertical' | 'horizontal';
    onFileSelected?: (file: File | null) => void;
}

export function SimpleFileUpload({
    name,
    label,
    className,
    helpText,
    maxSizeMB = 2,
    accept = '.pdf,.jpg,.jpeg,.png,.webp',
    orientation = 'horizontal',
    onFileSelected,
}: SimpleFileUploadProps) {
    const { control, getValues, setValue } = useFormContext<TenantFormData>();
    const value = useWatch({ control, name: name as any }) as { name?: string; type?: string; size?: number; dataUrl?: string } | null;
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validazione dimensione
        const maxBytes = Math.min(maxSizeMB * 1024 * 1024, MAX_TENANT_DOCUMENT_BYTES);
        if (file.size > maxBytes) {
            setError(`Il file supera la dimensione massima di ${Math.min(maxSizeMB, 2)}MB`);
            return;
        }
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Formato file non supportato. Usa PDF, JPG, PNG o WEBP.');
            return;
        }

        setError(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const storedFile = {
                id: `${name}-${file.lastModified}-${file.size}`,
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                dataUrl: event.target?.result as string,
            };
            const nextValues = { ...getValues(), [name]: storedFile };
            if (calculateTenantAttachmentBytes(nextValues) > MAX_TENANT_TOTAL_ATTACHMENT_BYTES) {
                setError("Limite allegati superato. La dimensione totale dei file dell'inquilino non può superare 3 MB.");
                if (inputRef.current) inputRef.current.value = '';
                return;
            }
            setValue(name as keyof TenantFormData, storedFile as any, { shouldDirty: true, shouldValidate: true });
            onFileSelected?.(file);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        setError(null);
        setValue(name as any, null, { shouldDirty: true });
        onFileSelected?.(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const baseInput = (
        <div className="flex-1 w-full">
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                id={`${name}-upload`}
            />

            {value ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{value.name}</p>
                        <p className="text-xs text-gray-500">{value.type} - {formatFileSize(value.size || 0)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Sfoglia
                </button>
            )}

            {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
            {helpText && !error && <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>}
        </div>
    );

    if (orientation === 'horizontal') {
        return (
            <div className={twMerge(clsx("grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4", className))}>
                <label htmlFor={`${name}-upload`} className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                    {label}
                </label>
                <div className="flex-1 w-full max-w-[500px]">
                    {baseInput}
                </div>
            </div>
        );
    }

    return (
        <div className={twMerge(clsx("flex flex-col gap-1.5", className))}>
            <label htmlFor={`${name}-upload`} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            {baseInput}
        </div>
    );
}
