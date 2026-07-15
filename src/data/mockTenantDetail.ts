import { mockTenants } from './mockTenants';
import { mockTenantList } from './mockTenantList';
import type { TenantDetail, TenantLease, TenantMessage, TenantFinance, TenantDetailAddress } from '../types/tenantDetail';

// Genera un dettaglio inquilino fondendo i dati anagrafici (da mockTenants) 
// con alcuni dati accessori (mockati qui al volo per la vista "dettaglio completo")
export function buildTenantDetail(tenantId: string): TenantDetail | undefined {
    const baseTenant = mockTenants.find(t => t.id === tenantId);
    const listTenant = mockTenantList.find(t => t.id === tenantId);

    if (!baseTenant) return undefined;

    // Crea gli indirizzi
    const tenantAddress: TenantDetailAddress = {
        street: baseTenant.address1,
        city: baseTenant.city,
        zip: baseTenant.zip,
        country: baseTenant.country,
    };

    const rentedPropertyAddress: TenantDetailAddress | undefined = listTenant?.propertyName ? {
        displayName: listTenant.propertyName,
        street: listTenant.subtitle?.split(',')[0],
        city: listTenant.subtitle?.split(',')[1]?.trim(),
    } : undefined;

    // Genera locazioni fittizie se ha una proprietà associata
    const leases: TenantLease[] = listTenant?.propertyName ? [
        {
            id: `lease-${tenantId}-1`,
            propertyName: listTenant.propertyName,
            address: listTenant.subtitle || '',
            contractType: 'Canone Concordato (6+2)',
            status: 'Attiva',
            dateRange: {
                start: '01/01/2024',
                end: '31/12/2030'
            },
            rent: {
                amount: 600,
                currency: '€',
                frequency: 'mensile' // o "monthly" come nel json
            },
            expenses: {
                amount: 50,
                currency: '€',
                type: 'spese accessorie'
            }
        }
    ] : [];

    // Genera messaggi fittizi
    const messages: TenantMessage[] = [
        {
            id: `msg-${tenantId}-1`,
            subject: 'L\'avviso di scadenza è pronto',
            date: '01/02/2026',
            preview: 'Salve, Una copia della ricevuta relativa alla seguente locazione è...'
        },
        {
            id: `msg-${tenantId}-2`,
            subject: 'L\'avviso di scadenza è pronto',
            date: '01/01/2026',
            preview: 'Salve, Una copia della ricevuta relativa alla seguente locazione è...'
        }
    ];

    // Finanze
    const balanceAmount = listTenant?.balance || 0;
    const finances: TenantFinance = {
        income: {
            amount: baseTenant.monthlyIncome || 0,
            type: 'income'
        },
        balance: {
            amount: balanceAmount,
            type: balanceAmount < 0 ? 'debt' : (balanceAmount > 0 ? 'credit' : 'neutral'),
            status: balanceAmount < 0 ? 'negative' : (balanceAmount > 0 ? 'positive' : 'neutral')
        }
    };

    // Stiamo ignorando i campi che non sono presenti in TenantDetail usando destructurig
    const { address1, address2, city, zip, state, country, proAddress, proCity, proZip, proState, proCountry, ...restBaseTenant } = baseTenant;

    const detail: TenantDetail = {
        ...restBaseTenant,
        addresses: {
            tenantAddress,
            rentedProperty: rentedPropertyAddress,
        },
        employment: {
            profession: baseTenant.profession,
            workAddress: proAddress ? {
                street: proAddress,
                city: proCity,
                zip: proZip,
                country: proCountry
            } : undefined
        },
        loginStatus: {
            status: listTenant?.status === 'candidato' ? 'inactive' : 'pending_invitation' // Semplificazione mock
        },
        inviteLink: {
            url: `https://www.rentila.it/tenant/activate/14334/${tenantId}/mockhash`,
            description: "Invita l'inquilino. L'inquilino avrà accesso solo alle informazioni relative alla sua locazione, alle ricevute e può inviare messaggi tramite una interfaccia dedicata."
        },
        finances,
        leases,
        messages,
        activityHistory: []
    };

    return detail;
}
