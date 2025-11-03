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
  Spinner,
  Table,
  Tbody,
  Td,
  Tr,
  Text,
  Th,
  Thead,
  Tooltip,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { FormModal } from '../components/forms/FormModal';
import { useServices } from '../hooks/useServices';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { ServiceItem } from '../types/api';
import { formatCurrency } from '../utils/formatting';

const initialForm = {
  name: '',
  description: '',
  defaultPrice: ''
};

export const ServicesPage = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const {
    data,
    isLoading,
    error,
    createServiceItem,
    isCreating,
    updateServiceItem,
    isUpdating,
    deleteServiceItem,
    isDeleting
  } = useServices();
  const { data: summary } = useDashboardSummary();
  const formDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const [formState, setFormState] = useState(initialForm);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [serviceBeingEdited, setServiceBeingEdited] = useState<ServiceItem | null>(null);
  const [servicePendingDelete, setServicePendingDelete] = useState<ServiceItem | null>(null);

  const services = useMemo(() => data ?? [], [data]);

  const resetForm = () => {
    setFormState(initialForm);
    setFormMode('create');
    setServiceBeingEdited(null);
  };

  const openCreateModal = () => {
    resetForm();
    formDisclosure.onOpen();
  };

  const openEditModal = (service: ServiceItem) => {
    setFormMode('edit');
    setServiceBeingEdited(service);
    setFormState({
      name: service.name,
      description: service.description ?? '',
      defaultPrice: service.defaultPrice ?? ''
    });
    formDisclosure.onOpen();
  };

  const handleSubmit = async () => {
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      defaultPrice: Number(formState.defaultPrice) || 0
    };

    if (!payload.name) {
      toast({
        status: 'warning',
        title: 'Name required',
        description: 'Add a service name before saving.'
      });
      return;
    }

    try {
      if (formMode === 'create') {
        await createServiceItem(payload);
        toast({
          status: 'success',
          title: 'Service added',
          description: `${payload.name} is now available to quote.`
        });
      } else if (serviceBeingEdited) {
        await updateServiceItem({ id: serviceBeingEdited.id, payload });
        toast({
          status: 'success',
          title: 'Service updated',
          description: `${payload.name} has been updated.`
        });
      }
      resetForm();
      formDisclosure.onClose();
    } catch (submitError) {
      toast({
        status: 'error',
        title: formMode === 'create' ? 'Unable to add service' : 'Unable to update service',
        description: submitError instanceof Error ? submitError.message : 'Please try again.'
      });
    }
  };

  const openDeleteDialog = (service: ServiceItem) => {
    setServicePendingDelete(service);
    deleteDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setServicePendingDelete(null);
  };

  const handleDelete = async () => {
    if (!servicePendingDelete) {
      return;
    }

    try {
      await deleteServiceItem(servicePendingDelete.id);
      toast({
        status: 'success',
        title: 'Service removed',
        description: `${servicePendingDelete.name} has been removed from the catalog.`
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove service',
        description: deleteError instanceof Error ? deleteError.message : 'Please try again.'
      });
    }
  };

  return (
    <AppShell
      title="Service Catalog"
      actions={
        <Button colorScheme="brand" onClick={openCreateModal}>
          Add Service
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Failed to load services
        </Alert>
      ) : (
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <Table>
            <Thead bg={headerBg}>
              <Tr>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th isNumeric>Default Price</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {services.length === 0 ? (
                <Tr>
                  <Td colSpan={4}>
                    <Text color={mutedText}>No services recorded yet.</Text>
                  </Td>
                </Tr>
              ) : (
                services.map((service) => (
                  <Tr key={service.id}>
                    <Td>{service.name}</Td>
                    <Td>{service.description ?? '-'}</Td>
                    <Td isNumeric>{formatCurrency(Number(service.defaultPrice))}</Td>
                    <Td>
                      <HStack justify="flex-end" spacing={2}>
                        <Tooltip label="Edit service">
                          <IconButton
                            aria-label="Edit service"
                            icon={<FiEdit2 />}
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(service)}
                          />
                        </Tooltip>
                        <Tooltip label="Remove service">
                          <IconButton
                            aria-label="Remove service"
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => openDeleteDialog(service)}
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
      )}

      <FormModal
        isOpen={formDisclosure.isOpen}
        onClose={() => {
          resetForm();
          formDisclosure.onClose();
        }}
        title={formMode === 'create' ? 'Add Service' : `Edit ${serviceBeingEdited?.name ?? 'Service'}`}
        submitLabel={formMode === 'create' ? 'Save' : 'Save Changes'}
        isSubmitting={formMode === 'create' ? isCreating : isUpdating}
        onSubmit={handleSubmit}
      >
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              value={formState.name}
              onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input
              value={formState.description}
              onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Default Price</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={formState.defaultPrice}
              onChange={(value) => setFormState((previous) => ({ ...previous, defaultPrice: value }))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
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
              Remove Service
            </AlertDialogHeader>
            <AlertDialogBody>
              {servicePendingDelete
                ? `Delete ${servicePendingDelete.name}? This action cannot be undone.`
                : 'Are you sure you want to remove this service?'}
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
