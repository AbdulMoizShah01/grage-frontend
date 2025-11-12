import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { PersistentLayout } from './components/layout/PersistentLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { WorkOrderHistoryPage } from './pages/WorkOrderHistoryPage';
import { InventoryPage } from './pages/InventoryPage';
import { WorkersPage } from './pages/WorkersPage';
import { ServicesPage } from './pages/ServicesPage';
import { MetadataPage } from './pages/MetadataPage';
import { InsightsPage } from './pages/InsightsPage';

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<PersistentLayout />}>
        <Route path="/" element={<DashboardPage key="dashboard" />} />
        <Route path="/metadata" element={<MetadataPage key="metadata" />} />
        <Route path="/insights" element={<InsightsPage key="insights" />} />
        <Route path="/customers" element={<CustomersPage key="customers" />} />
        <Route path="/vehicles" element={<VehiclesPage key="vehicles" />} />
        <Route path="/work-orders" element={<WorkOrdersPage key="work-orders" />} />
        <Route path="/work-orders/history" element={<WorkOrderHistoryPage key="work-orders-history" />} />
        <Route path="/inventory" element={<InventoryPage key="inventory" />} />
        <Route path="/services" element={<ServicesPage key="services" />} />
        <Route path="/workers" element={<WorkersPage key="workers" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
