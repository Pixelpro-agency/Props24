// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantEditFormProvider, useTenantFormContext } from '../../src/components/tenant-form/TenantFormProvider';
import { defaultTenantValues, normalizeTenantDraft, type TenantFormData } from '../../src/components/tenant-form/schema';

const draft = vi.hoisted(() => ({
    get: vi.fn(), save: vi.fn(), delete: vi.fn(),
}));
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => draft }));

const initial = normalizeTenantDraft({ ...defaultTenantValues, TenantType: 'person', TenantFirstName: 'Ada', TenantLastName: 'Lovelace' });

function Fields() {
    const { register, formState } = useFormContext<TenantFormData>();
    const form = useTenantFormContext();
    return <>
        <input aria-label="Nome" {...register('TenantFirstName')} />
        <output aria-label="Dirty">{String(formState.isDirty)}</output>
        <button type="button" onClick={() => void form.saveDraft()}>Salva bozza</button>
        <button type="submit">Salva modifiche</button>
    </>;
}

function mount(update = vi.fn(), updated = vi.fn()) {
    const router = createMemoryRouter([
        { path: '/tenants/:id/edit', element: <TenantEditFormProvider entityId="tenant-a" initialState={initial} activeTab="info1" setActiveTab={vi.fn()} onUpdateTenant={update} onTenantUpdated={updated} onExitDraft={vi.fn()}><Fields /></TenantEditFormProvider> },
        { path: '/first', element: <p>Prima destinazione</p> },
        { path: '/second', element: <p>Seconda destinazione</p> },
    ], { initialEntries: ['/tenants/tenant-a/edit'] });
    render(<RouterProvider router={router} />);
    return { router, update, updated };
}

beforeEach(() => {
    draft.get.mockReset().mockResolvedValue(null);
    draft.save.mockReset().mockImplementation(async (_definition: unknown, input: { payload: TenantFormData }) => ({ payload: input.payload }));
    draft.delete.mockReset().mockResolvedValue(false);
});
afterEach(cleanup);

