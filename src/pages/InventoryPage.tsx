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
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useDisclosure,
  useToast,
  useColorModeValue,
  useBreakpointValue,
  Flex,
  Badge,
  Wrap,
  WrapItem,
  Icon,
  Skeleton,
  SkeletonText,
  Progress,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiSearch, FiPackage, FiAlertTriangle, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { MdInventory, MdAdd, MdWarning } from 'react-icons/md';

import { AppShell } from '../components/shell/AppShell';
import { FormModal } from '../components/forms/FormModal';
import { StatCard } from '../components/cards/StatCard';
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

// Skeleton loader for inventory rows
const InventoryRowSkeleton = () => (
  <Tr>
    <Td><Skeleton height="20px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
    <Td><Skeleton height="20px" width="60px" /></Td>
    <Td><Skeleton height="20px" width="60px" /></Td>
    <Td><Skeleton height="20px" width="60px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
  </Tr>
);

export const InventoryPage = () => {
  const toast = useToast();
  
  // Responsive values
  const tableVariant = useBreakpointValue({ base: 'simple', md: 'striped' });
  const showMobileCards = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const modalSize = useBreakpointValue({ base: 'full', md: 'xl', lg: '2xl' });
  const gridColumns = useBreakpointValue({ base: 2, md: 4 });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');
  const successColor = useColorModeValue('green.500', 'green.300');

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
  const [searchTerm, setSearchTerm] = useState('');

  const items = useMemo(() => data ?? [], [data]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(term) ||
      (item.sku && item.sku.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    if (!items.length) return null;

    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.quantityOnHand <= item.reorderPoint).length;
    const outOfStockItems = items.filter(item => item.quantityOnHand === 0).length;
    const totalValue = items.reduce((sum, item) => {
      const cost = Number(item.unitCost) || 0;
      return sum + (cost * item.quantityOnHand);
    }, 0);

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue
    };
  }, [items]);

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
      unitCost: item.unitCost ? String(item.unitCost) : '',
      unitPrice: item.unitPrice ? String(item.unitPrice) : ''
    });
    formDisclosure.onOpen();
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      toast({
        status: 'warning',
        title: 'Item name required',
        description: 'Please enter a name for the inventory item.',
        position: 'top-right'
      });
      return;
    }

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
          description: `${payload.name} is now stocked${payload.sku ? ` under SKU ${payload.sku}.` : '.'}`,
          position: 'top-right'
        });
      } else if (itemBeingEdited) {
        await updateInventoryItem({ id: itemBeingEdited.id, payload });
        toast({
          status: 'success',
          title: 'Inventory item updated',
          description: `${payload.name} has been updated successfully.`,
          position: 'top-right'
        });
      }
      resetForm();
      formDisclosure.onClose();
    } catch (submitError) {
      toast({
        status: 'error',
        title: formMode === 'create' ? 'Unable to add item' : 'Unable to update item',
        description: submitError instanceof Error ? submitError.message : 'Please try again.',
        position: 'top-right'
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
        description: `${itemPendingDelete.name} has been removed from the catalog.`,
        position: 'top-right'
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove item',
        description:
          deleteError instanceof Error
            ? deleteError.message
            : 'Ensure the item is not tied to open work orders before deleting.',
        position: 'top-right'
      });
    }
  };

  // Stock status indicator
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantityOnHand === 0) {
      return { color: 'red', label: 'Out of Stock', icon: MdWarning };
    }
    if (item.quantityOnHand <= item.reorderPoint) {
      return { color: 'orange', label: 'Low Stock', icon: FiAlertTriangle };
    }
    return { color: 'green', label: 'In Stock', icon: FiPackage };
  };

  // Mobile card view for inventory items
  const InventoryCard = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    
    return (
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
              <Box flex={1}>
                <Text fontWeight="bold" fontSize="lg" mb={1}>
                  {item.name}
                </Text>
                {item.sku && (
                  <Text fontSize="sm" color={mutedText}>
                    SKU: {item.sku}
                  </Text>
                )}
              </Box>
              <Badge 
                colorScheme={stockStatus.color} 
                variant="subtle"
                fontSize="xs"
              >
                <HStack spacing={1}>
                  <Icon as={stockStatus.icon} boxSize={3} />
                  <Text>{stockStatus.label}</Text>
                </HStack>
              </Badge>
            </Flex>

            {/* Description */}
            {item.description && (
              <Text fontSize="sm" color={mutedText} noOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Stock Information */}
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" color={mutedText}>Stock Level</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {item.quantityOnHand} / {item.reorderPoint}
                </Text>
              </Flex>
              <Progress 
                value={(item.quantityOnHand / (item.reorderPoint * 2)) * 100} 
                colorScheme={stockStatus.color}
                size="sm"
                borderRadius="full"
              />
            </Box>

            {/* Pricing */}
            <SimpleGrid columns={2} spacing={2}>
              <Box>
                <Text fontSize="xs" color={mutedText}>Cost</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {formatCurrency(item.unitCost)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color={mutedText}>Price</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {formatCurrency(item.unitPrice)}
                </Text>
              </Box>
            </SimpleGrid>

            {/* Actions */}
            <Flex justify="flex-end" pt={2}>
              <HStack spacing={1}>
                <Tooltip label="Edit item">
                  <IconButton
                    aria-label="Edit item"
                    icon={<FiEdit2 />}
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(item)}
                  />
                </Tooltip>
                <Tooltip label="Remove item">
                  <IconButton
                    aria-label="Remove item"
                    icon={<FiTrash2 />}
                    variant="ghost"
                    colorScheme="red"
                    size="sm"
                    onClick={() => openDeleteDialog(item)}
                  />
                </Tooltip>
              </HStack>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <AppShell
      title="Inventory Management"
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Inventory' }
      ]}
      actions={
        <Button 
          colorScheme="brand" 
          onClick={openCreateModal}
          leftIcon={<MdAdd />}
          size={buttonSize}
        >
          Add Item
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      <Stack spacing={6}>
        {/* Inventory Statistics */}
        {inventoryStats && (
          <SimpleGrid columns={gridColumns} gap={4}>
            <StatCard 
              label="Total Items" 
              value={inventoryStats.totalItems}
              icon={MdInventory}
              colorScheme="blue"
              size="sm"
            />
            <StatCard 
              label="Low Stock" 
              value={inventoryStats.lowStockItems}
              icon={FiAlertTriangle}
              colorScheme="orange"
              size="sm"
            />
            <StatCard 
              label="Out of Stock" 
              value={inventoryStats.outOfStockItems}
              icon={MdWarning}
              colorScheme="red"
              size="sm"
            />
            <StatCard 
              label="Total Value" 
              value={formatCurrency(inventoryStats.totalValue)}
              icon={FiDollarSign}
              colorScheme="green"
              size="sm"
              isCurrency
            />
          </SimpleGrid>
        )}

        {/* Search and Filters */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align={{ base: 'stretch', md: 'center' }}>
              <InputGroup maxW={{ base: '100%', md: '320px', lg:'600px' }}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color={mutedText} />
                </InputLeftElement>
                <Input
                  placeholder="Search by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              
            </Stack>
          </CardBody>
        </Card>

        {/* Inventory Items */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={3}>
                <Icon as={MdInventory} color={accentColor} boxSize={6} />
                <Text fontSize="xl" fontWeight="semibold">Inventory Items</Text>
              </HStack>
              {!isLoading && (
                <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                  {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            {/* Loading State */}
            {isLoading && (
              <>
                {showMobileCards ? (
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index}>
                        <CardBody>
                          <Stack spacing={3}>
                            <Skeleton height="24px" width="70%" />
                            <Skeleton height="16px" width="40%" />
                            <Skeleton height="12px" width="90%" />
                            <Skeleton height="20px" width="60%" />
                          </Stack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Table variant={tableVariant}>
                    <Thead bg={headerBg}>
                      <Tr>
                        <Th>Name</Th>
                        <Th>SKU</Th>
                        <Th>Stock</Th>
                        <Th>Cost</Th>
                        <Th>Price</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <InventoryRowSkeleton key={index} />
                      ))}
                    </Tbody>
                  </Table>
                )}
              </>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <Text fontWeight="semibold">Unable to load inventory</Text>
                  <Text fontSize="sm" mt={1}>
                    {error instanceof Error ? error.message : 'Please check your connection and try again.'}
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredItems.length === 0 && (
              <Box textAlign="center" py={12}>
                <Icon as={MdInventory} boxSize={12} color={mutedText} mb={4} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  {searchTerm ? 'No matching items found' : 'No inventory items yet'}
                </Text>
                <Text color={mutedText} mb={6}>
                  {searchTerm 
                    ? 'Try adjusting your search terms to find what you\'re looking for.'
                    : 'Get started by adding your first inventory item.'
                  }
                </Text>
                {!searchTerm && (
                  <Button 
                    colorScheme="brand" 
                    onClick={openCreateModal}
                    leftIcon={<MdAdd />}
                  >
                    Add First Item
                  </Button>
                )}
              </Box>
            )}

            {/* Results - Mobile Card View */}
            {!isLoading && !error && filteredItems.length > 0 && showMobileCards && (
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {filteredItems.map((item) => (
                  <InventoryCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}

            {/* Results - Desktop Table View */}
            {!isLoading && !error && filteredItems.length > 0 && !showMobileCards && (
              <Box overflowX="auto">
                <Table variant={tableVariant}>
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th>Name</Th>
                      <Th>SKU</Th>
                      <Th>Status</Th>
                      <Th>Stock Level</Th>
                      <Th isNumeric>Cost</Th>
                      <Th isNumeric>Price</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      
                      return (
                        <Tr 
                          key={item.id}
                          _hover={{ bg: hoverBg }}
                          transition="background 0.2s"
                        >
                          <Td>
                            <Box>
                              <Text fontWeight="medium">{item.name}</Text>
                              {item.description && (
                                <Text fontSize="sm" color={mutedText} noOfLines={1}>
                                  {item.description}
                                </Text>
                              )}
                            </Box>
                          </Td>
                          <Td>
                            {item.sku ? (
                              <Badge variant="outline" colorScheme="gray" fontSize="xs">
                                {item.sku}
                              </Badge>
                            ) : (
                              <Text fontSize="sm" color={mutedText}>—</Text>
                            )}
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={stockStatus.color} 
                              variant="subtle"
                              fontSize="xs"
                            >
                              <HStack spacing={1}>
                                <Icon as={stockStatus.icon} boxSize={3} />
                                <Text>{stockStatus.label}</Text>
                              </HStack>
                            </Badge>
                          </Td>
                          <Td>
                            <VStack align="flex-start" spacing={1}>
                              <Text fontSize="sm">
                                {item.quantityOnHand} / {item.reorderPoint}
                              </Text>
                              <Progress 
                                value={(item.quantityOnHand / (item.reorderPoint * 2)) * 100} 
                                colorScheme={stockStatus.color}
                                size="xs"
                                width="100px"
                                borderRadius="full"
                              />
                            </VStack>
                          </Td>
                          <Td isNumeric fontWeight="medium">
                            {formatCurrency(item.unitCost)}
                          </Td>
                          <Td isNumeric fontWeight="medium" color={accentColor}>
                            {formatCurrency(item.unitPrice)}
                          </Td>
                          <Td>
                            <HStack justify="flex-end" spacing={1}>
                              <Tooltip label="Edit item">
                                <IconButton
                                  aria-label="Edit item"
                                  icon={<FiEdit2 />}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(item)}
                                />
                              </Tooltip>
                              <Tooltip label="Remove item">
                                <IconButton
                                  aria-label="Remove item"
                                  icon={<FiTrash2 />}
                                  variant="ghost"
                                  colorScheme="red"
                                  size="sm"
                                  onClick={() => openDeleteDialog(item)}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </Stack>

      {/* Form Modal */}
      <FormModal
        isOpen={formDisclosure.isOpen}
        onClose={() => {
          resetForm();
          formDisclosure.onClose();
        }}
        title={formMode === 'create' ? 'Add Inventory Item' : `Edit ${itemBeingEdited?.name}`}
        submitLabel={formMode === 'create' ? 'Create Item' : 'Save Changes'}
        isSubmitting={formMode === 'create' ? isCreating : isUpdating}
        onSubmit={handleSubmit}
        size={(modalSize ?? 'xl') as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full'}
        variant="default"
      >
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <FormControl isRequired>
            <FormLabel>Item Name</FormLabel>
            <Input
              value={formState.name}
              onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Enter item name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>SKU</FormLabel>
            <Input
              value={formState.sku}
              onChange={(event) => setFormState((previous) => ({ ...previous, sku: event.target.value }))}
              placeholder="Leave blank to auto-generate"
            />
          </FormControl>
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                value={formState.description}
                onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
                placeholder="Item description (optional)"
              />
            </FormControl>
          </GridItem>
          <FormControl isRequired>
            <FormLabel>Quantity on Hand</FormLabel>
            <NumberInput
              min={0}
              value={formState.quantityOnHand}
              onChange={(_, valueNumber) => setFormState((previous) => ({ ...previous, quantityOnHand: valueNumber || 0 }))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
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
            <NumberInput
              min={0}
              precision={2}
              value={formState.unitCost}
              onChange={(value) => setFormState((previous) => ({ ...previous, unitCost: value }))}
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Unit Price</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={formState.unitPrice}
              onChange={(value) => setFormState((previous) => ({ ...previous, unitPrice: value }))}
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
        </Grid>
      </FormModal>

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
                <Text>Delete Inventory Item</Text>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody>
              {itemPendingDelete && (
                <VStack align="stretch" spacing={3}>
                  <Text>
                    Are you sure you want to delete <strong>{itemPendingDelete.name}</strong>?
                  </Text>
                  <Text color={mutedText}>
                    This will permanently remove the item from your inventory. This action cannot be undone.
                  </Text>
                  {itemPendingDelete.quantityOnHand > 0 && (
                    <Alert status="warning" size="sm" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        This item has {itemPendingDelete.quantityOnHand} units in stock. 
                        Deleting it will remove all stock information.
                      </Text>
                    </Alert>
                  )}
                </VStack>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog} size="sm">
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3} 
                isLoading={isDeleting}
                size="sm"
              >
                Delete Item
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
};