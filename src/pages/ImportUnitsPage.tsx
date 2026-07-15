import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Select } from '../components/ui/Select';
import { InfoAlert } from '../components/import-units/InfoAlert';
import { FileUpload } from '../components/import-units/FileUpload';
import {
    importUnitsSchema,
    type ImportUnitsFormData,
} from '../components/import-units/importUnitsSchema';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const LANDLORD_OPTIONS = [
    { value: '0', label: 'francesco SVARA' },
];

export function ImportUnitsPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ImportUnitsFormData>({
        resolver: zodResolver(importUnitsSchema) as any,
        defaultValues: {
            MLandlordID: '',
        },
    });

    const landlordValue = watch('MLandlordID');

    const onSubmit = async (data: ImportUnitsFormData) => {
        setIsSubmitting(true);
        setSubmitSuccess(false);

        // Simula chiamata API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('=== IMPORT UNITS SUBMITTED ===');
        console.log('Proprietario ID:', data.MLandlordID);
        console.log('File:', data.properties_list?.[0]?.name);
        console.log('Payload:', {
            MLandlordID: data.MLandlordID,
            fileName: data.properties_list?.[0]?.name,
            fileSize: data.properties_list?.[0]?.size,
            fileType: data.properties_list?.[0]?.type,
        });

        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 4000);
    };

    const handleCancel = () => {
        navigate('/properties/units');
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6"
        >
            <div className="max-w-full">
                {/* Page Header */}
                <motion.h1
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-2xl font-normal text-gray-700 mb-6"
                >
                    Importa Unità
                </motion.h1>

                {/* Info Alert */}
                <InfoAlert />

                {/* Success Message */}
                {submitSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 mb-6 bg-green-50 border border-green-200 rounded-lg"
                    >
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-sm text-green-800">
                            File importato con successo! Controlla la console per i dettagli.
                        </p>
                    </motion.div>
                )}

                {/* Validation Errors */}
                {hasErrors && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-md"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800 mb-1">
                                Errori di validazione
                            </h3>
                            <ul className="text-sm text-red-700 list-disc list-inside space-y-0.5">
                                {Object.entries(errors).map(([field, err]) => (
                                    <li key={field}>{(err as any)?.message}</li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}

                {/* Form Box */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                    {/* Section Header */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <h2 className="text-base font-semibold text-gray-700">Import</h2>
                    </div>

                    {/* Form Body */}
                    <form
                        id="import-units-form"
                        onSubmit={handleSubmit(onSubmit)}
                        className="p-6 space-y-6"
                    >
                        {/* Select Proprietario */}
                        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-6 items-start">
                            <label
                                htmlFor="MLandlordID"
                                className="text-sm font-medium text-gray-700 sm:pt-2"
                            >
                                Proprietario <span className="text-red-400">*</span>
                            </label>
                            <div>
                                <Select
                                    id="MLandlordID"
                                    value={landlordValue}
                                    onChange={(val) => setValue('MLandlordID', val, { shouldValidate: true })}
                                    options={LANDLORD_OPTIONS}
                                    placeholder="Scegli"
                                    className="w-full max-w-sm"
                                />
                                {errors.MLandlordID && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.MLandlordID.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-6 items-start">
                            <label
                                htmlFor="properties_list"
                                className="text-sm font-medium text-gray-700 sm:pt-2"
                            >
                                File <span className="text-red-400">*</span>
                            </label>
                            <Controller
                                name="properties_list"
                                control={control}
                                render={({ field }) => (
                                    <FileUpload
                                        id="properties_list"
                                        name={field.name}
                                        onChange={(files) => {
                                            field.onChange(files);
                                        }}
                                        onBlur={field.onBlur}
                                        error={errors.properties_list?.message}
                                    />
                                )}
                            />
                        </div>
                    </form>

                    {/* Form Actions */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center gap-3">
                        <button
                            type="submit"
                            form="import-units-form"
                            disabled={isSubmitting}
                            className="
                inline-flex items-center gap-2 px-5 py-2.5
                bg-green-600 hover:bg-green-700 active:bg-green-800
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white text-sm font-medium rounded-md
                shadow-sm hover:shadow transition-all duration-200
              "
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                    </svg>
                                    Importazione...
                                </>
                            ) : (
                                'Conferma'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="
                px-5 py-2.5 text-sm font-medium text-gray-600
                bg-white border border-gray-200 rounded-md
                hover:bg-gray-50 hover:text-gray-800
                transition-all duration-200
              "
                        >
                            Annulla
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
