// Upload foto avatar con preview — senza drag & drop, solo file input
import { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

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
    helpText = 'Formati accettati: GIF, JPG, PNG. Dimensione massima: 15 Mega',
    maxSizeMB = 15,
    accept = '.gif,.png,.jpg,.jpeg',
}: PhotoUploadProps) {
    const { setValue } = useFormContext();
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validazione dimensione
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Il file supera la dimensione massima di ${maxSizeMB}MB`);
            return;
        }

        // Validazione tipo
        const validTypes = ['image/gif', 'image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setError('Formato file non supportato. Usa GIF, JPG o PNG.');
            return;
        }

        setError(null);
        setFileName(file.name);

        // Crea preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setPreview(result);
            setValue(name, result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        setPreview(null);
        setFileName(null);
        setError(null);
        setValue(name, '');
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
                            preview ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50"
                        )}
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
                                {preview ? 'Modifica' : 'Sfoglia'}
                            </button>
                            {preview && (
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 rounded-md bg-white text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {fileName && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{fileName}</p>
                        )}
                    </div>
                </div>

                {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
                {helpText && !error && <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>}
            </div>
        </div>
    );
}
