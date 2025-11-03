import { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Tag,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Alert,
  AlertIcon,
  Spinner,
  IconButton,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { useCustomers } from '../hooks/useCustomers';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { FormModal } from '../components/forms/FormModal';
import { Customer } from '../types/api';

const initialFormState = {
  fullName: '',
  phone: '',
  notes: ''
};

export const CustomersPage = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const {
    data,
    isLoading,
    error,
    createCustomer,
    isCreating,
    deleteCustomer,
    isDeleting
  } = useCustomers();
  const { data: summary } = useDashboardSummary();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [customerPendingDelete, setCustomerPendingDelete] = useState<Customer | null>(null);

  const customers = useMemo(() => data ?? [], [data]);

  const handleChange = (field: keyof typeof initialFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => setFormState(initialFormState);

  const handleSubmit = async () => {
    const fullName = formState.fullName.trim();
    const phone = formState.phone.trim();
    const notes = formState.notes ? formState.notes.trim() : undefined;

    try {
      await createCustomer({
        fullName,
        phone,
        notes
      });
      resetForm();
      onClose();
      toast({
        status: 'success',
        title: 'Customer added',
        description: `${fullName} is now in your directory.`
      });
    } catch (submitError) {
      toast({
        status: 'error',
        title: 'Unable to add customer',
        description: submitError instanceof Error ? submitError.message : 'Please try again.'
      });
    }
  };

  const openDeleteDialog = (customer: Customer) => {
    setCustomerPendingDelete(customer);
    deleteDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setCustomerPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!customerPendingDelete) {
      return;
    }

    try {
      await deleteCustomer(customerPendingDelete.id);
      toast({
        status: 'success',
        title: 'Customer removed',
        description: `${customerPendingDelete.firstName} ${customerPendingDelete.lastName} has been archived.`
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove customer',
        description:
          deleteError instanceof Error
            ? deleteError.message
            : 'Remove or reassign any related records before deleting.'
      });
    }
  };

  return (
    <AppShell
      title="Customers"
      actions={
        <Button colorScheme="brand" onClick={onOpen}>
          Add Customer
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Failed to load customers
        </Alert>
      ) : (
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={0} overflow="hidden">
          <Table variant="simple">
            <Thead bg={headerBg}>
              <Tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Vehicles</Th>
                <Th>Notes</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {customers.map((customer) => (
                <Tr key={customer.id}>
                  <Td>
                    <Text fontWeight="medium">
                      {customer.firstName} {customer.lastName}
                    </Text>
                    {customer.company ? <Text fontSize="sm">{customer.company}</Text> : null}
                  </Td>
                  <Td>{customer.phone}</Td>
                  <Td>
                    <HStack spacing={2}>
                      {customer.vehicles.map((vehicle) => (
                        <Tag key={vehicle.id} colorScheme="brand" borderRadius="full">
                          {vehicle.make} {vehicle.model}
                        </Tag>
                      ))}
                    </HStack>
                  </Td>
                  <Td maxW="240px">
                    <Text noOfLines={2} color={mutedText}>
                      {customer.notes ?? '-'}
                    </Text>
                  </Td>
                  <Td>
                    <Tooltip label="Remove customer">
                      <IconButton
                        aria-label="Remove customer"
                        icon={<FiTrash2 />}
                        variant="ghost"
                        colorScheme="red"
                        size="sm"
                        onClick={() => openDeleteDialog(customer)}
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <FormModal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title="Add Customer"
        isSubmitting={isCreating}
        onSubmit={handleSubmit}
      >
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input value={formState.fullName} onChange={handleChange('fullName')} placeholder="Customer name" />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Phone</FormLabel>
            <Input value={formState.phone} onChange={handleChange('phone')} />
          </FormControl>
          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Input value={formState.notes} onChange={handleChange('notes')} />
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
              Remove Customer
            </AlertDialogHeader>
            <AlertDialogBody>
              {customerPendingDelete
                ? `Are you sure you want to delete ${customerPendingDelete.firstName} ${customerPendingDelete.lastName}? This will also remove any quick links to their vehicles.`
                : 'Are you sure you want to delete this customer?'}
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
