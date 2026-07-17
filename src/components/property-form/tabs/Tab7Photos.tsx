import { FormSection } from '../ui/FormSection';
import { UploadCloud, X } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { PropertyFormData, StoredLocalFile } from '../schema';

const MAX_PHOTOS = 5;
const MAX_IMAGE_SIZE = 1024 * 1024;
const MAX_TOTAL_SIZE = 3 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

function newLocalId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readFileAsStoredLocalFile(file: File): Promise<StoredLocalFile> {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return Promise.reject(new Error('Tipo immagine non supportato.'));
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return Promise.reject(new Error('Immagine troppo grande. Limite massimo 1 MB per immagine.'));
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error || new Error('Impossibile leggere il file.'));
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Formato file non serializzabile.'));
                return;
            }
            resolve({
                id: newLocalId('photo'),
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                dataUrl: reader.result,
            });
        };
        reader.readAsDataURL(file);
    });
}

export function Tab7Photos() {
    const { watch, setValue } = useFormContext<PropertyFormData>();
    const photos = watch('PropertyPhotos') || [];
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFiles = async (files: FileList | File[]) => {
        const selectedFiles = Array.from(files);
        if (selectedFiles.length === 0) return;

        try {
            setError(null);
            if (photos.length + selectedFiles.length > MAX_PHOTOS) {
                throw new Error(`Puoi caricare al massimo ${MAX_PHOTOS} immagini per unità.`);
            }
            const nextTotalSize = photos.reduce((sum, photo) => sum + photo.size, 0)
                + selectedFiles.reduce((sum, file) => sum + file.size, 0);
            if (nextTotalSize > MAX_TOTAL_SIZE) {
                throw new Error('Allegati troppo pesanti. Limite massimo 3 MB complessivi per unità.');
            }
            const descriptors = await Promise.all(selectedFiles.map(readFileAsStoredLocalFile));
            const existingKeys = new Set(photos.map((photo) => `${photo.name}-${photo.size}-${photo.lastModified}`));
            const uniqueDescriptors = descriptors.filter((photo) => !existingKeys.has(`${photo.name}-${photo.size}-${photo.lastModified}`));
            setValue('PropertyPhotos', [...photos, ...uniqueDescriptors], { shouldDirty: true, shouldValidate: true });
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Errore durante il caricamento delle foto.');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        void handleFiles(e.dataTransfer.files);
    };

    const removePhoto = (id: string) => {
        setValue('PropertyPhotos', photos.filter((photo) => photo.id !== id), { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FormSection title="Foto" defaultOpen={true}>

                <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                    <div className="text-right pt-2 mt-4">
                        <span className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase">
                            FOTO
                        </span>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-2">

                        <div
                            className={`
                                mt-2 flex flex-col items-center justify-center p-12 lg:p-20 
                                border-2 border-dashed rounded-md transition-colors cursor-pointer bg-gray-50
                                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300'}
                            `}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                            <input
                                type="file"
                                id="photo-upload"
                                className="hidden"
                                multiple
                                accept="image/png, image/jpeg, image/gif"
                                onChange={(event) => {
                                    if (event.target.files) void handleFiles(event.target.files);
                                }}
                            />

                            <div className="bg-blue-400 p-2.5 rounded-full text-white mb-3">
                                <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-gray-600 font-medium">
                                Rilasciare i file qui o fare clic per caricare.
                            </p>
                        </div>

                        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

                        {photos.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                {photos.map((photo) => (
                                    <div key={photo.id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 bg-white">
                                        {photo.type.startsWith('image/') && (
                                            <img src={photo.dataUrl} alt={photo.name} className="h-14 w-14 object-cover rounded" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 truncate">{photo.name}</p>
                                            <p className="text-xs text-gray-500">{Math.round(photo.size / 1024)} KB</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(photo.id)}
                                            className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-sm text-gray-500 mt-2">
                            Formati accettati: GIF, JPG, PNG. Limiti: 1 MB per immagine, massimo 5 immagini, 3 MB totali.
                        </p>

                    </div>
                </div>

            </FormSection>
        </div>
    );
}
