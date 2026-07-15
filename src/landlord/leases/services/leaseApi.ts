// import axios from 'axios'; // Uncomment when connecting to real backend
import type { LeaseFormData, LeaseType, LeaseResponse, DraftResponse } from '../types/lease.types';

// const BASE_URL = '/landlord/leases';

export const leaseApi = {
    getLeaseTypes: async (): Promise<LeaseType[]> => {
        // In a real app: return (await axios.get<LeaseType[]>(`${BASE_URL}/types`)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve([
            {
                LeaseTypeID: '1',
                LeaseTypeTitle: 'Canone libero (4+4)',
                LeaseTypeDuration: 48,
                LeaseTypeHasVat: false,
                LeaseTypeAutoRenew: true,
                LeaseTypeReceiptName: 'Ricevuta locazione',
                LeaseTypeFile: 'template_4+4.pdf',
                LeaseTypeMultiTenant: true,
                LeaseTypeGarants: true,
                LeaseTypeUtilisation: 1,
                LeaseTypeRevisionIndex: 'IRL'
            },
            {
                LeaseTypeID: '2',
                LeaseTypeTitle: 'Canone concordato (3+2)',
                LeaseTypeDuration: 36,
                LeaseTypeHasVat: false,
                LeaseTypeAutoRenew: true,
                LeaseTypeReceiptName: 'Ricevuta locazione agevolata',
                LeaseTypeFile: 'template_3+2.pdf',
                LeaseTypeMultiTenant: true,
                LeaseTypeGarants: true,
                LeaseTypeUtilisation: 1,
                LeaseTypeRevisionIndex: 'IRL'
            },
            {
                LeaseTypeID: '3',
                LeaseTypeTitle: 'Uso commerciale (6+6)',
                LeaseTypeDuration: 72,
                LeaseTypeHasVat: true,
                LeaseTypeAutoRenew: true,
                LeaseTypeReceiptName: 'Fattura commerciale',
                LeaseTypeFile: 'template_com.pdf',
                LeaseTypeMultiTenant: false,
                LeaseTypeGarants: true,
                LeaseTypeUtilisation: 2,
                LeaseTypeRevisionIndex: 'ILC'
            }
        ]), 500));
    },

    createLease: async (data: LeaseFormData): Promise<LeaseResponse> => {
        // In a real app: return (await axios.post<LeaseResponse>(`${BASE_URL}/create`, data)).data;

        // Mock simulation
        return new Promise((resolve) => {
            console.log('Creating lease with data:', data);
            setTimeout(() => resolve({ success: true, leaseId: Math.floor(Math.random() * 1000) }), 1000);
        });
    },

    saveLease: async (data: LeaseFormData): Promise<LeaseResponse> => {
        // In a real app: return (await axios.post<LeaseResponse>(`${BASE_URL}/save`, data)).data;

        // Mock simulation
        return new Promise((resolve) => {
            console.log('Saving lease with data:', data);
            setTimeout(() => resolve({ success: true, leaseId: Math.floor(Math.random() * 1000) }), 800);
        });
    },

    saveDraft: async (data: LeaseFormData): Promise<DraftResponse> => {
        // In a real app: return (await axios.post<DraftResponse>(`${BASE_URL}/draft`, data)).data;

        // Mock simulation
        return new Promise((resolve) => {
            console.log('Saving draft with data:', data);
            setTimeout(() => resolve({ success: true, draftId: 999 }), 500);
        });
    },

    downloadContract: async (_format: 'pdf' | 'word' | 'odt', _leaseId?: number): Promise<Blob> => {
        // In a real app:
        // const response = await axios.get(`${BASE_URL}/downloadContract`, {
        //   params: { format, LeaseID: leaseId },
        //   responseType: 'blob'
        // });
        // return response.data;

        // Mock simulation
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockBlob = new Blob(['Mock document content'], { type: 'application/pdf' });
                resolve(mockBlob);
            }, 1500);
        });
    },

    emailLease: async (_leaseId: number, _emailData: any): Promise<void> => {
        // In a real app: await axios.post(`${BASE_URL}/emailLease`, { leaseId, ...emailData });

        // Mock simulation
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 800);
        });
    }
};
