import { useEffect, useState } from 'react';
import type { Property } from '../types/property';
import { listProperties } from '../db/propertyRepository';
import { subscribeJsonDb } from '../db/jsonDb';

export function usePropertiesDb() {
    const [properties, setProperties] = useState<Property[]>(() => listProperties());

    useEffect(() => {
        const refresh = () => setProperties(listProperties());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    return properties;
}