describe('Tenant edit draft C5.3', () => {
    it('carica la chiave edit, usa la baseline persistita e non autosalva', async () => {
        mount();
        expect((await screen.findByLabelText('Nome') as HTMLInputElement).value).toBe('Ada');
        expect(draft.get).toHaveBeenCalledWith(expect.anything(), { mode: 'edit', entityId: 'tenant-a' });
        expect(draft.save).not.toHaveBeenCalled();
        expect(draft.delete).not.toHaveBeenCalled();
    });

    it('salva manualmente una sola bozza edit e rende il form clean', async () => {
        mount();
        const name = await screen.findByLabelText('Nome');
        await userEvent.clear(name); await userEvent.type(name, 'Ada Maria');
        expect(draft.save).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(draft.save).toHaveBeenCalledTimes(1));
        expect(draft.save.mock.calls[0][1]).toMatchObject({ mode: 'edit', entityId: 'tenant-a', payload: { TenantFirstName: 'Ada Maria' } });
    });

    it('serializza submit e completa update prima della delete idempotente', async () => {
        const events: string[] = [];
        const update = vi.fn(async () => { events.push('update'); });
        draft.delete.mockImplementation(async () => { events.push('delete'); return false; });
        const updated = vi.fn();
        mount(update, updated);
        const form = (await screen.findByLabelText('Nome')).closest('form')!;
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
        expect(update).toHaveBeenCalledTimes(1);
        expect(draft.delete).toHaveBeenCalledTimes(1);
        expect(events).toEqual(['update', 'delete']);
    });

    it('riprende una bozza edit ricca clean senza update o delete', async () => {
        const payload = normalizeTenantDraft({ ...initial, TenantFirstName: 'Bozza Ada', TenantGuarantors: [{ id: 'nested-id', contactId: 'contact-a', contactType: 'person', firstName: 'Grace' }] });
        draft.get.mockResolvedValueOnce({ id: 'draft-a', accountId: 'account', formType: 'tenant', mode: 'edit', entityId: 'tenant-a', payload, schemaVersion: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' });
        const { update } = mount();
        await userEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Bozza Ada');
        expect(screen.getByLabelText('Dirty').textContent).toBe('false');
        expect(update).not.toHaveBeenCalled();
        expect(draft.delete).not.toHaveBeenCalled();
    });

    it('guard clean procede senza dialog o I/O', async () => {
        const { router, update } = mount();
        await screen.findByLabelText('Nome');
        await router.navigate('/first');
        expect(router.state.location.pathname).toBe('/first');
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        expect(draft.save).not.toHaveBeenCalled(); expect(draft.delete).not.toHaveBeenCalled(); expect(update).not.toHaveBeenCalled();
    });

    it('guard Resta preserva route e valore senza I/O', async () => {
        const { router, update } = mount();
        const name = await screen.findByLabelText('Nome');
        await userEvent.clear(name); await userEvent.type(name, 'Locale');
        void router.navigate('/first');
        await userEvent.click(await screen.findByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/tenants/tenant-a/edit');
        expect((name as HTMLInputElement).value).toBe('Locale');
        expect(draft.save).not.toHaveBeenCalled(); expect(draft.delete).not.toHaveBeenCalled(); expect(update).not.toHaveBeenCalled();
    });

    it('guard Salva bozza completa la prima destinazione senza update/delete', async () => {
        const { router, update } = mount();
        const name = await screen.findByLabelText('Nome');
        await userEvent.clear(name); await userEvent.type(name, 'Dirty');
        void router.navigate('/first');
        await screen.findByText('Modifiche non salvate');
        void router.navigate('/second');
        const saveButtons = screen.getAllByRole('button', { name: 'Salva bozza' });
        await userEvent.click(saveButtons.at(-1)!);
        await waitFor(() => expect(router.state.location.pathname).toBe('/first'));
        expect(draft.save).toHaveBeenCalledTimes(1);
        expect(draft.save.mock.calls[0][1]).toMatchObject({ mode: 'edit', entityId: 'tenant-a' });
        expect(draft.delete).not.toHaveBeenCalled(); expect(update).not.toHaveBeenCalled();
    });

    it('beforeunload segue clean, dirty e save manuale riuscito', async () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        mount();
        const name = await screen.findByLabelText('Nome');
        const beforeUnload = addListener.mock.calls.find(([type]) => type === 'beforeunload')?.[1] as EventListener;
        expect(beforeUnload).toBeTypeOf('function');
        const cleanEvent = new Event('beforeunload', { cancelable: true }); beforeUnload(cleanEvent);
        expect(cleanEvent.defaultPrevented).toBe(false);
        await userEvent.clear(name); await userEvent.type(name, 'Dirty');
        const dirtyEvent = new Event('beforeunload', { cancelable: true }); beforeUnload(dirtyEvent);
        expect(dirtyEvent.defaultPrevented).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(screen.getByLabelText('Dirty').textContent).toBe('false'));
        const savedEvent = new Event('beforeunload', { cancelable: true }); beforeUnload(savedEvent);
        expect(savedEvent.defaultPrevented).toBe(false);
        addListener.mockRestore();
    });

    it('guard Abbandona non salva né elimina la bozza persistita', async () => {
        draft.get.mockResolvedValueOnce({ id: 'draft-a', accountId: 'account', formType: 'tenant', mode: 'edit', entityId: 'tenant-a', payload: { ...initial, TenantFirstName: 'Salvata' }, schemaVersion: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' });
        const { router, update } = mount();
        await userEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        const name = screen.getByLabelText('Nome'); await userEvent.clear(name); await userEvent.type(name, 'Ulteriore');
        void router.navigate('/first');
        await userEvent.click(await screen.findByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/first'));
        expect(draft.save).not.toHaveBeenCalled(); expect(draft.delete).not.toHaveBeenCalled(); expect(update).not.toHaveBeenCalled();
    });

    it.each([true, false])('update seguito da delete %s completa una volta', async (deleted) => {
        const events: string[] = [];
        const update = vi.fn(async () => { events.push('update'); });
        draft.delete.mockImplementation(async () => { events.push('delete'); return deleted; });
        const updated = vi.fn(); mount(update, updated);
        await userEvent.click(await screen.findByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(updated).toHaveBeenCalledOnce());
        expect(update).toHaveBeenCalledOnce(); expect(draft.delete).toHaveBeenCalledOnce(); expect(events).toEqual(['update', 'delete']);
    });

    it('update failure non elimina, preserva il form e libera il lock per retry', async () => {
        const update = vi.fn().mockRejectedValueOnce(new Error('Update fallito')).mockResolvedValueOnce(undefined);
        const updated = vi.fn(); mount(update, updated);
        const name = await screen.findByLabelText('Nome'); await userEvent.clear(name); await userEvent.type(name, 'Locale');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
        expect(draft.delete).not.toHaveBeenCalled(); expect(updated).not.toHaveBeenCalled(); expect((name as HTMLInputElement).value).toBe('Locale');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    });

    it('cleanup failure mostra recovery e retry esegue solo delete', async () => {
        const update = vi.fn().mockResolvedValue(undefined); const updated = vi.fn();
        draft.delete.mockRejectedValueOnce(new Error('delete fail')).mockResolvedValueOnce(true);
        mount(update, updated);
        await userEvent.click(await screen.findByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Inquilino aggiornato, pulizia incompleta')).toBeTruthy();
        expect(update).toHaveBeenCalledOnce(); expect(updated).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Riprova pulizia' }));
        await waitFor(() => expect(updated).toHaveBeenCalledOnce());
        expect(update).toHaveBeenCalledOnce(); expect(draft.delete).toHaveBeenCalledTimes(2);
    });
});
