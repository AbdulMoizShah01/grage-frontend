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
  HStack,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
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
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { FormModal } from '../components/forms/FormModal';
import { useInventory } from '../hooks/useInventory';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { InventoryItem } from '../types/api';
import { formatCurrency } from '../utils/formatting';

const initialForm = {
  name: '',
  sku: '',
  description: '',
  quantityOnHand: 0,
  reorderPoint: 0,
  unitCost: '',
  unitPrice: ''
};

export const InventoryPage = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const {
    data,
    isLoading,
    error,
    createInventoryItem,
    isCreating,
    updateInventoryItem,
    isUpdating,
    deleteInventoryItem,
    isDeleting
  } = useInventory();
  const { data: summary } = useDashboardSummary();
  const formDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const [formState, setFormState] = useState(initialForm);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [itemBeingEdited, setItemBeingEdited] = useState<InventoryItem | null>(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<InventoryItem | null>(null);

  const items = useMemo(() => data ?? [], [data]);

  const resetForm = () => {
    setFormState(initialForm);
    setItemBeingEdited(null);
    setFormMode('create');
  };

  const openCreateModal = () => {
    resetForm();
    setFormMode('create');
    formDisclosure.onOpen();
  };

  const openEditModal = (item: InventoryItem) => {
    setFormMode('edit');
    setItemBeingEdited(item);
    setFormState({
      name: item.name,
      sku: item.sku ?? '',
      description: item.description ?? '',
      quantityOnHand: item.quantityOnHand,
      reorderPoint: item.reorderPoint,
      unitCost: item.unitCost ?? '',
      unitPrice: item.unitPrice ?? ''
    });
    formDisclosure.onOpen();
  };

  const handleSubmit = async () => {
    const payload = {
      name: formState.name.trim(),
      sku: formState.sku.trim() ? formState.sku.trim() : undefined,
      description: formState.description.trim() || undefined,
      quantityOnHand: Number(formState.quantityOnHand),
      reorderPoint: Number(formState.reorderPoint),
      unitCost: formState.unitCost ? Number(formState.unitCost) : undefined,
      unitPrice: formState.unitPrice ? Number(formState.unitPrice) : undefined
    };

    try {
      if (formMode === 'create') {
        await createInventoryItem(payload);
        toast({
          status: 'success',
          title: 'Inventory item added',
          description: `${payload.name} is now stocked${payload.sku ? ` under SKU ${payload.sku}.` : '.'}`
        });
      } else if (itemBeingEdited) {
        await updateInventoryItem({ id: itemBeingEdited.id, payload });
        toast({
          status: 'success',
          title: 'Inventory item updated',
          description: `${payload.name} has been updated successfully.`
        });
      }
      resetForm();
      formDisclosure.onClose();
    } catch (submitError) {
      toast({
        status: 'error',
        title: formMode === 'create' ? 'Unable to add item' : 'Unable to update item',
        description: submitError instanceof Error ? submitError.message : 'Please try again.'
      });
    }
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setItemPendingDelete(item);
    deleteDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setItemPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!itemPendingDelete) {
      return;
    }

    try {
      await deleteInventoryItem(itemPendingDelete.id);
      toast({
        status: 'success',
        title: 'Inventory item removed',
        description: `${itemPendingDelete.name} has been removed from the catalog.`
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove item',
        description:
          deleteError instanceof Error
            ? deleteError.message
            : 'Ensure the item is not tied to open work orders before deleting.'
      });
    }
  };

  return (
    <AppShell
      title='Inventory'
      actions={
        <Button colorScheme='brand' onClick={openCreateModal}>
          Add Item
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status='error' borderRadius='md'>
          <AlertIcon />
          Failed to load inventory
        </Alert>
      ) : (
        <Box bg={cardBg} borderRadius='xl' borderWidth='1px' borderColor={borderColor} overflow='hidden'>
          <Table>
            <Thead bg={headerBg}>
              <Tr>
                <Th>Name</Th>
                <Th>SKU</Th>
                <Th>Stock</Th>
                <Th>Cost</Th>
                <Th>Price</Th>
                <Th textAlign='right'>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.length === 0 ? (
                <Tr>
                  <Td colSpan={6}>
                    <Text color={mutedText}>No inventory records yet.</Text>
                  </Td>
                </Tr>
              ) : (
                items.map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <Text fontWeight='medium'>{item.name}</Text>
                      {item.description ? (
                        <Text fontSize='sm' color={mutedText}>
                          {item.description}
                        </Text>
                      ) : null}
                    </Td>
                    <Td>{item.sku}</Td>
                    <Td>
                      {item.quantityOnHand} / {item.reorderPoint}
                    </Td>
                    <Td>{formatCurrency(item.unitCost)}</Td>
                    <Td>{formatCurrency(item.unitPrice)}</Td>
                    <Td>
                      <HStack justify='flex-end' spacing={2}>
                        <Tooltip label='Edit item'>
                          <IconButton
                            aria-label='Edit item'
                            icon={<FiEdit2 />}
                            variant='ghost'
                            size='sm'
                            onClick={() => openEditModal(item)}
                          />
                        </Tooltip>
                        <Tooltip label='Remove item'>
                          <IconButton
                            aria-label='Remove item'
                            icon={<FiTrash2 />}
                            variant='ghost'
                            colorScheme='red'
                            size='sm'
                            onClick={() => openDeleteDialog(item)}
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
        title={formMode === 'create' ? 'Add Inventory Item' : `Edit ${itemBeingEdited?.name ?? 'Inventory Item'}`}
        submitLabel={formMode === 'create' ? 'Save' : 'Save Changes'}
        isSubmitting={formMode === 'create' ? isCreating : isUpdating}
        onSubmit={handleSubmit}
      >
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              value={formState.name}
              onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>SKU</FormLabel>
            <Input
              value={formState.sku}
              onChange={(event) => setFormState((previous) => ({ ...previous, sku: event.target.value }))}
              placeholder="Leave blank to auto-generate"
            />
            <Text fontSize="sm" color={mutedText} mt={1}>
              SKU is optional — the system will create one if left blank.
            </Text>
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input
              value={formState.description}
              onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Quantity on Hand</FormLabel>
            <NumberInput
              min={0}
              value={formState.quantityOnHand}
              onChange={(_, valueNumber) => setFormState((previous) => ({ ...previous, quantityOnHand: valueNumber || 0 }))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Reorder Point</FormLabel>
            <NumberInput
              min={0}
              value={formState.reorderPoint}
              onChange={(_, valueNumber) => setFormState((previous) => ({ ...previous, reorderPoint: valueNumber || 0 }))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Unit Cost</FormLabel>
            <Input
              value={formState.unitCost}
              onChange={(event) => setFormState((previous) => ({ ...previous, unitCost: event.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Unit Price</FormLabel>
            <Input
              value={formState.unitPrice}
              onChange={(event) => setFormState((previous) => ({ ...previous, unitPrice: event.target.value }))}
            />
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
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Remove Inventory Item
            </AlertDialogHeader>
            <AlertDialogBody>
              {itemPendingDelete
                ? `Delete ${itemPendingDelete.name}? This action cannot be undone.`
                : 'Are you sure you want to remove this item?'}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button colorScheme='red' onClick={handleDelete} ml={3} isLoading={isDeleting}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
};
