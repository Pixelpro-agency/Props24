// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultTenantValues, type TenantFormData } from '../../src/components/tenant-form/schema';
import { Tab1General } from '../../src/components/tenant-form/tabs/Tab1General';

function Values() {
    const values = useWatch<TenantFormData>();
    return <output data-testid="values">{JSON.stringify(values)}</output>;
}

function Harness({ type }: { type: 'person' | 'company' }) {
    const methods = useForm<TenantFormData>({ defaultValues: { ...defaultTenantValues, TenantType: type } });
    return <FormProvider {...methods}><Tab1General /><Values /></FormProvider>;
}

afterEach(cleanup);

describe('campo fiscale company Tenant', () => {
    it('company mostra e mantiene distinti CF ente e CF rappresentante', async () => {
        const user = userEvent.setup();
        render(<Harness type="company" />);
        await user.type(screen.getByLabelText('Codice fiscale ente'), 'ENTE123');
        await user.type(screen.getByLabelText('Codice fiscale'), 'REP456');
        const values = JSON.parse(screen.getByTestId('values').textContent || '{}');
        expect(values).toMatchObject({ TenantCompanyFiscalCode: 'ENTE123', TenantFiscalCode: 'REP456' });
    });

    it('person non mostra Codice fiscale ente', () => {
        render(<Harness type="person" />);
        expect(screen.queryByLabelText('Codice fiscale ente')).toBeNull();
        expect(screen.getByLabelText('Codice fiscale')).toBeTruthy();
    });
});
