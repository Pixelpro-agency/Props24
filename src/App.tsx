import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/properties" element={<Navigate to="/properties/units" replace />} />
            <Route path="/properties/units" element={<PropertiesPage />} />
            <Route path="/properties/units/:id" element={<PropertyDetailPage />} />
            <Route path="/properties/buildings" element={<BuildingsPage />} />
            <Route path="/properties/new" element={<NewProperty />} />
            <Route path="/properties/units/import" element={<ImportUnitsPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/new" element={<NewTenantPage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
            <Route path="/leases" element={<LeasesPage />} />
            <Route path="/leases/new" element={<NewLeasePage />} />
            <Route path="/leases/:id/edit" element={<EditLeasePage />} />
            <Route path="/leases/:id" element={<LeaseDetailPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
