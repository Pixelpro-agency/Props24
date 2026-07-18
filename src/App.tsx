import { useEffect, useState } from 'react';
import {
    BrowserRouter as Router,
    Navigate,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom';
import {
    QueryClient,
    QueryClientProvider,
    useQueryClient,
} from '@tanstack/react-query';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LogoutPage } from './auth/LogoutPage';
import { AuthModal } from './components/auth/AuthModal';
import { Layout } from './components/layout/Layout';
import { PropertiesPage } from './pages/PropertiesPage';
import { BuildingsPage } from './pages/BuildingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewProperty } from './pages/NewProperty';
import { ImportUnitsPage } from './pages/ImportUnitsPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { NewTenantPage } from './pages/NewTenantPage';
import { TenantsPage } from './pages/TenantsPage';
import { TenantDetailPage } from './pages/TenantDetailPage';
import { NewLeasePage } from './landlord/leases/pages/NewLeasePage';
import { LeasesPage } from './pages/LeasesPage';
import { LeaseDetailPage } from './pages/LeaseDetailPage';
import { EditLeasePage } from './pages/EditLeasePage';

import { DocumentTemplatesPage } from './pages/DocumentTemplatesPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

interface QueryCacheScope {
    accountId: string | null;
}

function AuthenticatedApplication() {
    const location = useLocation();
    const queryClientInstance = useQueryClient();
    const { account, isInitializing } = useAuth();
    const accountId = account?.id ?? null;
    const [readyCacheScope, setReadyCacheScope] =
        useState<QueryCacheScope | null>(null);

    useEffect(() => {
        queryClientInstance.clear();
        setReadyCacheScope({ accountId });
    }, [accountId, queryClientInstance]);

    const isCacheReady =
        readyCacheScope !== null &&
        readyCacheScope.accountId === accountId;

    if (isInitializing || !isCacheReady) {
        return null;
    }

    if (!account) {
        return (
            <>
                {location.pathname === '/logout' ? (
                    <Navigate to="/dashboard" replace />
                ) : null}

                <AuthModal />
            </>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/dashboard"
                    element={<DashboardPage />}
                />
                <Route
                    path="/properties"
                    element={
                        <Navigate
                            to="/properties/units"
                            replace
                        />
                    }
                />
                <Route
                    path="/properties/units"
                    element={<PropertiesPage />}
                />
                <Route
                    path="/properties/units/:id"
                    element={<PropertyDetailPage />}
                />
                <Route
                    path="/properties/buildings"
                    element={<BuildingsPage />}
                />
                <Route
                    path="/properties/new"
                    element={<NewProperty />}
                />
                <Route
                    path="/properties/units/import"
                    element={<ImportUnitsPage />}
                />
                <Route
                    path="/tenants"
                    element={<TenantsPage />}
                />
                <Route
                    path="/tenants/new"
                    element={<NewTenantPage />}
                />
                <Route
                    path="/tenants/:id"
                    element={<TenantDetailPage />}
                />
                <Route
                    path="/leases"
                    element={<LeasesPage />}
                />
                <Route
                    path="/leases/new"
                    element={<NewLeasePage />}
                />
                <Route
                    path="/leases/:id/edit"
                    element={<EditLeasePage />}
                />
                <Route
                    path="/leases/:id"
                    element={<LeaseDetailPage />}
                />
                <Route
                    path="/documents/all-templates"
                    element={<DocumentTemplatesPage />}
                />
                <Route
                    path="/logout"
                    element={<LogoutPage />}
                />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AuthProvider>
                    <AuthenticatedApplication />
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
