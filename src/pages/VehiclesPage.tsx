import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Table,
  Tbody,
  Tr,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { FormModal } from '../components/forms/FormModal';
import { useVehicles } from '../hooks/useVehicles';
import { useCustomers } from '../hooks/useCustomers';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { Vehicle } from '../types/api';

const initialForm = {
  vin: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  customerId: ''
};

export const VehiclesPage = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const {
    data: vehicles,
    isLoading,
    error,
    createVehicle,
    isCreating,
    deleteVehicle,
    isDeleting
  } = useVehicles();
  const {
    data: customerData,
    isLoading: isCustomersLoading,
    error: customersError
  } = useCustomers();
  const { data: summary } = useDashboardSummary();
  const createDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const [formState, setFormState] = useState(initialForm);
  const [vehiclePendingDelete, setVehiclePendingDelete] = useState<Vehicle | null>(null);

  const vehicleList = useMemo(() => vehicles ?? [], [vehicles]);
  const customers = useMemo(() => customerData ?? [], [customerData]);

  const handleChange =
    (field: keyof typeof initialForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((previous) => ({ ...previous, [field]: event.target.value }));
    };

  const resetForm = () => setFormState(initialForm);

  const handleSubmit = async () => {
    if (!formState.customerId) {
      toast({
        status: 'warning',
        title: 'Customer required',
        description: 'Select the vehicle owner before saving.'
      });
      return;
    }

    const payload = {
      vin: formState.vin.trim(),
      make: formState.make.trim(),
      model: formState.model.trim(),
      year: Number(formState.year),
      licensePlate: formState.licensePlate.trim() || undefined,
      customerId: Number(formState.customerId)
    };

    try {
      await createVehicle(payload);
      resetForm();
      createDisclosure.onClose();
      toast({
        status: 'success',
        title: 'Vehicle added',
        description: `${payload.year} ${payload.make} ${payload.model} is now tracked.`
      });
    } catch (submitError) {
      toast({
        status: 'error',
        title: 'Unable to add vehicle',
        description: submitError instanceof Error ? submitError.message : 'Please try again.'
      });
    }
  };

  const openDeleteDialog = (vehicle: Vehicle) => {
    setVehiclePendingDelete(vehicle);
    deleteDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setVehiclePendingDelete(null);
  };

  const handleDelete = async () => {
    if (!vehiclePendingDelete) {
      return;
    }

    try {
      await deleteVehicle(vehiclePendingDelete.id);
      toast({
        status: 'success',
        title: 'Vehicle removed',
        description: `${vehiclePendingDelete.year} ${vehiclePendingDelete.make} ${vehiclePendingDelete.model} has been removed.`
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove vehicle',
        description:
          deleteError instanceof Error
            ? deleteError.message
            : 'Ensure the vehicle is not attached to open work orders before deleting.'
      });
    }
  };

  return (
    <AppShell
      title="Vehicles"
      actions={
        <Button colorScheme="brand" onClick={createDisclosure.onOpen}>
          Add Vehicle
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Failed to load vehicles
        </Alert>
      ) : (
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <Table>
            <Thead bg={headerBg}>
              <Tr>
                <Th>Vehicle</Th>
                <Th>VIN</Th>
                <Th>Customer</Th>
                <Th>Plate</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {vehicleList.length === 0 ? (
                <Tr>
                  <Td colSpan={5}>
                    <Text color={mutedText}>No vehicles recorded yet.</Text>
                  </Td>
                </Tr>
              ) : (
                vehicleList.map((vehicle) => (
                  <Tr key={vehicle.id}>
                    <Td>
                      <Text fontWeight="medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Text>
                      {vehicle.licensePlate ? (
                        <Text fontSize="sm" color={mutedText}>
                          Plate: {vehicle.licensePlate}
                        </Text>
                      ) : null}
                    </Td>
                    <Td>{vehicle.vin}</Td>
                    <Td>
                      {vehicle.customer
                        ? `${vehicle.customer.firstName} ${vehicle.customer.lastName}`
                        : 'Unassigned'}
                    </Td>
                    <Td>{vehicle.licensePlate ?? '-'}</Td>
                    <Td>
                      <Tooltip label="Remove vehicle">
                        <IconButton
                          aria-label="Remove vehicle"
                          icon={<FiTrash2 />}
                          variant="ghost"
                          colorScheme="red"
                          size="sm"
                          onClick={() => openDeleteDialog(vehicle)}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      <FormModal
        isOpen={createDisclosure.isOpen}
        onClose={() => {
          resetForm();
          createDisclosure.onClose();
        }}
        title="Add Vehicle"
        isSubmitting={isCreating}
        onSubmit={handleSubmit}
      >
        <VStack spacing={4}>
          <HStack spacing={4} width="100%">
            <FormControl isRequired>
              <FormLabel>VIN</FormLabel>
              <Input value={formState.vin} onChange={handleChange('vin')} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Customer</FormLabel>
              <Select
                placeholder="Select customer"
                value={formState.customerId}
                onChange={(event) => setFormState((previous) => ({ ...previous, customerId: event.target.value }))}
                isDisabled={isCustomersLoading || Boolean(customersError)}
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </Select>
            </FormControl>
          </HStack>
          <HStack spacing={4} width="100%">
            <FormControl isRequired>
              <FormLabel>Make</FormLabel>
              <Input value={formState.make} onChange={handleChange('make')} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Model</FormLabel>
              <Input value={formState.model} onChange={handleChange('model')} />
            </FormControl>
          </HStack>
          <HStack spacing={4} width="100%">
            <FormControl isRequired>
              <FormLabel>Year</FormLabel>
              <NumberInput
                value={formState.year}
                min={1900}
                max={new Date().getFullYear() + 1}
                onChange={(_, valueNumber) =>
                  setFormState((previous) => ({ ...previous, year: valueNumber || previous.year }))
                }
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>License Plate</FormLabel>
              <Input value={formState.licensePlate} onChange={handleChange('licensePlate')} />
            </FormControl>
          </HStack>
        </VStack>
      </FormModal>

      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        onClose={closeDeleteDialog}
        leastDestructiveRef={cancelDeleteRef}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Vehicle
            </AlertDialogHeader>
            <AlertDialogBody>
              {vehiclePendingDelete
                ? `Delete ${vehiclePendingDelete.year} ${vehiclePendingDelete.make} ${vehiclePendingDelete.model}? This action cannot be undone.`
                : 'Are you sure you want to remove this vehicle?'}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isDeleting}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
};
