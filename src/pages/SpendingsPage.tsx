import { useMemo, useRef, useState } from 'react';
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
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { FormModal } from '../components/forms/FormModal';
import { useSpendings } from '../hooks/useSpendings';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { Spending, SpendingCategory } from '../types/api';
import { formatCurrency } from '../utils/formatting';

const categoryLabels: Record<SpendingCategory, string> = {
  PREMISES_RENT: 'Premises rent',
  WATER: 'Water',
  ELECTRICITY: 'Electricity',
  LOGISTICS: 'Logistics',
  MAINTENANCE: 'Maintenance',
  PROCUREMENT: 'Procurement',
  MISCELLANEOUS: 'Miscellaneous'
};

const initialForm = {
  category: 'PREMISES_RENT' as SpendingCategory,
  amount: '',
  description: '',
  incurredAt: new Date().toISOString().slice(0, 10)
};

export const SpendingsPage = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  const {
    data,
    isLoading,
    error,
    createSpending,
    isCreating,
    deleteSpending,
    isDeleting
  } = useSpendings();
  const { data: summary } = useDashboardSummary();

  const formDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const [formState, setFormState] = useState(initialForm);
  const [spendingPendingDelete, setSpendingPendingDelete] = useState<Spending | null>(null);

  const spendings = useMemo(() => data ?? [], [data]);
  const totalSpendings = spendings.reduce((sum, spending) => sum + Number(spending.amount ?? 0), 0);

  const openCreateModal = () => {
    setFormState(initialForm);
    formDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setSpendingPendingDelete(null);
  };

  const openDeleteDialog = (spending: Spending) => {
    setSpendingPendingDelete(spending);
    deleteDisclosure.onOpen();
  };

  const handleFormChange =
    (field: keyof typeof initialForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async () => {
    if (!formState.amount) {
      toast({ status: 'warning', title: 'Provide an amount' });
      return;
    }

    try {
      await createSpending({
        category: formState.category,
        amount: Number(formState.amount),
        description: formState.description?.trim() ?? undefined,
        incurredAt: formState.incurredAt
      });
      toast({ status: 'success', title: 'Spending recorded' });
      formDisclosure.onClose();
      setFormState(initialForm);
    } catch (submitError) {
      toast({
        status: 'error',
        title: 'Unable to save spending',
        description: submitError instanceof Error ? submitError.message : 'Please try again.'
      });
    }
  };

  const handleDelete = async () => {
    if (!spendingPendingDelete) {
      return;
    }

    try {
      await deleteSpending(spendingPendingDelete.id);
      toast({ status: 'success', title: 'Spending removed' });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to delete spending',
        description: deleteError instanceof Error ? deleteError.message : 'Please try again.'
      });
    }
  };

  return (
    <AppShell
      title="Spendings"
      inventoryAlertsCount={summary?.inventoryAlertsCount}
      actions={
        <Button colorScheme="brand" onClick={openCreateModal}>
          Add Spending
        </Button>
      }
    >
      <Box
        bg={cardBg}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        p={4}
        mb={6}
      >
        <Text fontSize="lg" fontWeight="semibold">
          Track operational expenses to keep insights accurate.
        </Text>
        <Text color={useColorModeValue('gray.600', 'gray.400')}>
          Total recorded spendings (6 months rolling): {formatCurrency(totalSpendings)}
        </Text>
      </Box>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Unable to load spendings.
        </Alert>
      ) : (
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <Table>
            <Thead bg={headerBg}>
              <Tr>
                <Th>Category</Th>
                <Th isNumeric>Amount</Th>
                <Th>Incurred On</Th>
                <Th>Description</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {spendings.map((spending) => (
                <Tr key={spending.id}>
                  <Td>{categoryLabels[spending.category]}</Td>
                  <Td isNumeric>{formatCurrency(Number(spending.amount))}</Td>
                  <Td>{new Date(spending.incurredAt).toLocaleDateString()}</Td>
                  <Td>{spending.description ?? '—'}</Td>
                  <Td textAlign="right">
                    <Button
                      variant="ghost"
                      colorScheme="red"
                      size="sm"
                      leftIcon={<FiTrash2 />}
                      onClick={() => openDeleteDialog(spending)}
                      isDisabled={isDeleting}
                    >
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <FormModal
        isOpen={formDisclosure.isOpen}
        onClose={() => {
          setFormState(initialForm);
          formDisclosure.onClose();
        }}
        title="Add Spending"
        isSubmitting={isCreating}
        onSubmit={handleSubmit}
      >
        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select value={formState.category} onChange={handleFormChange('category')}>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Amount</FormLabel>
          <NumberInput min={0} value={formState.amount} onChange={(value) => setFormState((prev) => ({ ...prev, amount: value }))}>
            <NumberInputField />
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel>Date</FormLabel>
          <Input type="date" value={formState.incurredAt} onChange={handleFormChange('incurredAt')} />
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Input value={formState.description} onChange={handleFormChange('description')} placeholder="Optional notes" />
        </FormControl>
      </FormModal>

      <AlertDialog isOpen={deleteDisclosure.isOpen} onClose={closeDeleteDialog} leastDestructiveRef={cancelDeleteRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Spending
            </AlertDialogHeader>
            <AlertDialogBody>
              {spendingPendingDelete
                ? `Remove ${categoryLabels[spendingPendingDelete.category]} entry recorded on ${new Date(
                    spendingPendingDelete.incurredAt
                  ).toLocaleDateString()}?`
                : 'Remove this spending entry?'}
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
