// @vitest-environment jsdom

import React from 'react';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import {
    Link,
    RouterProvider,
    createMemoryRouter,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NewProperty } from '../../src/pages/NewProperty';
import {
    defaultPropertyFormStateValues,
    type PropertyFormData,
    type PropertyFormState,
} from '../../src/components/property-form/schema';
import type {
    DraftRecord,
    DraftRepository,
} from '../../src/db/draftRepository.port';

let repository: DraftRepository;
const createProperty = vi.fn();
const legacyClear = vi.fn();

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));
vi.mock('../../src/db/propertyRepository', () => ({
    createProperty: (...args: unknown[]) => createProperty(...args),
}));
vi.mock('../../src/db/jsonDb', () => ({
    clearDraft: (...args: unknown[]) => legacyClear(...args),
}));
vi.mock('../../src/components/property-form/ui/AddressAutocomplete', () => ({
    AddressAutocomplete: ({
        name,
        label,
    }: {
        name: keyof PropertyFormData;
        label: string;
    }) => {
        const { register } = useFormContext<PropertyFormData>();
        return (
            <label>
                {label || 'Indirizzo'}
                <input {...register(name)} />
            </label>
        );
    },
}));

function clone<T>(value: T): T {
    return structuredClone(value);
}

function makeRecord(payload: PropertyFormState): DraftRecord<PropertyFormState> {
    return {
        id: 'property-create-draft',
        accountId: 'user-001',
        formType: 'property',
        mode: 'create',
        entityId: null,
        payload: clone(payload),
        schemaVersion: 2,
        createdAt: '2026-07-30T00:00:00.000Z',
        updatedAt: '2026-07-30T00:00:00.000Z',
    };
}

function makeStatefulRepository() {
    let stored: DraftRecord<PropertyFormState> | null = null;
    const stateful: DraftRepository = {
        get: vi.fn().mockImplementation(async () => (
            stored ? clone(stored) : null
        )),
        list: vi.fn().mockImplementation(async () => (
            stored ? [clone(stored)] : []
        )),
        save: vi.fn().mockImplementation(async (_definition, input) => {
            stored = makeRecord(input.payload as PropertyFormState);
            return clone(stored);
        }),
        delete: vi.fn().mockImplementation(async () => {
            const existed = stored !== null;
            stored = null;
            return existed;
        }),
    };
    return {
        repository: stateful,
        read: () => (stored ? clone(stored) : null),
    };
}

function PropertyRoute() {
    return (
        <>
            <Link to="/sidebar">Sidebar</Link>
            <NewProperty />
        </>
    );
}

function mountNewProperty() {
    const router = createMemoryRouter([
        { path: '/properties/new', element: <PropertyRoute /> },
        { path: '/sidebar', element: <p>Sidebar destination</p> },
        { path: '/properties/units/:id', element: <p>Property detail</p> },
    ], {
        initialEntries: ['/properties/new'],
    });
    const view = render(<RouterProvider router={router} />);
    return {
        router,
        unmount: view.unmount,
        dispose: () => router.dispose(),
    };
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('NewProperty discard baseline round-trip', () => {
    it('Resta → Abbandona → remount → Riprendi conserva la baseline persistita', async () => {
        const BASE = 'QA-DISCARD-BASE';
        const MODIFIED = `${BASE}-MOD`;
        const state = makeStatefulRepository();
        repository = state.repository;
        const user = userEvent.setup();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(
            () => undefined,
        );

        const first = mountNewProperty();
        const firstInput = await screen.findByLabelText(/Identificativo/);
        fireEvent.change(firstInput, { target: { value: BASE } });
        expect((firstInput as HTMLInputElement).value).toBe(BASE);
        await user.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await screen.findByText('Bozza salvata.');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(state.read()?.payload.PropertyTitle).toBe(BASE);
        first.unmount();
        first.dispose();

        const second = mountNewProperty();
        await user.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        const resumedInput = await screen.findByLabelText(/Identificativo/);
        expect((resumedInput as HTMLInputElement).value).toBe(BASE);

        fireEvent.change(resumedInput, { target: { value: MODIFIED } });
        expect((resumedInput as HTMLInputElement).value).toBe(MODIFIED);
        await user.click(screen.getByRole('link', { name: 'Sidebar' }));
        await user.click(await screen.findByRole('button', {
            name: 'Resta',
        }));
        expect((resumedInput as HTMLInputElement).value).toBe(MODIFIED);

        await user.click(screen.getByRole('link', { name: 'Sidebar' }));
        await user.click(await screen.findByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(second.router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(state.read()?.payload.PropertyTitle).toBe(BASE);
        second.unmount();
        second.dispose();

        const third = mountNewProperty();
        await user.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        const finalInput = await screen.findByLabelText(/Identificativo/);
        expect((finalInput as HTMLInputElement).value).toBe(BASE);

        await user.click(screen.getByRole('link', { name: 'Sidebar' }));
        await waitFor(() => expect(third.router.state.location.pathname)
            .toBe('/sidebar'));
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(state.read()?.payload).toEqual({
            ...defaultPropertyFormStateValues,
            PropertyTitle: BASE,
        });
        expect(consoleError).not.toHaveBeenCalled();
        third.unmount();
        third.dispose();
    });
});
