// import axios from 'axios'; // Uncomment when connecting to real backend
import type { VerificationData, SignatureResponse } from '../types/tenant.types';

// const BASE_URL = '/landlord/signature';

export const signatureApi = {
    startSignatureProcess: async (_leaseId: number): Promise<SignatureResponse> => {
        // In a real app: return (await axios.post<SignatureResponse>(`${BASE_URL}/start/${leaseId}`)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
    },

    sendVerificationCode: async (data: VerificationData): Promise<SignatureResponse> => {
        // In a real app: return (await axios.post<SignatureResponse>(`${BASE_URL}/send-code`, data)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: `Code sent via ${data.method}` }), 1500));
    },

    verifyAndSign: async (_leaseId: number, code: string, _signatureBase30: string): Promise<SignatureResponse> => {
        // In a real app: return (await axios.post<SignatureResponse>(`${BASE_URL}/verify-sign`, { leaseId, code, signature: signatureBase30 })).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => {
            if (code === '123456') { // Mock valid code
                resolve({ success: true });
            } else {
                resolve({ success: false, message: 'Invalid code' });
            }
        }, 1500));
    },

    resetSignatureProcess: async (_leaseId: number): Promise<SignatureResponse> => {
        // In a real app: return (await axios.post<SignatureResponse>(`${BASE_URL}/reset/${leaseId}`)).data;

        // Mock simulation
        return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 800));
    }
};
