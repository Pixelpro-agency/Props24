// Upload foto avatar con preview — senza drag & drop, solo file input
import { useState, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import {
    calculateTenantAttachmentBytes,
    MAX_TENANT_PHOTO_BYTES,
    MAX_TENANT_TOTAL_ATTACHMENT_BYTES,
    type TenantFormData,
} from '../schema';

interface PhotoUploadProps {
    name: string;
    label: string;
    className?: string;
    helpText?: string;
    maxSizeMB?: number;
    accept?: string;
}

export function PhotoUpload({
    name,
    label,
    className,
    helpText = 'Formati accettati: JPG, PNG, WebP. Dimensione massima: 1MB.',
    maxSizeMB = 1,
    accept = '.jpg,.jpeg,.png,.webp',
}: PhotoUploadProps) {
    const { control, getValues, setValue } = useFormContext<TenantFormData>();
    const value = useWatch({ control, name: name as any }) as { name?: string; type?: string; size?: number; dataUrl?: string } | null;
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const maxBytes = Math.min(maxSizeMB * 1024 * 1024, MAX_TENANT_PHOTO_BYTES);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validazione dimensione
        if (file.size > maxBytes) {
            setError('La foto supera la dimensione massima di 1MB.');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Formato file non supportato. Usa JPG, PNG o WEBP.');
            return;
        }

        setError(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const storedFile = {
                id: `${name}-${file.lastModified}-${file.size}`,
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                dataUrl: result,
            };
            const nextValues = { ...getValues(), [name]: storedFile };
            if (calculateTenantAttachmentBytes(nextValues) > MAX_TENANT_TOTAL_ATTACHMENT_BYTES) {
                setError("Limite allegati superato. La dimensione totale dei file dell'inquilino non può superare 3 MB.");
                if (inputRef.current) inputRef.current.value = '';
                return;
            }
            setValue(name as keyof TenantFormData, storedFile as any, { shouldDirty: true, shouldValidate: true });
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        setError(null);
        setValue(name as any, null, { shouldDirty: true, shouldValidate: true });
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className={twMerge(clsx("grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4", className))}>
            <label className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                {label}
            </label>
            <div className="flex-1 w-full max-w-[500px]">
                <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div
                        className={clsx(
                            "w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors",
                            value?.dataUrl ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50"
                        )}
                    >
                        {value?.dataUrl ? (
                            <img src={value.dataUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                    </div>

                    {/* Azioni */}
                    <div className="flex flex-col gap-2">
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            onChange={handleFileChange}
                            className="hidden"
                            id={`${name}-upload`}
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                {value ? 'Modifica' : 'Sfoglia'}
                            </button>
                            {value && (
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 rounded-md bg-white text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {value?.name && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{value.name}</p>
                        )}
                    </div>
                </div>

                {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
                {helpText && !error && <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>}
            </div>
        </div>
    );
}
