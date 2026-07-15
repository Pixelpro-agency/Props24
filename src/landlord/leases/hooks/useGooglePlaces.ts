import { useEffect, useRef, useCallback } from 'react';

export interface ParsedAddress {
    route: string;          // Via / Street name
    streetNumber: string;   // Civico
    locality: string;       // Città
    postalCode: string;     // CAP
    country: string;        // Paese
    fullAddress: string;    // Indirizzo completo formattato
}

// Inline types for Google Maps Places (avoids needing @types/google.maps)
interface PlaceResult {
    address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
    }>;
    formatted_address?: string;
}

interface AutocompleteInstance {
    addListener: (event: string, handler: () => void) => void;
    getPlace: () => PlaceResult;
}

interface GoogleMapsPlaces {
    Autocomplete: new (
        input: HTMLInputElement,
        options?: Record<string, unknown>
    ) => AutocompleteInstance;
}

// Extend window to include google
declare global {
    interface Window {
        google?: {
            maps: {
                places: GoogleMapsPlaces;
            };
        };
        initGooglePlaces?: () => void;
    }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Hook per integrare Google Places Autocomplete su un campo indirizzo.
 * Se la API key non è configurata, il campo funziona come un normale input di testo.
 */
export function useGooglePlaces(
    onAddressSelected: (address: ParsedAddress) => void
) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<AutocompleteInstance | null>(null);
    const scriptLoadedRef = useRef(false);

    const parsePlace = useCallback(
        (place: PlaceResult): ParsedAddress => {
            const components = place.address_components || [];
            const get = (type: string) =>
                components.find((c) => c.types.includes(type))?.long_name || '';

            return {
                route: get('route'),
                streetNumber: get('street_number'),
                locality: get('locality') || get('administrative_area_level_3'),
                postalCode: get('postal_code'),
                country: get('country'),
                fullAddress: place.formatted_address || '',
            };
        },
        []
    );

    const initAutocomplete = useCallback(() => {
        if (!inputRef.current || !window.google) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
                types: ['address'],
                componentRestrictions: { country: 'it' }, // Default Italy
                fields: ['address_components', 'formatted_address'],
            }
        );

        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place) {
                onAddressSelected(parsePlace(place));
            }
        });
    }, [onAddressSelected, parsePlace]);

    useEffect(() => {
        // Skip if there's no API key configured
        if (!GOOGLE_MAPS_API_KEY) {
            console.info('[useGooglePlaces] Nessuna API key configurata – autocomplete disabilitato.');
            return;
        }

        // If script already loaded, just init
        if (window.google?.maps?.places) {
            initAutocomplete();
            return;
        }

        // Prevent double-loading
        if (scriptLoadedRef.current) return;
        scriptLoadedRef.current = true;

        // Load the Google Maps script dynamically
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
        script.async = true;
        script.defer = true;

        window.initGooglePlaces = () => {
            initAutocomplete();
        };

        document.head.appendChild(script);

        return () => {
            delete window.initGooglePlaces;
        };
    }, [initAutocomplete]);

    return { inputRef };
}
