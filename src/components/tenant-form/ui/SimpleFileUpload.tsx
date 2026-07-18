// Upload file semplice per documenti identità e altri file
// Senza drag & drop, solo file input standard
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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
    hideLabel?: boolean;
    buttonLabel?: string;
    allowAnyFileType?: boolean;
    successMessage?: string;
    readErrorMessage?: string;
    className?: string;
    helpText?: string;
    maxSizeMB?: number;
    accept?: string;
    orientation?: 'vertical' | 'horizontal';
    onFileSelected?: (file: File | null) => void;
}

interface DisplayedStoredFile {
    name?: string;
    type?: string;
    size?: number;
    dataUrl?: string;
}

const SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
];

function storedFileId(name: string, file: File): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${name}-${crypto.randomUUID()}`;
    }

    return `${name}-${Date.now()}-${file.lastModified}-${file.size}`;
}

export function SimpleFileUpload({
    name,
    label,
    hideLabel = false,
    buttonLabel = 'Sfoglia',
    allowAnyFileType = false,
    successMessage = 'Documento acquisito correttamente.',
    readErrorMessage = 'Impossibile leggere il documento selezionato. Riprova.',
    className,
    helpText,
    maxSizeMB = 2,
    accept = '.pdf,.jpg,.jpeg,.png,.webp',
    orientation = 'horizontal',
    onFileSelected,
}: SimpleFileUploadProps) {
    const { control, getValues, setValue } = useFormContext<TenantFormData>();
    const value = useWatch({
        control,
        name: name as any,
    }) as DisplayedStoredFile | null;
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = `${name}-upload`;

    const clearInput = () => {
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const showReadError = () => {
        setError(readErrorMessage);
        clearInput();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            showReadError();
            return;
        }

        const maxBytes = Math.min(
            maxSizeMB * 1024 * 1024,
            MAX_TENANT_DOCUMENT_BYTES,
        );

        if (file.size > maxBytes) {
            setError(
                `Il file supera la dimensione massima di ${Math.min(maxSizeMB, 2)}MB. Riprova.`,
            );
            clearInput();
            return;
        }

        if (!allowAnyFileType && !SUPPORTED_FILE_TYPES.includes(file.type)) {
            setError('Formato file non supportato. Usa PDF, JPG, PNG o WEBP. Riprova.');
            clearInput();
            return;
        }

        const reader = new FileReader();

        reader.onerror = showReadError;
        reader.onabort = showReadError;
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                showReadError();
                return;
            }

            const storedFile = {
                id: storedFileId(name, file),
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                dataUrl: reader.result,
            };
            const nextValues = {
                ...getValues(),
                [name]: storedFile,
            } as TenantFormData;

            if (
                calculateTenantAttachmentBytes(nextValues) >
                MAX_TENANT_TOTAL_ATTACHMENT_BYTES
            ) {
                setError(
                    "Limite allegati superato. La dimensione totale dei file dell'inquilino non può superare 3 MB. Riprova.",
                );
                clearInput();
                return;
            }

            setValue(
                name as any,
                storedFile as any,
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            );
            setError(null);
            clearInput();
            onFileSelected?.(file);
        };

        try {
            reader.readAsDataURL(file);
        } catch {
            showReadError();
        }
    };

    const handleRemove = () => {
        setValue(
            name as any,
            null,
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        );
        setError(null);
        clearInput();
        onFileSelected?.(null);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const baseInput = (
        <div className="flex-1 w-full">
            <input
                ref={inputRef}
                type="file"
                accept={allowAnyFileType ? undefined : accept}
                onChange={handleFileChange}
                className="hidden"
                id={inputId}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={twMerge(
                    clsx(
                        'inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors',
                        hideLabel && orientation === 'vertical' &&
                            'w-full min-h-10 justify-center hover:border-green-400 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                    ),
                )}
            >
                <Upload className="w-4 h-4" />
                {buttonLabel}
            </button>

            {value && (
                <div
                    role="status"
                    aria-live="polite"
                    className="mt-3 flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-md"
                >
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800">
                            {successMessage}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-800 truncate">
                            {value.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {value.type ? `${value.type} - ` : ''}
                            {formatFileSize(value.size || 0)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        aria-label={`Rimuovi ${label}`}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {error && (
                <p
                    role="alert"
                    className="mt-1.5 text-sm text-red-600 font-medium"
                >
                    {error}
                </p>
            )}
            {helpText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
            )}
        </div>
    );

    if (orientation === 'horizontal') {
        return (
            <div
                className={twMerge(
                    clsx(
                        'grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4',
                        className,
                    ),
                )}
            >
                <label
                    htmlFor={inputId}
                    className={hideLabel
                        ? 'sr-only'
                        : 'block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right'}
                >
                    {label}
                </label>
                <div className="flex-1 w-full max-w-[500px]">
                    {baseInput}
                </div>
            </div>
        );
    }

    return (
        <div
            className={twMerge(
                clsx('flex flex-col gap-1.5', className),
            )}
        >
            <label
                htmlFor={inputId}
                className={hideLabel ? 'sr-only' : 'block text-sm font-medium text-gray-700'}
            >
                {label}
            </label>
            {baseInput}
        </div>
    );
}
