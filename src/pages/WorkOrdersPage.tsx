import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Link,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
  Flex,
  useBreakpointValue,
  Grid,
  GridItem,
  Wrap,
  WrapItem,
  Avatar,
  Skeleton,
  SkeletonText,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  MdAdd, 
  MdCheckCircle, 
  MdPrint, 
  MdRemove, 
  MdEdit,
  MdDelete,
  MdAssignment,
  MdReceipt,
  MdCarRepair,
  MdPerson,
  MdDirectionsCar,
  MdSchedule,
  MdAttachMoney,
  MdInventory,
  MdBuild,
  MdWarning
} from 'react-icons/md';
import { FiTrash2, FiEdit2, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';

import { AppShell } from '../components/shell/AppShell';
import { useWorkOrders, WorkOrderInput } from '../hooks/useWorkOrders';
import { useVehicles } from '../hooks/useVehicles';
import { useCustomers } from '../hooks/useCustomers';
import { useInventory } from '../hooks/useInventory';
import { useServices } from '../hooks/useServices';
import { useWorkers } from '../hooks/useWorkers';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { WorkOrderStatus } from '../types/enums';
import { WorkOrder } from '../types/api';
import { formatCurrency } from '../utils/formatting';
import { buildInvoiceCode, downloadInvoice } from '../utils/invoices';
import { StatCard } from '../components/cards/StatCard';

const LINE_ITEM_TYPES = [
  { value: 'SERVICE', label: 'Service', icon: MdBuild },
  { value: 'PART', label: 'Part', icon: MdInventory }
] as const;

type LineItemType = (typeof LINE_ITEM_TYPES)[number]['value'];

type LineItemState = {
  id: number;
  type: LineItemType;
  name: string;
  quantity: number;
  unitPrice: string;
  catalogId: string;
};

const createLineItem = (id: number): LineItemState => ({
  id,
  type: 'SERVICE',
  name: '',
  quantity: 1,
  unitPrice: '',
  catalogId: ''
});

const customerInitialState = {
  fullName: '',
  phone: '',
  email: ''
};

const vehicleInitialState = {
  vin: '',
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  licensePlate: '',
  color: '',
  notes: ''
};

const VAT_RATE = 0.18;
const nowLocalIso = () => new Date().toISOString().slice(0, 16);
const combineName = (first: string, last: string) => `${first} ${last}`.trim();
const normalizePhone = (value: string) => value.replace(/\D/g, '');
const normalizeVin = (value: string) => value.replace(/\s+/g, '').toUpperCase();

const ensurePositiveNumber = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value > 0 ? value : fallback;
};

const findExistingCustomer = (
  customers: ReturnType<typeof useCustomers>['data'] | undefined,
  fullName: string,
  phone: string
) => {
  if (!customers || (!fullName.trim() && !phone.trim())) {
    return undefined;
  }

  const normalizedPhone = normalizePhone(phone);
  const normalizedName = fullName.trim().toLowerCase();

  return customers.find((customer) => {
    const candidatePhone = normalizePhone(customer.phone);
    if (normalizedPhone && candidatePhone === normalizedPhone) {
      return true;
    }

    if (!normalizedName) {
      return false;
    }

    const candidateName = combineName(customer.firstName, customer.lastName).toLowerCase();
    return candidateName === normalizedName;
  });
};

const findExistingVehicle = (
  vehicles: ReturnType<typeof useVehicles>['data'] | undefined,
  vin: string
) => {
  if (!vehicles || !vin.trim()) {
    return undefined;
  }

  const normalizedVin = normalizeVin(vin);
  return vehicles.find((vehicle) => normalizeVin(vehicle.vin) === normalizedVin);
};

