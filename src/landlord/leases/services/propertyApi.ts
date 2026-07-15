// import axios from 'axios'; // Uncomment when connecting to real backend
import type { Property, PropertyDefaults } from '../types/property.types';

// const BASE_URL = '/landlord/properties';

export const propertyApi = {
    getPropertiesCount: async (): Promise<number> => {
        // In a real app this would be: 
        // const response = await axios.get<PropertyCountResponse>(`${BASE_URL}/count`);
        // return response.data.count;

        // Mock simulation for now
        return new Promise((resolve) => {
            setTimeout(() => resolve(2), 500); // User has 2 properties
        });
    },

    getPropertiesList: async (): Promise<Property[]> => {
        // const response = await axios.get<Property[]>(`${BASE_URL}/list`);
        // return response.data;

        // Mock simulation
        return new Promise((resolve) => {
            setTimeout(() => resolve([
                { PropertyID: 1, PropertyAddress: 'Via Roma 10', PropertyRent: 500, PropertyMaintenance: 50, PropertyCurrency: 'EUR' },
                { PropertyID: 2, PropertyAddress: 'Piazza Garibaldi 5', PropertyRent: 800, PropertyMaintenance: 100, PropertyCurrency: 'EUR' }
            ]), 800);
        });
    },

    getPropertyDefaults: async (propertyId: number): Promise<PropertyDefaults> => {
        // const response = await axios.get<PropertyDefaults>(`${BASE_URL}/${propertyId}/defaults`);
        // return response.data;

        // Mock simulation
        return new Promise((resolve) => {
            setTimeout(() => resolve({
                rent: propertyId === 1 ? 500 : 800,
                maintenance: propertyId === 1 ? 50 : 100,
                currency: 'EUR'
            }), 300);
        });
    }
};
