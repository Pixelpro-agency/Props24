// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PropertyFormProvider, usePropertyFormContext } from '../../src/components/property-form/PropertyFormProvider';
import type { PropertyFormData, PropertyFormState } from '../../src/components/property-form/schema';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';

let repository: DraftRepository;

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => repository }));

function record(payload: PropertyFormState): DraftRecord<PropertyFormState> {
  return { id: 'draft-property', accountId: 'user-001', formType: 'property', mode: 'create', entityId: null, payload: structuredClone(payload), schemaVersion: 2, createdAt: '2026-08-21T00:00:00.000Z', updatedAt: '2026-08-21T00:00:00.000Z' };
}

function makeRepository(): DraftRepository {
  return {
    get: vi.fn().mockResolvedValue(null), list: vi.fn().mockResolvedValue([]), delete: vi.fn().mockResolvedValue(false),
    save: vi.fn().mockImplementation(async (_definition, input) => record(input.payload as PropertyFormState)),
  };
}

function Probe() {
  const methods = useFormContext<PropertyFormState>();
  const form = usePropertyFormContext();
  return <>
    <label>Building probe<input aria-label="Building probe" {...methods.register('PropertyBuildingId')} /></label>
    <label>Title probe<input aria-label="Title probe" {...methods.register('PropertyTitle')} /></label>
    <label>Address probe<input aria-label="Address probe" {...methods.register('PropertyAddress')} /></label>
    <label>City probe<input aria-label="City probe" {...methods.register('PropertyCity')} /></label>
    <label>Postal probe<input aria-label="Postal probe" {...methods.register('PropertyPostalCode')} /></label>
    <output data-testid="dirty">{String(methods.formState.isDirty)}</output>
    <button type="button" onClick={() => void form.saveDraft()}>Salva probe</button>
    <button type="submit">Submit probe</button>
    <Link to="/destination">Destination</Link>
  </>;
}

function renderProvider(onCreateProperty = vi.fn((data: PropertyFormData) => ({ id: data.PropertyTitle || 'property-1' }))) {
  const router = createMemoryRouter([
    { path: '/', element: <PropertyFormProvider activeTab="general" setActiveTab={() => undefined} onCreateProperty={onCreateProperty} onPropertyCreated={() => undefined} onExitDraft={() => undefined}><Probe /></PropertyFormProvider> },
    { path: '/destination', element: <p>Destination page</p> },
  ], { initialEntries: ['/'] });
  render(<RouterProvider router={router} />);
  return { router, onCreateProperty };
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Property Building form state', () => {
  it('starts empty and clean, becomes dirty without autosave, then manually saves v2 and becomes clean', async () => {
    repository = makeRepository();
    renderProvider();
    const input = await screen.findByLabelText('Building probe') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(screen.getByTestId('dirty').textContent).toBe('false');
    await userEvent.type(input, 'building-a');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
    expect(repository.save).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Salva probe' }));
    await waitFor(() => expect(repository.save).toHaveBeenCalledOnce());
    expect(vi.mocked(repository.save).mock.calls[0][0]).toMatchObject({ schemaVersion: 2 });
    expect(vi.mocked(repository.save).mock.calls[0][1]).toMatchObject({ payload: { PropertyBuildingId: 'building-a' } });
    await waitFor(() => expect(screen.getByTestId('dirty').textContent).toBe('false'));
    expect(input.value).toBe('building-a');
  });

  it('protects navigation when only Building is dirty and Resta preserves it without writes', async () => {
    repository = makeRepository();
    const { router } = renderProvider();
    const input = await screen.findByLabelText('Building probe') as HTMLInputElement;
    await userEvent.type(input, 'building-a');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
    expect(repository.save).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('link', { name: 'Destination' }));
    expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
    await waitFor(() => expect(screen.queryByText('Modifiche non salvate')).toBeNull());
    expect(router.state.location.pathname).toBe('/');
    expect(input.value).toBe('building-a');
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('submits canonical PropertyFormData without PropertyBuildingId', async () => {
    repository = makeRepository();
    const onCreateProperty = vi.fn((data: PropertyFormData) => ({ id: data.PropertyTitle || 'property-created' }));
    renderProvider(onCreateProperty);
    await userEvent.type(await screen.findByLabelText('Building probe'), 'building-a');
    await userEvent.type(screen.getByLabelText('Title probe'), 'Unità prova');
    await userEvent.type(screen.getByLabelText('Address probe'), 'Via Roma 1');
    await userEvent.type(screen.getByLabelText('City probe'), 'Roma');
    await userEvent.type(screen.getByLabelText('Postal probe'), '00100');
    await userEvent.click(screen.getByRole('button', { name: 'Submit probe' }));
    await waitFor(() => expect(onCreateProperty).toHaveBeenCalledOnce());
    const submitted = onCreateProperty.mock.calls[0][0];
    expect(submitted).toMatchObject({ PropertyTitle: 'Unità prova', PropertyAddress: 'Via Roma 1', PropertyCity: 'Roma', PropertyPostalCode: '00100' });
    expect(submitted).not.toHaveProperty('PropertyBuildingId');
  });
});
