import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { appRouter } from './router';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={appRouter} />
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
