import { z } from 'zod';

const ACCEPTED_FILE_EXTENSIONS = ['xlsx', 'csv', 'ods'];

export const importUnitsSchema = z.object({
    MLandlordID: z
        .string({ message: 'Seleziona un proprietario' })
        .min(1, 'Seleziona un proprietario'),
    properties_list: z
        .instanceof(FileList, { message: 'Seleziona un file da importare' })
        .refine((files) => files.length > 0, 'Seleziona un file da importare')
        .refine((files) => {
            if (files.length === 0) return true;
            const fileName = files[0].name;
            const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
            return ACCEPTED_FILE_EXTENSIONS.includes(extension);
        }, `Formato non valido. Formati accettati: ${ACCEPTED_FILE_EXTENSIONS.join(', ')}`),
});

export type ImportUnitsFormData = z.infer<typeof importUnitsSchema>;

export const ACCEPTED_FORMATS = ACCEPTED_FILE_EXTENSIONS;
