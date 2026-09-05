import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function requireEnvironmentValue(name: string, value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`Configurazione Supabase mancante: ${name}.`);
    }

    return value.trim();
}

export function getSupabaseBrowserClient(): SupabaseClient {
    if (browserClient) {
        return browserClient;
    }

    const url = requireEnvironmentValue(
        'VITE_SUPABASE_URL',
        import.meta.env.VITE_SUPABASE_URL,
    );
    const publishableKey = requireEnvironmentValue(
        'VITE_SUPABASE_PUBLISHABLE_KEY',
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );

    browserClient = createClient(url, publishableKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });

    return browserClient;
}
