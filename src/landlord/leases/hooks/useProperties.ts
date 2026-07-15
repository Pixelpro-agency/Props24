import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../services/propertyApi';

export const useProperties = () => {
    const { data: count, isLoading: isCountLoading } = useQuery({
        queryKey: ['properties', 'count'],
        queryFn: propertyApi.getPropertiesCount
    });

    const { data: properties, isLoading: isPropertiesLoading } = useQuery({
        queryKey: ['properties', 'list'],
        queryFn: propertyApi.getPropertiesList,
        enabled: !!count && count > 0 // Only fetch list if there are properties
    });

    const hasProperties = count !== undefined && count > 0;
    const isLoading = isCountLoading;

    return {
        hasProperties,
        isLoading,
        isPropertiesLoading,
        count,
        properties: properties || []
    };
};

export const usePropertyDefaults = (propertyId: number | null) => {
    return useQuery({
        queryKey: ['properties', 'defaults', propertyId],
        queryFn: () => propertyId ? propertyApi.getPropertyDefaults(propertyId) : null,
        enabled: !!propertyId
    });
};
