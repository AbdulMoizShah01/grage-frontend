import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { WorkOrderHistoryPage } from './pages/WorkOrderHistoryPage';
import { InventoryPage } from './pages/InventoryPage';
import { WorkersPage } from './pages/WorkersPage';
import { ServicesPage } from './pages/ServicesPage';

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/vehicles" element={<VehiclesPage />} />
      <Route path="/work-orders" element={<WorkOrdersPage />} />
      <Route path="/work-orders/history" element={<WorkOrderHistoryPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/workers" element={<WorkersPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