const sanitizeOptional = (value?: string | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

// Skeleton loader for work order rows
const WorkOrderRowSkeleton = () => (
  <Tr>
    <Td><Skeleton height="20px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
    <Td><Skeleton height="20px" width="120px" /></Td>
    <Td><Skeleton height="20px" width="100px" /></Td>
    <Td><Skeleton height="20px" width="140px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
    <Td><Skeleton height="20px" width="100px" /></Td>
    <Td><Skeleton height="20px" width="120px" /></Td>
  </Tr>
);

export const WorkOrdersPage = () => {
  const toast = useToast();
  const lineItemIdRef = useRef(2);
  const location = useLocation();

  const {
    data: workOrders,
    isLoading,
    error,
    createWorkOrder,
    isCreating,
    deleteWorkOrder,
    isDeleting,
    completeWorkOrder,
    isCompleting,
    updateWorkOrder,
    isUpdating
  } = useWorkOrders({ status: 'ALL', historical: false });
  const {
    data: vehicles,
    createVehicle: createVehicleMutation
  } = useVehicles();
  const {
    data: customers,
    createCustomer: createCustomerMutation
  } = useCustomers();
  const { data: inventory } = useInventory();
  const { data: services } = useServices();
  const { data: workers } = useWorkers();
  const { data: summary } = useDashboardSummary();
  const deleteDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const [customerForm, setCustomerForm] = useState(customerInitialState);
  const [vehicleForm, setVehicleForm] = useState(vehicleInitialState);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [arrivalDate, setArrivalDate] = useState(nowLocalIso());
  const [scheduledDate, setScheduledDate] = useState('');
  const [parkingCharge, setParkingCharge] = useState('');
  const [discount, setDiscount] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [lineItems, setLineItems] = useState<LineItemState[]>([createLineItem(1)]);
  const [workOrderPendingDelete, setWorkOrderPendingDelete] = useState<WorkOrder | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const editDisclosure = useDisclosure();
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [editFormState, setEditFormState] = useState({
    description: '',
    status: WorkOrderStatus.IN_PROGRESS as WorkOrderStatus,
    arrivalDate: '',
    scheduledDate: '',
    completedDate: '',
    laborCost: '',
    partsCost: '',
    parkingCharge: '',
    discount: '',
    notes: ''
  });

  // Close drawer and dialogs when navigating away
  useEffect(() => {
    // Close edit drawer if open
    if (editDisclosure.isOpen) {
      editDisclosure.onClose();
      setEditingOrder(null);
    }
    // Close delete dialog if open
    if (deleteDisclosure.isOpen) {
      deleteDisclosure.onClose();
      setWorkOrderPendingDelete(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Cleanup: close drawer and dialogs on unmount
  useEffect(() => {
    return () => {
      if (editDisclosure.isOpen) {
        editDisclosure.onClose();
      }
      if (deleteDisclosure.isOpen) {
        deleteDisclosure.onClose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Responsive values
  const gridColumns = useBreakpointValue({ 
    base: 1, 
    lg: 2 
  });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md', lg: 'lg' });
  const tableVariant = useBreakpointValue({ 
    base: 'simple', 
    md: 'striped' 
  });
  const showCompactTable = useBreakpointValue({ base: true, md: false });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const successColor = useColorModeValue('green.600', 'green.300');
  const warningColor = useColorModeValue('orange.600', 'orange.300');
  const dangerColor = useColorModeValue('red.600', 'red.300');

  const customerOptions = useMemo(() => customers ?? [], [customers]);
  const vehicleOptions = useMemo(() => vehicles ?? [], [vehicles]);
  const serviceOptions = useMemo(() => services ?? [], [services]);
  const inventoryOptions = useMemo(() => inventory ?? [], [inventory]);
  const workerOptions = useMemo(() => workers ?? [], [workers]);
  const workOrderList = useMemo(() => workOrders ?? [], [workOrders]);

  const matchedCustomer = useMemo(
    () => findExistingCustomer(customerOptions, customerForm.fullName, customerForm.phone),
    [customerOptions, customerForm.fullName, customerForm.phone]
  );

  const matchedVehicle = useMemo(
    () => findExistingVehicle(vehicleOptions, vehicleForm.vin),
    [vehicleOptions, vehicleForm.vin]
  );

  const serviceTotal = lineItems
    .filter((item) => item.type === 'SERVICE')
    .reduce((sum, item) => sum + item.quantity * (Number(item.unitPrice) || 0), 0);
  const partsTotal = lineItems
    .filter((item) => item.type === 'PART')
    .reduce((sum, item) => sum + item.quantity * (Number(item.unitPrice) || 0), 0);
  const discountValue = Number(discount) || 0;
  const taxesValue = Math.max((serviceTotal + partsTotal - discountValue) * VAT_RATE, 0);
  const parkingChargeValue = Number(parkingCharge) || 0;
  const grandTotal = serviceTotal + partsTotal + taxesValue + parkingChargeValue - discountValue;

  // Calculate work order statistics
  const workOrderStats = useMemo(() => {
    if (!workOrderList.length) return null;
    
    const totalOrders = workOrderList.length;
    const inProgressOrders = workOrderList.filter(order => order.status === WorkOrderStatus.IN_PROGRESS).length;
    const pendingOrders = workOrderList.filter(order => order.status === WorkOrderStatus.PENDING).length;
    const totalRevenue = workOrderList.reduce((sum, order) => sum + Number(order.totalCost), 0);

    return {
      totalOrders,
      inProgressOrders,
      pendingOrders,
      totalRevenue
    };
  }, [workOrderList]);

  const handleCustomerFieldChange =
    (field: keyof typeof customerInitialState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setCustomerForm((previous) => ({
        ...previous,
        [field]: value
      }));
    };

  const handleVehicleFieldChange =
    (field: keyof typeof vehicleInitialState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setVehicleForm((previous) => ({
        ...previous,
        [field]: value
      }));
    };

  const handleLineItemChange = (id: number, field: keyof LineItemState, value: string | number) => {
    setLineItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === 'type') {
          return {
            ...item,
            type: value as LineItemType,
            catalogId: '',
            name: '',
            unitPrice: ''
          };
        }

        if (field === 'quantity') {
          const parsed = Number(value);
          const quantityValue = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
          return { ...item, quantity: quantityValue };
        }

        if (field === 'name') {
          const typedValue = typeof value === 'string' ? value : String(value);
          const dataset = item.type === 'SERVICE' ? serviceOptions : inventoryOptions;
          const match = dataset.find(
            (option) => option.name.trim().toLowerCase() === typedValue.trim().toLowerCase()
          );

          const nextUnitPrice = () => {
            if (!match) {
              return item.unitPrice;
            }

            if (item.type === 'SERVICE') {
              const serviceMatch = match as (typeof serviceOptions)[number];
              return serviceMatch.defaultPrice ? String(serviceMatch.defaultPrice) : item.unitPrice;
            }

            const inventoryMatch = match as (typeof inventoryOptions)[number];
            return inventoryMatch.unitPrice ? String(inventoryMatch.unitPrice) : item.unitPrice;
          };

          return {
            ...item,
            name: typedValue,
            catalogId: match ? String(match.id) : '',
            unitPrice: nextUnitPrice()
          };
        }

        return {
          ...item,
          [field]: value
        };
      })
    );
  };

  const addLineItem = () => {
    const nextId = lineItemIdRef.current++;
    setLineItems((previous) => [...previous, createLineItem(nextId)]);
  };

  const removeLineItem = (id: number) => {
    setLineItems((previous) => previous.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setCustomerForm(customerInitialState);
    setVehicleForm(vehicleInitialState);
    setDescription('');
    setNotes('');
    setArrivalDate(nowLocalIso());
    setScheduledDate('');
    setParkingCharge('');
    setDiscount('');
    setWorkerId('');
    lineItemIdRef.current = 2;
    setLineItems([createLineItem(1)]);
  };

  const handleSubmit = async () => {
    if (!customerForm.fullName.trim()) {
      toast({ 
        status: 'warning', 
        title: 'Customer name required',
        position: 'top-right'
      });
      return;
    }

    if (!customerForm.phone.trim()) {
      toast({ 
        status: 'warning', 
        title: 'Customer phone number required',
        position: 'top-right'
      });
      return;
    }

    if (!vehicleForm.vin.trim()) {
      toast({ 
        status: 'warning', 
        title: 'Vehicle VIN required',
        position: 'top-right'
      });
      return;
    }

    if (!vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      toast({ 
        status: 'warning', 
        title: 'Vehicle make and model required',
        position: 'top-right'
      });
      return;
    }

    if (!description.trim()) {
      toast({ 
        status: 'warning', 
        title: 'Work order description required',
        position: 'top-right'
      });
      return;
    }

    if (!lineItems.length) {
      toast({ 
        status: 'warning', 
        title: 'Add at least one service or part',
        position: 'top-right'
      });
      return;
    }

    if (lineItems.some((item) => !item.name.trim())) {
      toast({ 
        status: 'warning', 
        title: 'All line items need a name',
        position: 'top-right'
      });
      return;
    }

    try {
      const normalizedFullName = customerForm.fullName.trim();
      const normalizedPhone = customerForm.phone.trim();

      const existingCustomer =
        matchedCustomer ??
        findExistingCustomer(customerOptions, normalizedFullName, normalizedPhone);

      let resolvedCustomerId: number;

      if (existingCustomer) {
        resolvedCustomerId = existingCustomer.id;
      } else {
        const createdCustomer = await createCustomerMutation({
          fullName: normalizedFullName,
          phone: normalizedPhone
        });
        resolvedCustomerId = createdCustomer.id;
      }

      const normalizedVin = normalizeVin(vehicleForm.vin);
      const existingVehicle =
        matchedVehicle ?? findExistingVehicle(vehicleOptions, vehicleForm.vin);

      if (
        existingVehicle &&
        existingVehicle.customer &&
        existingVehicle.customer.id !== resolvedCustomerId
      ) {
        toast({
          status: 'error',
          title: 'Vehicle already assigned to different customer',
          description: 'Please update the vehicle record or use a different VIN.',
          position: 'top-right'
        });
        return;
      }

      const yearValue = Number(vehicleForm.year);

      let resolvedVehicleId: number;

      if (existingVehicle) {
        resolvedVehicleId = existingVehicle.id;
      } else {
        const createdVehicle = await createVehicleMutation({
          vin: normalizedVin,
          make: vehicleForm.make.trim(),
          model: vehicleForm.model.trim(),
          year: ensurePositiveNumber(yearValue, new Date().getFullYear()),
          licensePlate: sanitizeOptional(vehicleForm.licensePlate) ?? null,
          color: sanitizeOptional(vehicleForm.color) ?? null,
          notes: sanitizeOptional(vehicleForm.notes) ?? null,
          customerId: resolvedCustomerId
        });
        resolvedVehicleId = createdVehicle.id;
      }

      const payload: WorkOrderInput = {
        vehicleId: resolvedVehicleId,
        customerId: resolvedCustomerId,
        description: description.trim(),
        arrivalDate,
        quotedAt: arrivalDate,
        scheduledDate: scheduledDate || null,
        parkingCharge: parkingChargeValue || undefined,
        discount: discountValue || undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        laborCost: serviceTotal,
        partsCost: partsTotal,
        lineItems: lineItems.map((item) => ({
          type: item.type,
          name: item.name.trim(),
          quantity: ensurePositiveNumber(item.quantity, 1),
          unitPrice: Number(item.unitPrice) || 0,
          description: item.name.trim(),
          inventoryItemId: item.type === 'PART' && item.catalogId ? Number(item.catalogId) : undefined,
          serviceItemId: item.type === 'SERVICE' && item.catalogId ? Number(item.catalogId) : undefined
        })),
        assignments: workerId ? [{ workerId: Number(workerId) }] : []
      };

      await createWorkOrder(payload);
      toast({ 
        status: 'success', 
        title: 'Work order created successfully',
        position: 'top-right'
      });
      resetForm();
    } catch (submitError) {
      toast({
        status: 'error',
        title: 'Unable to create work order',
        description: submitError instanceof Error ? submitError.message : 'Please try again.',
        position: 'top-right'
      });
    }
  };

  const openEditDrawer = (order: WorkOrder) => {
    setEditingOrder(order);
    setEditFormState({
      description: order.description,
      status: order.status,
      arrivalDate: order.arrivalDate ? order.arrivalDate.slice(0, 16) : nowLocalIso(),
      scheduledDate: order.scheduledDate ? order.scheduledDate.slice(0, 16) : '',
      completedDate: order.completedDate ? order.completedDate.slice(0, 16) : '',
      laborCost: String(Number(order.laborCost) || ''),
      partsCost: String(Number(order.partsCost) || ''),
      parkingCharge: String(Number(order.parkingCharge) || ''),
      discount: String(Number(order.discount) || ''),
      notes: order.notes ?? ''
    });
    editDisclosure.onOpen();
  };

  const closeEditDrawer = () => {
    setEditingOrder(null);
    editDisclosure.onClose();
  };

  const handleEditFieldChange =
    (field: keyof typeof editFormState) =>
    (value: string) => {
      setEditFormState((previous) => ({
        ...previous,
        [field]: value
      }));
    };

  const handleSubmitEdit = async () => {
    if (!editingOrder) {
      return;
    }

    try {
      await updateWorkOrder({
        id: editingOrder.id,
        payload: {
          description: editFormState.description.trim(),
          status: editFormState.status as WorkOrderStatus,
          arrivalDate: editFormState.arrivalDate,
          scheduledDate: editFormState.scheduledDate || undefined,
          completedDate: editFormState.completedDate || undefined,
          laborCost: Number(editFormState.laborCost) || undefined,
          partsCost: Number(editFormState.partsCost) || undefined,
          parkingCharge: Number(editFormState.parkingCharge) || undefined,
          discount: Number(editFormState.discount) || undefined,
          notes: editFormState.notes.trim() || undefined
        }
      });
      toast({ 
        status: 'success', 
        title: 'Work order updated successfully',
        position: 'top-right'
      });
      closeEditDrawer();
    } catch (error) {
      toast({
        status: 'error',
        title: 'Unable to update work order',
        description: error instanceof Error ? error.message : 'Please try again.',
        position: 'top-right'
      });
    }
  };

  const handleGenerateInvoice = async (order: WorkOrder) => {
    try {
      const invoiceName = buildInvoiceCode(order).replace(/\//g, '-');
      await downloadInvoice(order.id, invoiceName);
      toast({ 
        status: 'success', 
        title: 'Invoice generated successfully',
        description: 'Your invoice is ready for download.',
        position: 'top-right'
      });
    } catch (error) {
      toast({
        status: 'error',
        title: 'Unable to generate invoice',
        description: error instanceof Error ? error.message : 'Please try again.',
        position: 'top-right'
      });
    }
  };

  const handleCompleteWorkOrder = async (order: WorkOrder) => {
    try {
      setCompletingId(order.id);
      await completeWorkOrder(order.id);
      toast({
        status: 'success',
        title: 'Work order completed',
        description: `${order.code} has been marked as completed and moved to history.`,
        position: 'top-right'
      });
    } catch (completeError) {
      toast({
        status: 'error',
        title: 'Unable to complete work order',
        description: completeError instanceof Error ? completeError.message : 'Please try again.',
        position: 'top-right'
      });
    } finally {
      setCompletingId(null);
    }
  };

  const openDeleteDialog = (order: WorkOrder) => {
    setWorkOrderPendingDelete(order);
    deleteDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setWorkOrderPendingDelete(null);
  };

  const handleDeleteWorkOrder = async () => {
    if (!workOrderPendingDelete) {
      return;
    }

    try {
      await deleteWorkOrder(workOrderPendingDelete.id);
      toast({
        status: 'success',
        title: 'Work order deleted',
        description: `${workOrderPendingDelete.code} has been removed from the system.`,
        position: 'top-right'
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to delete work order',
        description: deleteError instanceof Error ? deleteError.message : 'Please resolve any linked assignments and try again.',
        position: 'top-right'
      });
    }
  };

  // Mobile-friendly work order cards for small screens
  const WorkOrderCard = ({ order }: { order: WorkOrder }) => (
    <Card 
      bg={cardBg} 
      border="1px" 
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-2px)',
        boxShadow: 'lg'
      }}
    >
      <CardBody>
        <VStack align="stretch" spacing={3}>
          {/* Header */}
          <Flex justify="space-between" align="flex-start">
            <Box>
              <Text fontWeight="bold" fontSize="lg" color={accentColor}>
                {order.code}
              </Text>
              <Badge
                colorScheme={
                  order.status === WorkOrderStatus.COMPLETED
                    ? 'green'
                    : order.status === WorkOrderStatus.IN_PROGRESS
                    ? 'blue'
                    : 'orange'
                }
                variant="subtle"
                size="sm"
              >
                {order.status}
              </Badge>
            </Box>
            <Text fontWeight="bold" fontSize="lg">
              {formatCurrency(Number(order.totalCost))}
            </Text>
          </Flex>

          {/* Customer & Vehicle */}
          <Box>
            <Text fontSize="sm" color={mutedText} mb={1}>Customer & Vehicle</Text>
            <Text fontWeight="medium">
              {order.customer ? combineName(order.customer.firstName, order.customer.lastName) : 'Unassigned'}
            </Text>
            <Text fontSize="sm" color={mutedText}>
              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
            </Text>
          </Box>

          {/* Dates */}
          <Box>
            <Text fontSize="sm" color={mutedText} mb={1}>Timeline</Text>
            <Text fontSize="sm">
              Arrived: {new Date(order.arrivalDate ?? order.createdAt).toLocaleDateString()}
            </Text>
            {order.scheduledDate && (
              <Text fontSize="sm" color={mutedText}>
                Scheduled: {new Date(order.scheduledDate).toLocaleDateString()}
              </Text>
            )}
          </Box>

          {/* Assignments */}
          <Box>
            <Text fontSize="sm" color={mutedText} mb={1}>Assigned To</Text>
            {order.assignments.length === 0 ? (
              <Text fontSize="sm" color={mutedText}>Unassigned</Text>
            ) : (
              <Wrap spacing={1}>
                {order.assignments.map((assignment) => (
                  <WrapItem key={assignment.id}>
                    <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                      {assignment.worker.name}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </Box>

          {/* Actions */}
          <Flex justify="space-between" pt={2}>
            <HStack spacing={1}>
              <Tooltip label="Edit work order">
                <IconButton
                  aria-label="Edit work order"
                  icon={<MdEdit />}
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDrawer(order)}
                />
              </Tooltip>
              <Tooltip label="Mark as completed">
                <IconButton
                  aria-label="Mark work order as completed"
                  icon={<MdCheckCircle />}
                  size="sm"
                  variant="ghost"
                  colorScheme="green"
                  onClick={() => handleCompleteWorkOrder(order)}
                  isDisabled={isCompleting}
                  isLoading={completingId === order.id}
                />
              </Tooltip>
            </HStack>
            <HStack spacing={1}>
              <Tooltip label="Generate invoice">
                <IconButton
                  aria-label="Generate invoice"
                  icon={<MdPrint />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleGenerateInvoice(order)}
                />
              </Tooltip>
              <Tooltip label="Delete work order">
                <IconButton
                  aria-label="Delete work order"
                  icon={<MdDelete />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => openDeleteDialog(order)}
                  isDisabled={isDeleting}
                />
              </Tooltip>
            </HStack>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <AppShell
      title="Work Orders"
      inventoryAlertsCount={summary?.inventoryAlertsCount}
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Work Orders' }
      ]}
      actions={
        <Button 
          colorScheme="brand" 
          onClick={handleSubmit} 
          isLoading={isCreating}
          size={buttonSize}
          leftIcon={<MdAdd />}
        >
          Create Work Order
        </Button>
      }
    >
      <Stack spacing={6}>
        {/* Work Order Statistics */}
        {workOrderStats && (
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <StatCard 
              label="Total Orders" 
              value={workOrderStats.totalOrders}
              icon={MdAssignment}
              colorScheme="blue"
              size="sm"
            />
            <StatCard 
              label="In Progress" 
              value={workOrderStats.inProgressOrders}
              icon={MdBuild}
              colorScheme="orange"
              size="sm"
            />
            <StatCard 
              label="Pending" 
              value={workOrderStats.pendingOrders}
              icon={MdSchedule}
              colorScheme="orange"
              size="sm"
            />
            <StatCard 
              label="Total Revenue" 
              value={formatCurrency(workOrderStats.totalRevenue)}
              icon={MdAttachMoney}
              colorScheme="green"
              size="sm"
              isCurrency
            />
          </SimpleGrid>
        )}

        {/* Main Content Grid */}
        <Grid 
          templateColumns={{ 
            base: '1fr', 
            xl: gridColumns ? `repeat(${gridColumns}, 1fr)` : '1fr' 
          }} 
          gap={6}
        >
          {/* Left Column - Forms */}
          <GridItem>
            <Stack spacing={6}>
              {/* Customer Details Card */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader pb={4}>
                  <HStack spacing={3}>
                    <Icon as={FiUser} color={accentColor} boxSize={5} />
                    <Text fontSize="lg" fontWeight="semibold">Customer Details</Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedText} mt={1}>
                    Provide customer information. Existing customers will be automatically linked.
                  </Text>
                </CardHeader>
                <CardBody pt={0}>
                  {matchedCustomer && (
                    <Alert status="info" borderRadius="md" mb={4} size="sm">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="medium">Existing Customer Found</Text>
                        <Text fontSize="sm">
                          {combineName(matchedCustomer.firstName, matchedCustomer.lastName)} • {matchedCustomer.phone}
                        </Text>
                      </Box>
                    </Alert>
                  )}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Full Name</FormLabel>
                      <Input 
                        value={customerForm.fullName} 
                        onChange={handleCustomerFieldChange('fullName')} 
                        placeholder="e.g. Jane Smith" 
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Phone Number</FormLabel>
                      <Input 
                        value={customerForm.phone} 
                        onChange={handleCustomerFieldChange('phone')} 
                        placeholder="Contact number" 
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Email Address</FormLabel>
                      <Input 
                        type="email"
                        value={customerForm.email} 
                        onChange={handleCustomerFieldChange('email')} 
                        placeholder="Optional email" 
                      />
                    </FormControl>
                  </SimpleGrid>
                  <Text fontSize="sm" color={mutedText} mt={4}>
                    Need advanced customer management?{' '}
                    <Link as={RouterLink} to="/customers" color="brand.500" fontWeight="medium">
                      Open customer directory
                    </Link>
                  </Text>
                </CardBody>
              </Card>

              {/* Vehicle Details Card */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader pb={4}>
                  <HStack spacing={3}>
                    <Icon as={FaCar} color={accentColor} boxSize={5} />
                    <Text fontSize="lg" fontWeight="semibold">Vehicle Details</Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedText} mt={1}>
                    Enter vehicle information. Matching VIN will reuse existing records.
                  </Text>
                </CardHeader>
                <CardBody pt={0}>
                  {matchedVehicle && (
                    <Alert status="info" borderRadius="md" mb={4} size="sm">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="medium">Existing Vehicle Found</Text>
                        <Text fontSize="sm">
                          {matchedVehicle.year} {matchedVehicle.make} {matchedVehicle.model} • {matchedVehicle.vin}
                        </Text>
                      </Box>
                    </Alert>
                  )}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>VIN</FormLabel>
                      <Input 
                        value={vehicleForm.vin} 
                        onChange={handleVehicleFieldChange('vin')} 
                        placeholder="Vehicle Identification Number" 
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>License Plate</FormLabel>
                      <Input 
                        value={vehicleForm.licensePlate} 
                        onChange={handleVehicleFieldChange('licensePlate')} 
                        placeholder="Optional plate number" 
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Make</FormLabel>
                      <Input 
                        value={vehicleForm.make} 
                        onChange={handleVehicleFieldChange('make')} 
                        placeholder="Manufacturer" 
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Model</FormLabel>
                      <Input 
                        value={vehicleForm.model} 
                        onChange={handleVehicleFieldChange('model')} 
                        placeholder="Model" 
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Year</FormLabel>
                      <Input 
                        value={vehicleForm.year} 
                        onChange={handleVehicleFieldChange('year')} 
                        placeholder="Year" 
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Color</FormLabel>
                      <Input 
                        value={vehicleForm.color} 
                        onChange={handleVehicleFieldChange('color')} 
                        placeholder="Vehicle color" 
                      />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mt={4}>
                    <FormLabel>Vehicle Notes</FormLabel>
                    <Textarea 
                      value={vehicleForm.notes} 
                      onChange={handleVehicleFieldChange('notes')} 
                      placeholder="Optional notes (e.g. prior issues, special features)" 
                      rows={3} 
                    />
                  </FormControl>
                  <Text fontSize="sm" color={mutedText} mt={4}>
                    Manage the full vehicle roster from the{' '}
                    <Link as={RouterLink} to="/vehicles" color="brand.500" fontWeight="medium">
                      vehicles page
                    </Link>
                  </Text>
                </CardBody>
              </Card>
            </Stack>
          </GridItem>

          {/* Right Column - Job Details & Services */}
          <GridItem>
            <Stack spacing={6}>
              {/* Job Details Card */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader pb={4}>
                  <HStack spacing={3}>
                    <Icon as={MdCarRepair} color={accentColor} boxSize={5} />
                    <Text fontSize="lg" fontWeight="semibold">Job Details</Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedText} mt={1}>
                    Work orders start as active jobs and can be marked complete when finished.
                  </Text>
                </CardHeader>
                <CardBody pt={0}>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Work Description</FormLabel>
                      <Input 
                        value={description} 
                        onChange={(event) => setDescription(event.target.value)} 
                        placeholder="Brief summary of the work to be performed" 
                      />
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Arrival Date & Time</FormLabel>
                        <Input 
                          type="datetime-local" 
                          value={arrivalDate} 
                          onChange={(event) => setArrivalDate(event.target.value)} 
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Scheduled Date & Time</FormLabel>
                        <Input 
                          type="datetime-local" 
                          value={scheduledDate} 
                          onChange={(event) => setScheduledDate(event.target.value)} 
                        />
                      </FormControl>
                    </SimpleGrid>
                    <FormControl>
                      <FormLabel>Assign Technician</FormLabel>
                      <Select 
                        placeholder="Select technician (optional)" 
                        value={workerId} 
                        onChange={(event) => setWorkerId(event.target.value)}
                      >
                        {workerOptions.map((worker) => (
                          <option key={worker.id} value={worker.id}>
                            {worker.name} ({worker.totalJobs} jobs)
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Internal Notes</FormLabel>
                      <Textarea 
                        value={notes} 
                        onChange={(event) => setNotes(event.target.value)} 
                        placeholder="Private notes for the workshop team" 
                        rows={3} 
                      />
                    </FormControl>
                    
                    <Divider />
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>Parking Charge</FormLabel>
                        <NumberInput 
                          min={0} 
                          value={parkingCharge} 
                          onChange={(value) => setParkingCharge(value)} 
                          clampValueOnBlur={false}
                        >
                          <NumberInputField placeholder="0.00" />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Discount</FormLabel>
                        <NumberInput 
                          min={0} 
                          value={discount} 
                          onChange={(value) => setDiscount(value)} 
                          clampValueOnBlur={false}
                        >
                          <NumberInputField placeholder="0.00" />
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>

                    {/* Pricing Summary */}
                    <Card bg={useColorModeValue('gray.50', 'gray.700')} variant="outline">
                      <CardBody>
                        <Text fontWeight="semibold" mb={3}>Pricing Summary</Text>
                        <VStack align="stretch" spacing={2}>
                          <Flex justify="space-between">
                            <Text fontSize="sm">Labor:</Text>
                            <Text fontSize="sm" fontWeight="medium">{formatCurrency(serviceTotal)}</Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text fontSize="sm">Parts:</Text>
                            <Text fontSize="sm" fontWeight="medium">{formatCurrency(partsTotal)}</Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text fontSize="sm">Taxes (18%):</Text>
                            <Text fontSize="sm" fontWeight="medium">{formatCurrency(taxesValue)}</Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text fontSize="sm">Parking:</Text>
                            <Text fontSize="sm" fontWeight="medium">{formatCurrency(parkingChargeValue)}</Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text fontSize="sm">Discount:</Text>
                            <Text fontSize="sm" color={dangerColor}>-{formatCurrency(discountValue)}</Text>
                          </Flex>
                          <Divider />
                          <Flex justify="space-between">
                            <Text fontWeight="bold">Total:</Text>
                            <Text fontWeight="bold" color={accentColor} fontSize="lg">
                              {formatCurrency(grandTotal)}
                            </Text>
                          </Flex>
                        </VStack>
                      </CardBody>
                    </Card>
                  </Stack>
                </CardBody>
              </Card>

              {/* Services & Parts Card */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader pb={4}>
                  <HStack spacing={3}>
                    <Icon as={MdReceipt} color={accentColor} boxSize={5} />
                    <Text fontSize="lg" fontWeight="semibold">Services & Parts</Text>
                  </HStack>
                  <Text fontSize="sm" color={mutedText} mt={1}>
                    Add services and parts to this work order. Prices will be calculated automatically.
                  </Text>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={4}>
                    {lineItems.map((item) => (
                      <Card key={item.id} variant="outline" bg={useColorModeValue('gray.50', 'gray.700')}>
                        <CardBody>
                          <VStack align="stretch" spacing={4}>
                            <Flex justify="space-between" align="center">
                              <HStack spacing={3}>
                                <Icon 
                                  as={LINE_ITEM_TYPES.find(t => t.value === item.type)?.icon} 
                                  color={accentColor} 
                                  boxSize={4} 
                                />
                                <Text fontWeight="medium">Line Item {item.id}</Text>
                              </HStack>
                              <IconButton
                                aria-label="Remove line item"
                                size="sm"
                                icon={<MdRemove />}
                                onClick={() => removeLineItem(item.id)}
                                isDisabled={lineItems.length === 1}
                                colorScheme="red"
                                variant="ghost"
                              />
                            </Flex>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                              <FormControl>
                                <FormLabel>Type</FormLabel>
                                <Select 
                                  value={item.type} 
                                  onChange={(event) => handleLineItemChange(item.id, 'type', event.target.value as LineItemType)}
                                >
                                  {LINE_ITEM_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel>Item Name</FormLabel>
                                <Input
                                  list={`line-item-${item.id}`}
                                  value={item.name}
                                  onChange={(event) => handleLineItemChange(item.id, 'name', event.target.value)}
                                  placeholder={item.type === 'SERVICE' ? 'Service name' : 'Part name'}
                                />
                                <datalist id={`line-item-${item.id}`}>
                                  {(item.type === 'SERVICE' ? serviceOptions : inventoryOptions).map((option) => (
                                    <option key={option.id} value={option.name} />
                                  ))}
                                </datalist>
                              </FormControl>
                              <FormControl>
                                <FormLabel>Quantity</FormLabel>
                                <NumberInput
                                  min={1}
                                  value={item.quantity}
                                  onChange={(_, valueNumber) => {
                                    const safeValue = Number.isFinite(valueNumber) ? Math.max(1, valueNumber) : item.quantity;
                                    handleLineItemChange(item.id, 'quantity', safeValue);
                                  }}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                              <FormControl>
                                <FormLabel>Unit Price</FormLabel>
                                <NumberInput
                                  min={0}
                                  precision={2}
                                  value={item.unitPrice}
                                  onChange={(value) => handleLineItemChange(item.id, 'unitPrice', value)}
                                >
                                  <NumberInputField placeholder="0.00" />
                                </NumberInput>
                              </FormControl>
                            </SimpleGrid>
                            <Flex justify="space-between" align="center" pt={2}>
                              <Text fontSize="sm" color={mutedText}>
                                {item.type === 'SERVICE' ? 'Service' : 'Part'} • {item.quantity} × {formatCurrency(Number(item.unitPrice) || 0)}
                              </Text>
                              <Text fontWeight="semibold">
                                {formatCurrency(item.quantity * (Number(item.unitPrice) || 0))}
                              </Text>
                            </Flex>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                    <Button 
                      variant="outline" 
                      leftIcon={<MdAdd />} 
                      onClick={addLineItem} 
                      alignSelf="flex-start"
                      size={buttonSize}
                    >
                      Add Line Item
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </Stack>
          </GridItem>
        </Grid>

        {/* Active Work Orders Section */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={3}>
                <Icon as={MdAssignment} color={accentColor} boxSize={6} />
                <Text fontSize="xl" fontWeight="semibold">Active Work Orders</Text>
              </HStack>
              <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                {workOrderList.length} active
              </Badge>
            </Flex>
            <Text fontSize="sm" color={mutedText} mt={2}>
              Manage active work orders. Mark jobs as complete once delivered to customers.
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            {/* Loading State */}
            {isLoading && (
              <Box overflowX="auto">
                <Table variant={tableVariant}>
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>Code</Th>
                      <Th>Status</Th>
                      <Th>Customer</Th>
                      <Th>Vehicle</Th>
                      <Th>Arrival</Th>
                      <Th isNumeric>Total</Th>
                      <Th>Assigned To</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <WorkOrderRowSkeleton key={index} />
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <Text fontWeight="semibold">Unable to load work orders</Text>
                  <Text fontSize="sm" mt={1}>
                    {error instanceof Error ? error.message : 'Please check your connection and try again.'}
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !error && workOrderList.length === 0 && (
              <Box textAlign="center" py={12}>
                <Icon as={MdAssignment} boxSize={12} color={mutedText} mb={4} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  No active work orders
                </Text>
                <Text color={mutedText} mb={6}>
                  Create your first work order using the form above to get started
                </Text>
                <Button 
                  colorScheme="brand" 
                  onClick={handleSubmit}
                  leftIcon={<MdAdd />}
                  isLoading={isCreating}
                >
                  Create First Work Order
                </Button>
              </Box>
            )}

            {/* Work Orders List */}
            {!isLoading && !error && workOrderList.length > 0 && (
              <>
                {/* Mobile Card View */}
                {showCompactTable ? (
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    {workOrderList.map((order) => (
                      <WorkOrderCard key={order.id} order={order} />
                    ))}
                  </SimpleGrid>
                ) : (
                  /* Desktop Table View */
                  <Table variant={tableVariant}>
                    <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                      <Tr>
                        <Th>Code</Th>
                        <Th>Status</Th>
                        <Th>Customer</Th>
                        <Th>Vehicle</Th>
                        <Th>Arrival</Th>
                        <Th isNumeric>Total</Th>
                        <Th>Assigned To</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {workOrderList.map((order) => (
                        <Tr 
                          key={order.id}
                          _hover={{ bg: hoverBg }}
                          transition="background 0.2s"
                          cursor="pointer"
                          onClick={() => openEditDrawer(order)}
                        >
                          <Td fontWeight="medium" color={accentColor}>
                            {order.code}
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                order.status === WorkOrderStatus.COMPLETED
                                  ? 'green'
                                  : order.status === WorkOrderStatus.IN_PROGRESS
                                  ? 'blue'
                                  : 'orange'
                              }
                              variant="subtle"
                              fontSize="sm"
                            >
                              {order.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Avatar 
                                size="xs" 
                                name={order.customer ? combineName(order.customer.firstName, order.customer.lastName) : 'Unknown'}
                                bg="brand.500"
                              />
                              <Text>
                                {order.customer ? combineName(order.customer.firstName, order.customer.lastName) : 'Unassigned'}
                              </Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Text fontWeight="medium">
                              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                            </Text>
                            <Text fontSize="sm" color={mutedText}>
                              {order.vehicle.licensePlate || 'No plate'}
                            </Text>
                          </Td>
                          <Td>
                            {new Date(order.arrivalDate ?? order.createdAt).toLocaleDateString()}
                            <Text fontSize="sm" color={mutedText}>
                              {new Date(order.arrivalDate ?? order.createdAt).toLocaleTimeString()}
                            </Text>
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {formatCurrency(Number(order.totalCost))}
                          </Td>
                          <Td>
                            {order.assignments.length === 0 ? (
                              <Text fontSize="sm" color={mutedText}>Unassigned</Text>
                            ) : (
                              <Wrap spacing={1}>
                                {order.assignments.map((assignment) => (
                                  <WrapItem key={assignment.id}>
                                    <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                      {assignment.worker.name}
                                    </Badge>
                                  </WrapItem>
                                ))}
                              </Wrap>
                            )}
                          </Td>
                          <Td>
                            <HStack justify="flex-end" spacing={1}>
                              <Tooltip label="Edit work order">
                                <IconButton
                                  aria-label="Edit work order"
                                  icon={<MdEdit />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDrawer(order);
                                  }}
                                />
                              </Tooltip>
                              <Tooltip label="Mark as completed">
                                <IconButton
                                  aria-label="Mark work order as completed"
                                  icon={<MdCheckCircle />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteWorkOrder(order);
                                  }}
                                  isDisabled={isCompleting}
                                  isLoading={completingId === order.id}
                                />
                              </Tooltip>
                              <Tooltip label="Generate invoice">
                                <IconButton
                                  aria-label="Generate invoice"
                                  icon={<MdPrint />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateInvoice(order);
                                  }}
                                />
                              </Tooltip>
                              <Tooltip label="Delete work order">
                                <IconButton
                                  aria-label="Delete work order"
                                  icon={<MdDelete />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(order);
                                  }}
                                  isDisabled={isDeleting}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </Stack>

      {/* Edit Drawer */}
      <Drawer 
        isOpen={editDisclosure.isOpen} 
        placement="right" 
        onClose={closeEditDrawer} 
        size={drawerSize}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack spacing={3}>
              <Icon as={MdEdit} color={accentColor} />
              <Text>Edit Work Order</Text>
            </HStack>
            {editingOrder && (
              <Text fontSize="sm" color={mutedText} mt={1} fontWeight="normal">
                {editingOrder.code} • {editingOrder.vehicle.year} {editingOrder.vehicle.make} {editingOrder.vehicle.model}
              </Text>
            )}
          </DrawerHeader>
          <DrawerBody>
            {editingOrder ? (
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input 
                    value={editFormState.description} 
                    onChange={(event) => handleEditFieldChange('description')(event.target.value)} 
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    value={editFormState.status} 
                    onChange={(event) => handleEditFieldChange('status')(event.target.value)}
                  >
                    {Object.values(WorkOrderStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Arrival Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={editFormState.arrivalDate}
                    onChange={(event) => handleEditFieldChange('arrivalDate')(event.target.value)}
                  />
                </FormControl>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <Input
                      type="datetime-local"
                      value={editFormState.scheduledDate}
                      onChange={(event) => handleEditFieldChange('scheduledDate')(event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Completed Date & Time</FormLabel>
                    <Input
                      type="datetime-local"
                      value={editFormState.completedDate}
                      onChange={(event) => handleEditFieldChange('completedDate')(event.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Labour Cost</FormLabel>
                    <NumberInput 
                      min={0} 
                      value={editFormState.laborCost} 
                      onChange={(value) => handleEditFieldChange('laborCost')(value)}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Parts Cost</FormLabel>
                    <NumberInput 
                      min={0} 
                      value={editFormState.partsCost} 
                      onChange={(value) => handleEditFieldChange('partsCost')(value)}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Parking Charge</FormLabel>
                    <NumberInput 
                      min={0} 
                      value={editFormState.parkingCharge} 
                      onChange={(value) => handleEditFieldChange('parkingCharge')(value)}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Discount</FormLabel>
                    <NumberInput 
                      min={0} 
                      value={editFormState.discount} 
                      onChange={(value) => handleEditFieldChange('discount')(value)}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea 
                    value={editFormState.notes} 
                    onChange={(event) => handleEditFieldChange('notes')(event.target.value)} 
                    rows={4}
                  />
                </FormControl>
              </VStack>
            ) : (
              <Text color={mutedText}>Select a work order to update.</Text>
            )}
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={closeEditDrawer}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleSubmitEdit} 
              isLoading={isUpdating} 
              isDisabled={!editingOrder}
            >
              Save Changes
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        onClose={closeDeleteDialog}
        leastDestructiveRef={cancelDeleteRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              <HStack spacing={2}>
                <Icon as={MdWarning} color="red.500" />
                <Text>Delete Work Order</Text>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody>
              {workOrderPendingDelete && (
                <VStack align="stretch" spacing={3}>
                  <Text>
                    Are you sure you want to delete work order <strong>{workOrderPendingDelete.code}</strong>?
                  </Text>
                  <Text color={mutedText}>
                    This will permanently remove the work order record and all associated assignments. 
                    This action cannot be undone.
                  </Text>
                  <Alert status="warning" size="sm" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      This work order has {workOrderPendingDelete.assignments.length} assignment(s) and {workOrderPendingDelete.lineItems?.length || 0} line item(s) that will also be removed.
                    </Text>
                  </Alert>
                </VStack>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog} size="sm">
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteWorkOrder} 
                ml={3} 
                isLoading={isDeleting}
                size="sm"
              >
                Delete Work Order
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
};