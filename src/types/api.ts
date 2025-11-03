import { WorkOrderStatus } from './enums';

export type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  company?: string | null;
  notes?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  vehicles: Vehicle[];
};

export type Vehicle = {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string | null;
  mileage?: number | null;
  color?: string | null;
  engine?: string | null;
  notes?: string | null;
  customer: Customer;
};

export type WorkOrderLineItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  inventoryItemId?: number | null;
  serviceItemId?: number | null;
  inventoryItem?: InventoryItem | null;
  serviceItem?: ServiceItem | null;
};

export type WorkOrderLog = {
  id: number;
  timestamp: string;
  message: string;
  author?: string | null;
  category?: string | null;
};

export type WorkOrder = {
  id: number;
  code: string;
  status: WorkOrderStatus;
  description: string;
  arrivalDate: string;
  quotedAt?: string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  laborCost: string;
  partsCost: string;
  taxes: string;
  discount: string;
  parkingCharge: string;
  totalCost: string;
  notes?: string | null;
  isHistorical: boolean;
  createdAt: string;
  updatedAt: string;
  vehicle: Vehicle;
  customer?: Customer | null;
  lineItems: WorkOrderLineItem[];
  assignments: WorkerAssignment[];
  logs?: WorkOrderLog[];
};

export type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  quantityOnHand: number;
  reorderPoint: number;
  unitCost: string;
  unitPrice: string;
};

export type ServiceItem = {
  id: number;
  name: string;
  description?: string | null;
  defaultPrice: string;
  createdAt: string;
  updatedAt: string;
};

export type Worker = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  commuteExpense: string;
  shiftExpense: string;
  mealExpense: string;
  otherExpense: string;
  totalJobs: number;
  totalServices: number;
};

export type WorkerDetail = Worker & {
  createdAt: string;
  updatedAt: string;
  assignments: Array<{
    id: number;
    role?: string | null;
    notes?: string | null;
    servicesCount: number;
    createdAt: string;
    workOrder: {
      id: number;
      code: string;
      status: WorkOrderStatus;
      createdAt: string;
      totalCost: string;
    };
  }>;
};

export type WorkerAssignment = {
  id: number;
  role?: string | null;
  notes?: string | null;
  servicesCount: number;
  createdAt: string;
  updatedAt: string;
  worker: Worker;
};

export type DashboardSummary = {
  totals: {
    customers: number;
    vehicles: number;
    openWorkOrders: number;
  };
  revenueLast30Days: number;
  recentCompletedWorkOrders: Array<{
    id: number;
    code: string;
    totalCost: string | number;
    updatedAt: string;
  }>;
  lowStockItems: InventoryItem[];
  inventoryAlertsCount: number;
  topWorkers: Array<{
    id: number;
    name: string;
    totalJobs: number;
    totalServices: number;
    lastAssignment: {
      createdAt: string;
      workOrder: {
        id: number;
        code: string;
        status: WorkOrderStatus;
      };
    } | null;
  }>;
};
