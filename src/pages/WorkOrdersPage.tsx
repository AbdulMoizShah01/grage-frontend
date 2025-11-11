
import { ChangeEvent, useMemo, useRef, useState } from 'react';
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
  useToast
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { MdAdd, MdCheckCircle, MdPrint, MdRemove } from 'react-icons/md';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';

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

const LINE_ITEM_TYPES = [
  { value: 'SERVICE', label: 'Service' },
  { value: 'PART', label: 'Part' }
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
  quantity: 0,
  unitPrice: '',
  catalogId: ''
});

const customerInitialState = {
  fullName: '',
  phone: ''
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

export const WorkOrdersPage = () => {
  const toast = useToast();
  const lineItemIdRef = useRef(2);

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
        const quantityValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
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
      toast({ status: 'warning', title: 'Provide the customer full name.' });
      return;
    }

    if (!customerForm.phone.trim()) {
      toast({ status: 'warning', title: 'Customer phone number is required.' });
      return;
    }

    if (!vehicleForm.vin.trim()) {
      toast({ status: 'warning', title: 'VIN is required to register the vehicle.' });
      return;
    }

    if (!vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      toast({ status: 'warning', title: 'Vehicle make and model are required.' });
      return;
    }

    if (!description.trim()) {
      toast({ status: 'warning', title: 'Add a short description for the work order.' });
      return;
    }

    if (!lineItems.length) {
      toast({ status: 'warning', title: 'Add at least one service or part to the quotation.' });
      return;
    }

    if (lineItems.some((item) => !item.name.trim())) {
      toast({ status: 'warning', title: 'Each line item needs a name.' });
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
          title: 'Vehicle already assigned',
          description:
            'The VIN you entered is associated with a different customer. Adjust the details or update the vehicle record first.'
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
      toast({ status: 'success', title: 'Work order created successfully.' });
      resetForm();
    } catch (submitError) {
      toast({
        status: 'error',
        title: 'Unable to create the work order.',
        description: submitError instanceof Error ? submitError.message : 'Please try again.'
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
      toast({ status: 'success', title: 'Work order updated.' });
      closeEditDrawer();
    } catch (error) {
      toast({
        status: 'error',
        title: 'Unable to update work order.',
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    }
  };
    const handleGenerateInvoice = async (order: WorkOrder) => {
    try {
      const invoiceName = buildInvoiceCode(order).replace(/\//g, '-');
      await downloadInvoice(order.id, invoiceName);
      toast({ status: 'success', title: 'Invoice ready for download.' });
    } catch (error) {
      toast({
        status: 'error',
        title: 'Unable to generate invoice.',
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    }
  };

  const handleCompleteWorkOrder = async (order: WorkOrder) => {
    try {
      setCompletingId(order.id);
      await completeWorkOrder(order.id);
      toast({
        status: 'success',
        title: `${order.code} marked as completed`,
        description: 'You can find it in Work Order History.'
      });
    } catch (completeError) {
      toast({
        status: 'error',
        title: 'Unable to mark work order as completed',
        description: completeError instanceof Error ? completeError.message : 'Please try again.'
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
        description: `${workOrderPendingDelete.code} has been removed.`
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to delete work order',
        description:
          deleteError instanceof Error ? deleteError.message : 'Resolve linked assignments and try again.'
      });
    }
  };
  return (
    <AppShell
      title="Active Work Orders"
      actions={
        <Button colorScheme="brand" onClick={handleSubmit} isLoading={isCreating}>
          Create Work Order
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6} mb={6}>
        <Stack spacing={6}>
          <Box bg={useColorModeValue('surface.base', '#121212')} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')} p={6}>
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Customer Details
            </Text>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={4}>
              Provide the customer details once. If the phone number matches an existing customer, this work order will be linked automatically.
            </Text>
            {matchedCustomer ? (
              <Badge colorScheme="green" borderRadius="md" mb={4} w="fit-content">
                Existing customer detected: {combineName(matchedCustomer.firstName, matchedCustomer.lastName)}
              </Badge>
            ) : null}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input value={customerForm.fullName} onChange={handleCustomerFieldChange('fullName')} placeholder="e.g. Jane Smith" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Phone</FormLabel>
                <Input value={customerForm.phone} onChange={handleCustomerFieldChange('phone')} placeholder="Contact number" />
              </FormControl>
            </SimpleGrid>
            <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.500')} mt={6}>
              Need advanced customer management?{' '}
              <Link as={RouterLink} to="/customers" color="brand.500">
                Open the customer directory
              </Link>
              .
            </Text>
          </Box>

          <Box bg={useColorModeValue('surface.base', '#121212')} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')} p={6}>
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Vehicle Details
            </Text>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={4}>
              Enter the vehicle information. A matching VIN will re-use the existing record.
            </Text>
            {matchedVehicle ? (
              <Badge colorScheme="blue" borderRadius="md" mb={4} w="fit-content">
                Existing vehicle detected: {matchedVehicle.year} {matchedVehicle.make} {matchedVehicle.model}
              </Badge>
            ) : null}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>VIN</FormLabel>
                <Input value={vehicleForm.vin} onChange={handleVehicleFieldChange('vin')} placeholder="Vehicle Identification Number" />
              </FormControl>
              <FormControl>
                <FormLabel>License Plate</FormLabel>
                <Input value={vehicleForm.licensePlate} onChange={handleVehicleFieldChange('licensePlate')} placeholder="Optional plate number" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Make</FormLabel>
                <Input value={vehicleForm.make} onChange={handleVehicleFieldChange('make')} placeholder="Manufacturer" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Model</FormLabel>
                <Input value={vehicleForm.model} onChange={handleVehicleFieldChange('model')} placeholder="Model" />
              </FormControl>
              <FormControl>
                <FormLabel>Year</FormLabel>
                <Input value={vehicleForm.year} onChange={handleVehicleFieldChange('year')} placeholder="Year" />
              </FormControl>
              <FormControl>
                <FormLabel>Color</FormLabel>
                <Input value={vehicleForm.color} onChange={handleVehicleFieldChange('color')} />
              </FormControl>
              <FormControl>
                <FormLabel>Vehicle Notes</FormLabel>
                <Textarea value={vehicleForm.notes} onChange={handleVehicleFieldChange('notes')} placeholder="Optional notes (e.g. prior issues)" rows={3} />
              </FormControl>
            </SimpleGrid>
            <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.500')} mt={6}>
              Manage the full vehicle roster from the{' '}
              <Link as={RouterLink} to="/vehicles" color="brand.500">
                vehicles page
              </Link>
              .
            </Text>
          </Box>
        </Stack>

        <Box bg={useColorModeValue('surface.base', '#121212')} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')} p={6}>
          <Text fontSize="lg" fontWeight="semibold" mb={4}>
            Job Details
          </Text>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={4}>
            Work orders start as active jobs. You can mark them as completed from the table below once the task is finished.
          </Text>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Summary of the work" />
            </FormControl>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Arrival</FormLabel>
                <Input type="datetime-local" value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Scheduled</FormLabel>
                <Input type="datetime-local" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel>Assign Worker</FormLabel>
              <Select placeholder="Optional" value={workerId} onChange={(event) => setWorkerId(event.target.value)}>
                {workerOptions.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} ({worker.totalJobs} jobs)
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Internal Notes</FormLabel>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Private notes for the workshop team" rows={3} />
            </FormControl>
            <Divider />
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Parking Charge</FormLabel>
                <NumberInput min={0} value={parkingCharge} onChange={(value) => setParkingCharge(value)} clampValueOnBlur={false}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Discount</FormLabel>
                <NumberInput min={0} value={discount} onChange={(value) => setDiscount(value)} clampValueOnBlur={false}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
            <Box borderWidth="1px" borderRadius="lg" borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')} p={4} bg={useColorModeValue('gray.50', 'whiteAlpha.100')}>
              <Text fontWeight="medium" mb={1}>
                Summary
              </Text>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Labour: {formatCurrency(serviceTotal)} | Parts: {formatCurrency(partsTotal)}
              </Text>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Taxes: {formatCurrency(taxesValue)} | Parking: {formatCurrency(parkingChargeValue)}
              </Text>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={2}>
                Discount: {formatCurrency(discountValue)}
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="brand.600">
                Total: {formatCurrency(grandTotal)}
              </Text>
            </Box>
          </Stack>
        </Box>
      </SimpleGrid>
      <Box bg={useColorModeValue('surface.base', '#121212')} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')} p={6} mb={6}>
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Services & Parts
        </Text>
        <VStack align="stretch" spacing={4}>
          {lineItems.map((item) => (
            <Box key={item.id} borderWidth="1px" borderRadius="lg" borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')} p={4}>
              <HStack justify="space-between" mb={3}>
                <Text fontWeight="medium">Line {item.id}</Text>
                <IconButton
                  aria-label="Remove"
                  size="sm"
                  icon={<MdRemove />}
                  onClick={() => removeLineItem(item.id)}
                  isDisabled={lineItems.length === 1}
                />
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select value={item.type} onChange={(event) => handleLineItemChange(item.id, 'type', event.target.value as LineItemType)}>
                    {LINE_ITEM_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Item</FormLabel>
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
                    min={0}
                    value={item.quantity}
                    onChange={(_, valueNumber) => {
                      const safeValue = Number.isFinite(valueNumber) ? Math.max(0, valueNumber) : item.quantity;
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
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </Box>
          ))}
          <Button variant="outline" leftIcon={<MdAdd />} onClick={addLineItem} alignSelf="flex-start">
            Add
          </Button>
        </VStack>
      </Box>
      <Box bg={useColorModeValue('surface.base', '#121212')} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')} p={6}>
        <HStack justify="space-between" mb={4}>
          <Text fontSize="lg" fontWeight="semibold">
            Active Work Orders
          </Text>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
            Mark jobs complete once they have been delivered to the customer.
          </Text>
        </HStack>
        <Table>
          <Thead bg={useColorModeValue('gray.50', 'whiteAlpha.100')}>
            <Tr>
              <Th>Code</Th>
              <Th>Status</Th>
              <Th>Customer</Th>
              <Th>Vehicle</Th>
              <Th>Arrival</Th>
              <Th isNumeric>Total</Th>
              <Th>Workers</Th>
              <Th textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={8}>
                  <Spinner />
                </Td>
              </Tr>
            ) : error ? (
              <Tr>
                <Td colSpan={8}>
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    Failed to load work orders
                  </Alert>
                </Td>
              </Tr>
            ) : workOrderList.length === 0 ? (
              <Tr>
                <Td colSpan={8}>
                  <Text color={useColorModeValue('gray.600', 'gray.400')}>
                    No active work orders. Capture one above to get started.
                  </Text>
                </Td>
              </Tr>
            ) : (
              workOrderList.map((order) => (
                <Tr key={order.id}>
                  <Td>{order.code}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        order.status === WorkOrderStatus.COMPLETED
                          ? 'green'
                          : order.status === WorkOrderStatus.IN_PROGRESS
                          ? 'blue'
                          : 'orange'
                      }
                    >
                      {order.status}
                    </Badge>
                  </Td>
                  <Td>{order.customer ? combineName(order.customer.firstName, order.customer.lastName) : 'Unassigned'}</Td>
                  <Td>
                    {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                  </Td>
                  <Td>{new Date(order.arrivalDate ?? order.createdAt).toLocaleString()}</Td>
                  <Td isNumeric>{formatCurrency(Number(order.totalCost))}</Td>
                  <Td>
                    {order.assignments.length === 0
                      ? '�'
                      : order.assignments.map((assignment) => assignment.worker.name).join(', ')}
                  </Td>
                  <Td>
                    <HStack justify="flex-end" spacing={2}>
                      <Tooltip label="Edit work order">
                        <IconButton aria-label="Edit work order" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => openEditDrawer(order)} />
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
                      <Tooltip label="Generate invoice">
                        <IconButton
                          aria-label="Generate invoice"
                          icon={<MdPrint />}
                          size="sm"
                          onClick={() => handleGenerateInvoice(order)}
                        />
                      </Tooltip>
                      <Tooltip label="Delete work order">
                        <IconButton
                          aria-label="Delete work order"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => openDeleteDialog(order)}
                          isDisabled={isDeleting}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
      <Drawer isOpen={editDisclosure.isOpen} placement="right" onClose={closeEditDrawer} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Edit Work Order</DrawerHeader>
          <DrawerBody>
            {editingOrder ? (
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input value={editFormState.description} onChange={(event) => handleEditFieldChange('description')(event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select value={editFormState.status} onChange={(event) => handleEditFieldChange('status')(event.target.value)}>
                    {Object.values(WorkOrderStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Arrival</FormLabel>
                  <Input
                    type="datetime-local"
                    value={editFormState.arrivalDate}
                    onChange={(event) => handleEditFieldChange('arrivalDate')(event.target.value)}
                  />
                </FormControl>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Scheduled</FormLabel>
                    <Input
                      type="datetime-local"
                      value={editFormState.scheduledDate}
                      onChange={(event) => handleEditFieldChange('scheduledDate')(event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Completed</FormLabel>
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
                    <NumberInput min={0} value={editFormState.laborCost} onChange={(value) => handleEditFieldChange('laborCost')(value)}>
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Parts Cost</FormLabel>
                    <NumberInput min={0} value={editFormState.partsCost} onChange={(value) => handleEditFieldChange('partsCost')(value)}>
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Parking Charge</FormLabel>
                    <NumberInput min={0} value={editFormState.parkingCharge} onChange={(value) => handleEditFieldChange('parkingCharge')(value)}>
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Discount</FormLabel>
                    <NumberInput min={0} value={editFormState.discount} onChange={(value) => handleEditFieldChange('discount')(value)}>
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea value={editFormState.notes} onChange={(event) => handleEditFieldChange('notes')(event.target.value)} />
                </FormControl>
              </VStack>
            ) : (
              <Text color={useColorModeValue('gray.600', 'gray.400')}>Select a work order to update.</Text>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" mr={3} onClick={closeEditDrawer}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleSubmitEdit} isLoading={isUpdating} isDisabled={!editingOrder}>
              Save changes
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        onClose={closeDeleteDialog}
        leastDestructiveRef={cancelDeleteRef}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Work Order
            </AlertDialogHeader>
            <AlertDialogBody>
              {workOrderPendingDelete
                ? `Delete ${workOrderPendingDelete.code}? This will remove the record and related assignments.`
                : 'Are you sure you want to delete this work order?'}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteWorkOrder} ml={3} isLoading={isDeleting}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
};
