// import axios from 'axios'; // Uncomment when connecting to real backend
import type { Tenant, Garant, TenantFormData, GarantFormData } from '../types/tenant.types';

// const BASE_URL_TENANTS = '/landlord/tenants';
// const BASE_URL_GARANTS = '/landlord/garants';

export const tenantApi = {
    getExistingTenants: async (): Promise<Tenant[]> => {
        // In a real app: return (await axios.get<Tenant[]>(`${BASE_URL_TENANTS}/list`)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve([
            { TenantID: 1, TenantType: 'person', TenantFirstName: 'Mario', TenantLastName: 'Rossi', TenantEmail: 'mario.rossi@example.com', TenantMobilePhone: '+393331234567' },
            { TenantID: 2, TenantType: 'company', TenantCompanyName: 'Acme SRL', TenantEmail: 'info@acme.it', TenantMobilePhone: '+3902123456' }
        ]), 400));
    },

    checkEmail: async (email: string, _tenantId?: string): Promise<boolean> => {
        // In a real app: return (await axios.get<{exists: boolean}>(`${BASE_URL_TENANTS}/checkemail`, { params: { email, excludeId: tenantId } })).data.exists;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve(email === 'mario.rossi@example.com'), 300));
    },

    checkNames: async (firstName: string, lastName: string, _tenantId?: string): Promise<boolean> => {
        // In a real app: return (await axios.get<{exists: boolean}>(`${BASE_URL_TENANTS}/checknames`, { params: { firstName, lastName, excludeId: tenantId } })).data.exists;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve(firstName.toLowerCase() === 'mario' && lastName.toLowerCase() === 'rossi'), 300));
    },

    createTenant: async (data: TenantFormData): Promise<Tenant> => {
        // In a real app: return (await axios.post<Tenant>(`${BASE_URL_TENANTS}/create`, data)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve({
            TenantID: Math.floor(Math.random() * 1000),
            ...data
        }), 800));
    },

    getGarants: async (): Promise<Garant[]> => {
        // In a real app: return (await axios.get<Garant[]>(`${BASE_URL_GARANTS}/list`)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve([
            { ContactID: 101, ContactType: 'person', ContactFirstName: 'Luigi', ContactLastName: 'Verdi', ContactEmail: 'luigi@verdi.it', ContactMobilePhone: '+393471234567', ContactProfessionID: 20 }
        ]), 400));
    },

    createGarant: async (data: GarantFormData): Promise<Garant> => {
        // In a real app: return (await axios.post<Garant>(`${BASE_URL_GARANTS}/create`, data)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve({
            ContactID: Math.floor(Math.random() * 1000),
            ...data,
            ContactProfessionID: 20
        }), 800));
    }
};
