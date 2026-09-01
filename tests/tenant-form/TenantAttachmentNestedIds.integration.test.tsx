// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import { tenantDraftDefinition } from '../../src/components/tenant-form/tenantDraftDefinition';
import { PhotoUpload } from '../../src/components/tenant-form/ui/PhotoUpload';
import { SimpleFileUpload } from '../../src/components/tenant-form/ui/SimpleFileUpload';
import { Tab5Documents } from '../../src/components/tenant-form/tabs/Tab5Documents';

const mocks = vi.hoisted(() => ({
    generateId: vi.fn(),
    documents: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../src/utils/id', () => ({ generateId: mocks.generateId }));
vi.mock('../../src/db/jsonDb', () => ({
    getJsonDb: () => ({ documents: mocks.documents }),
}));

function Values({ name }: { name: keyof TenantFormData }) {
    const value = useWatch<TenantFormData>({ name });
    return <output data-testid="values">{JSON.stringify(value)}</output>;
}

function Harness({ children, name, values = {} }: {
    children: React.ReactNode;
    name: keyof TenantFormData;
    values?: Partial<TenantFormData>;
}) {
    const methods = useForm<TenantFormData>({ defaultValues: { ...defaultTenantValues, ...values } });
    return <FormProvider {...methods}>{children}<Values name={name} /></FormProvider>;
}

const file = (name = 'file.pdf', type = 'application/pdf') => new File(['content'], name, { type, lastModified: 10 });
const values = () => JSON.parse(screen.getByTestId('values').textContent || 'null');

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.documents = [];
    const counters: Record<string, number> = {};
    mocks.generateId.mockImplementation((prefix: string) => {
        counters[prefix] = (counters[prefix] || 0) + 1;
        return `${prefix}-uuid-${counters[prefix]}`;
    });
});

describe('ID canonici allegati Tenant', () => {
    it('PhotoUpload genera dopo lettura, preserva rerender e rinnova su replace/remove/reupload', async () => {
        const view = render(<Harness name="TenantPhoto"><PhotoUpload name="TenantPhoto" label="Foto" /></Harness>);
        const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
        expect(mocks.generateId).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { files: [file('photo.jpg', 'image/jpeg')] } });
        await waitFor(() => expect(values()?.id).toBe('tenant-photo-uuid-1'));
        expect(mocks.generateId).toHaveBeenCalledWith('tenant-photo');
        view.rerender(<Harness name="TenantPhoto"><PhotoUpload name="TenantPhoto" label="Foto" /></Harness>);
        expect(values().id).toBe('tenant-photo-uuid-1');
        fireEvent.change(input, { target: { files: [file('photo.jpg', 'image/jpeg')] } });
        await waitFor(() => expect(values()?.id).toBe('tenant-photo-uuid-2'));
        await userEvent.click(screen.getByRole('button', { name: '' }));
        expect(values()).toBeNull();
        expect(mocks.generateId).toHaveBeenCalledTimes(2);
        fireEvent.change(input, { target: { files: [file('photo.jpg', 'image/jpeg')] } });
        await waitFor(() => expect(values()?.id).toBe('tenant-photo-uuid-3'));
    });

    it('PhotoUpload non consuma ID per file rifiutato', () => {
        const view = render(<Harness name="TenantPhoto"><PhotoUpload name="TenantPhoto" label="Foto" /></Harness>);
        fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file('bad.txt', 'text/plain')] } });
        expect(values()).toBeNull();
        expect(mocks.generateId).not.toHaveBeenCalled();
    });

    it.each(['TenantIDCard', 'TenantIDCardBack', 'TenantCompanyRegistryFile'] as const)(
        'SimpleFileUpload %s usa tenant-file e rinnova replace/remove/reupload',
        async (name) => {
            const view = render(<Harness name={name}><SimpleFileUpload name={name} label={name} /></Harness>);
            const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
            fireEvent.change(input, { target: { files: [file()] } });
            await waitFor(() => expect(values()?.id).toBe('tenant-file-uuid-1'));
            fireEvent.change(input, { target: { files: [file()] } });
            await waitFor(() => expect(values()?.id).toBe('tenant-file-uuid-2'));
            await userEvent.click(screen.getByRole('button', { name: `Rimuovi ${name}` }));
            expect(values()).toBeNull();
            expect(mocks.generateId).toHaveBeenCalledTimes(2);
            fireEvent.change(input, { target: { files: [file()] } });
            await waitFor(() => expect(values()?.id).toBe('tenant-file-uuid-3'));
        },
    );

    it('SimpleFileUpload non consuma ID per file rifiutato', () => {
        const view = render(<Harness name="TenantIDCard"><SimpleFileUpload name="TenantIDCard" label="Documento" /></Harness>);
        fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file('bad.txt', 'text/plain')] } });
        expect(values()).toBeNull();
        expect(mocks.generateId).not.toHaveBeenCalled();
    });

    it('Tab5 crea parent/file distinti, preserva metadata/toggle e rinnova solo il file in replace', async () => {
        const user = userEvent.setup();
        render(<Harness name="TenantDocuments"><Tab5Documents /></Harness>);
        await user.click(screen.getByRole('button', { name: 'Nuovo documento' }));
        await user.selectOptions(screen.getByRole('combobox'), '1');
        fireEvent.change(document.querySelector('#tenant-document-upload')!, { target: { files: [file()] } });
        expect(mocks.generateId).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(values()).toHaveLength(1));
        expect(values()[0]).toMatchObject({ id: 'tenant-document-uuid-1', file: { id: 'tenant-file-uuid-1' } });
        expect(values()[0].id).not.toBe(values()[0].file.id);
        await user.click(screen.getByTitle('Non condiviso'));
        expect(values()[0].id).toBe('tenant-document-uuid-1');
        await user.click(screen.getByTitle('Modifica'));
        await user.clear(screen.getByRole('textbox'));
        await user.type(screen.getByRole('textbox'), 'aggiornata');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(values()[0]).toMatchObject({ id: 'tenant-document-uuid-1', file: { id: 'tenant-file-uuid-1' }, description: 'aggiornata' });
        expect(mocks.generateId).toHaveBeenCalledTimes(2);
        await user.click(screen.getByTitle('Modifica'));
        fireEvent.change(document.querySelector('#tenant-document-upload')!, { target: { files: [file('replacement.pdf')] } });
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(values()[0].file.id).toBe('tenant-file-uuid-2'));
        expect(values()[0].id).toBe('tenant-document-uuid-1');
    });

    it('Tab5 collega file globale senza tenant-file e blocca il duplicato senza consumare ID', async () => {
        mocks.documents = [{
            id: 'global-document-1',
            file: { id: 'global-file-1', name: 'global.pdf', type: 'application/pdf', size: 7, lastModified: 1, dataUrl: 'data:x' },
        }];
        const user = userEvent.setup();
        render(<Harness name="TenantDocuments"><Tab5Documents /></Harness>);
        const link = async () => {
            await user.click(screen.getByRole('button', { name: 'Nuovo documento' }));
            await user.click(screen.getByRole('button', { name: 'Esistente' }));
            await user.selectOptions(screen.getByRole('combobox'), 'global-document-1');
            expect(mocks.generateId).not.toHaveBeenCalled();
            await user.click(screen.getByRole('button', { name: 'Salva' }));
        };
        await link();
        expect(values()[0]).toMatchObject({ id: 'tenant-document-uuid-1', existingDocumentId: 'global-document-1', file: { id: 'global-file-1' } });
        mocks.generateId.mockClear();
        await link();
        expect((await screen.findAllByText('Questo documento è già collegato a questo inquilino.')).length).toBeGreaterThan(0);
        expect(values()).toHaveLength(1);
        expect(mocks.generateId).not.toHaveBeenCalled();
    });

    it('draft e normalization preservano byte-for-byte tutti i sei ID senza generazione', () => {
        const payload = {
            ...defaultTenantValues,
            TenantFirstName: 'Ada',
            TenantLastName: 'Lovelace',
            TenantPhoto: { id: 'photo-legacy-test', name: 'p', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantIDCard: { id: 'id-front-legacy-test', name: 'f', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantIDCardBack: { id: 'id-back-legacy-test', name: 'b', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantCompanyRegistryFile: { id: 'registry-legacy-test', name: 'r', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantDocuments: [{ id: 'document-legacy-test', fileName: 'd', categoryId: 1, categoryLabel: 'x', description: '', uploadDate: '', fileSize: 1, isShared: false, fileUrl: '', file: { id: 'document-file-legacy-test', name: 'd', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' } }],
        };
        for (const result of [normalizeTenantFormData(payload), tenantDraftDefinition.parse(payload, 1)]) {
            expect(result.TenantPhoto?.id).toBe('photo-legacy-test');
            expect(result.TenantIDCard?.id).toBe('id-front-legacy-test');
            expect(result.TenantIDCardBack?.id).toBe('id-back-legacy-test');
            expect(result.TenantCompanyRegistryFile?.id).toBe('registry-legacy-test');
            expect(result.TenantDocuments[0].id).toBe('document-legacy-test');
            expect(result.TenantDocuments[0].file?.id).toBe('document-file-legacy-test');
        }
        expect(mocks.generateId).not.toHaveBeenCalled();
    });
});
