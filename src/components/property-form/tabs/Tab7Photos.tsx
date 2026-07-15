import { FormSection } from '../ui/FormSection';
import { UploadCloud } from 'lucide-react';
import { useState } from 'react';

export function Tab7Photos() {
    const [isDragging, setIsDragging] = useState(false);

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
        // Handle files here if implementing actual upload
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
                            />

                            <div className="bg-blue-400 p-2.5 rounded-full text-white mb-3">
                                <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-gray-600 font-medium">
                                Rilasciare i file qui o fare clic per caricare.
                            </p>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                            Formati accettati: GIF, JPG, PNG Dimensione massima: 15 Mega
                        </p>

                    </div>
                </div>

            </FormSection>
        </div>
    );
}
