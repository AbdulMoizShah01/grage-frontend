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
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  TagLabel,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { useMetadata, MetadataInput } from '../hooks/useMetadata';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { MetadataRecord } from '../types/api';
import { FormModal } from '../components/forms/FormModal';
import { formatCurrency } from '../utils/formatting';

const initialFormState: MetadataInput = {
  customer: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    notes: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: ''
  },
  vehicle: {
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    mileage: undefined,
    color: '',
    engine: '',
    notes: ''
  }
};

const sanitizeNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const MetadataPage = () => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState(initialFormState);
  const [recordBeingEdited, setRecordBeingEdited] = useState<MetadataRecord | null>(null);
  const deleteDisclosure = useDisclosure();
  const formDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const [recordPendingDelete, setRecordPendingDelete] = useState<MetadataRecord | null>(null);

  const { data, isLoading, error, createMetadata, isCreating, updateMetadata, isUpdating, deleteMetadata, isDeleting } =
    useMetadata(searchTerm);
  const { data: summary } = useDashboardSummary();
  const records = useMemo(() => data ?? [], [data]);
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const mutedText = useColorModeValue('gray.500', 'gray.400');

  const resetForm = () => {
    setFormState(initialFormState);
    setRecordBeingEdited(null);
  };

  const openCreateModal = () => {
    resetForm();
    formDisclosure.onOpen();
  };

  const openEditModal = (record: MetadataRecord) => {
    setRecordBeingEdited(record);
    setFormState({
      customer: {
        firstName: record.customer.firstName,
        lastName: record.customer.lastName,
        phone: record.customer.phone,
        email: record.customer.email ?? '',
        company: record.customer.company ?? '',
        notes: record.customer.notes ?? '',
        addressLine1: record.customer.addressLine1 ?? '',
        addressLine2: record.customer.addressLine2 ?? '',
        city: record.customer.city ?? '',
        state: record.customer.state ?? '',
        postalCode: record.customer.postalCode ?? ''
      },
      vehicle: {
        vin: record.vehicle.vin,
        make: record.vehicle.make,
        model: record.vehicle.model,
        year: record.vehicle.year,
        licensePlate: record.vehicle.licensePlate ?? '',
        mileage: record.vehicle.mileage ?? undefined,
        color: record.vehicle.color ?? '',
        engine: record.vehicle.engine ?? '',
        notes: record.vehicle.notes ?? ''
      }
    });
    formDisclosure.onOpen();
  };

  const handleFormChange =
    (section: 'customer' | 'vehicle', field: string) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormState((previous) => ({
        ...previous,
        [section]: {
          ...previous[section],
          [field]:
            section === 'vehicle' && field === 'year'
              ? Number(value)
              : section === 'vehicle' && field === 'mileage'
              ? sanitizeNumber(value)
              : value
        }
      }));
    };

  const handleSubmit = async () => {
    try {
      if (recordBeingEdited) {
        await updateMetadata({
          vehicleId: recordBeingEdited.vehicle.id,
          payload: formState
        });
        toast({ status: 'success', title: 'Metadata updated.' });
      } else {
        await createMetadata(formState);
        toast({ status: 'success', title: 'Metadata added.' });
      }
      formDisclosure.onClose();
      resetForm();
    } catch (submitError) {
      toast({
        status: 'error',
        title: 'Unable to save metadata.',
        description: submitError instanceof Error ? submitError.message : 'Please try again.'
      });
    }
  };

  const openDeleteDialog = (record: MetadataRecord) => {
    setRecordPendingDelete(record);
    deleteDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setRecordPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!recordPendingDelete) {
      return;
    }

    try {
      await deleteMetadata(recordPendingDelete.vehicle.id);
      toast({ status: 'success', title: 'Metadata deleted.' });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to delete metadata.',
        description: deleteError instanceof Error ? deleteError.message : 'Please try again.'
      });
    }
  };

  return (
    <AppShell
      title="Metadata"
      inventoryAlertsCount={summary?.inventoryAlertsCount}
      actions={
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={openCreateModal}>
          Add Metadata
        </Button>
      }
    >
      <Stack spacing={4}>
        <InputGroup maxW="360px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="var(--chakra-colors-gray-400)" />
          </InputLeftElement>
          <Input
            placeholder="Search by customer name, plate, VIN, make, model, or year"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </InputGroup>

        {isLoading ? (
          <Spinner />
        ) : error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            Unable to load metadata records.
          </Alert>
        ) : records.length === 0 ? (
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={8}>
            <Text color={mutedText}>No metadata records found. Add one to get started.</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {records.map((record) => (
              <Box key={record.id} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
                <HStack justify="space-between" mb={4}>
                  <Text fontWeight="bold">
                    {record.customer.firstName} {record.customer.lastName}
                  </Text>
                  <HStack spacing={2}>
                    <Tooltip label="Edit">
                      <IconButton
                        aria-label="Edit metadata"
                        icon={<FiEdit2 />}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(record)}
                      />
                    </Tooltip>
                    <Tooltip label="Delete">
                      <IconButton
                        aria-label="Delete metadata"
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => openDeleteDialog(record)}
                        isDisabled={isDeleting}
                      />
                    </Tooltip>
                  </HStack>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontSize="sm" color={mutedText}>
                      Vehicle
                    </Text>
                    <Text fontWeight="medium">
                      {record.vehicle.year} {record.vehicle.make} {record.vehicle.model}
                    </Text>
                    <Text fontSize="sm" color={mutedText}>
                      VIN: {record.vehicle.vin}
                    </Text>
                    {record.vehicle.licensePlate ? (
                      <Text fontSize="sm" color={mutedText}>
                        Plate: {record.vehicle.licensePlate}
                      </Text>
                    ) : null}
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={mutedText}>
                      Contact
                    </Text>
                    <Text>{record.customer.phone}</Text>
                    {record.customer.email ? (
                      <Text fontSize="sm" color={mutedText}>
                        {record.customer.email}
                      </Text>
                    ) : null}
                  </Box>
                  <HStack spacing={2}>
                    <Tag colorScheme={record.stats.openWorkOrders > 0 ? 'orange' : 'green'}>
                      <TagLabel>{record.stats.openWorkOrders} active</TagLabel>
                    </Tag>
                    <Tag>
                      <TagLabel>{record.stats.totalWorkOrders} total</TagLabel>
                    </Tag>
                  </HStack>
                  <Box>
                    <Text fontSize="sm" color={mutedText}>
                      Outstanding Balance
                    </Text>
                    <Text fontWeight="bold">{formatCurrency(record.stats.outstandingBalance)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={mutedText}>
                      Recent Work Orders
                    </Text>
                    {record.recentWorkOrders.length === 0 ? (
                      <Text fontSize="sm" color={mutedText}>
                        No work orders logged.
                      </Text>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        {record.recentWorkOrders.map((order) => (
                          <Box key={order.id} borderWidth="1px" borderRadius="md" borderColor={borderColor} p={2}>
                            <Text fontWeight="medium">{order.code}</Text>
                            <Text fontSize="sm" color={mutedText}>
                              {order.status} • {formatCurrency(Number(order.totalCost))}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <FormModal
        isOpen={formDisclosure.isOpen}
        onClose={() => {
          formDisclosure.onClose();
          resetForm();
        }}
        title={recordBeingEdited ? 'Edit Metadata' : 'Add Metadata'}
        onSubmit={handleSubmit}
        isSubmitting={recordBeingEdited ? isUpdating : isCreating}
      >
        <Stack spacing={4}>
          <Text fontWeight="semibold">Customer</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>First Name</FormLabel>
              <Input value={formState.customer.firstName} onChange={handleFormChange('customer', 'firstName')} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Last Name</FormLabel>
              <Input value={formState.customer.lastName} onChange={handleFormChange('customer', 'lastName')} />
            </FormControl>
          </SimpleGrid>
          <FormControl isRequired>
            <FormLabel>Phone</FormLabel>
            <Input value={formState.customer.phone} onChange={handleFormChange('customer', 'phone')} />
          </FormControl>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input value={formState.customer.email} onChange={handleFormChange('customer', 'email')} />
          </FormControl>
          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea value={formState.customer.notes} onChange={handleFormChange('customer', 'notes')} rows={2} />
          </FormControl>

          <Divider />
          <Text fontWeight="semibold">Vehicle</Text>
          <FormControl isRequired>
            <FormLabel>VIN</FormLabel>
            <Input value={formState.vehicle.vin} onChange={handleFormChange('vehicle', 'vin')} />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Make</FormLabel>
              <Input value={formState.vehicle.make} onChange={handleFormChange('vehicle', 'make')} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Model</FormLabel>
              <Input value={formState.vehicle.model} onChange={handleFormChange('vehicle', 'model')} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Year</FormLabel>
              <Input
                type="number"
                value={formState.vehicle.year}
                onChange={(event) => handleFormChange('vehicle', 'year')(event)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>License Plate</FormLabel>
              <Input value={formState.vehicle.licensePlate ?? ''} onChange={handleFormChange('vehicle', 'licensePlate')} />
            </FormControl>
          </SimpleGrid>
        </Stack>
      </FormModal>

      <AlertDialog isOpen={deleteDisclosure.isOpen} leastDestructiveRef={cancelDeleteRef} onClose={closeDeleteDialog}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Metadata
            </AlertDialogHeader>
            <AlertDialogBody>
              {recordPendingDelete
                ? `Delete vehicle ${recordPendingDelete.vehicle.make} ${recordPendingDelete.vehicle.model}?`
                : 'Delete this metadata record?'}
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
