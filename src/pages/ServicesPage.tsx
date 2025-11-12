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
  Icon,
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
  useColorModeValue,
  useDisclosure,
  useToast,
  useBreakpointValue,
  Flex,
  Badge,
  Wrap,
  WrapItem,
  Skeleton,
  SkeletonText,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiSearch, FiDollarSign, FiTrendingUp, FiPackage } from 'react-icons/fi';
import { MdAdd, MdBuild, MdWarning, MdDesignServices } from 'react-icons/md';

import { AppShell } from '../components/shell/AppShell';
import { FormModal } from '../components/forms/FormModal';
import { StatCard } from '../components/cards/StatCard';
import { useServices } from '../hooks/useServices';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { ServiceItem } from '../types/api';
import { formatCurrency } from '../utils/formatting';

const initialForm = {
  name: '',
  description: '',
  defaultPrice: ''
};

// Skeleton loader for service rows
const ServiceRowSkeleton = () => (
  <Tr>
    <Td><Skeleton height="20px" /></Td>
    <Td><Skeleton height="20px" width="120px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
  </Tr>
);

export const ServicesPage = () => {
  const toast = useToast();
  
  // Responsive values
  const tableVariant = useBreakpointValue({ base: 'simple', md: 'striped' });
  const showMobileCards = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const modalSize = useBreakpointValue({ base: 'full', md: 'lg', lg: 'xl' });
  const gridColumns = useBreakpointValue({ base: 2, md: 3 });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');

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
  const [searchTerm, setSearchTerm] = useState('');

  const services = useMemo(() => data ?? [], [data]);

  // Filter services based on search term
  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    
    const term = searchTerm.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(term) ||
      (service.description && service.description.toLowerCase().includes(term))
    );
  }, [services, searchTerm]);

  // Calculate service statistics
  const serviceStats = useMemo(() => {
    if (!services.length) return null;

    const totalServices = services.length;
    const averagePrice = services.reduce((sum, service) => sum + Number(service.defaultPrice), 0) / services.length;
    const highestPriceService = services.reduce((max, service) => 
      Number(service.defaultPrice) > Number(max.defaultPrice) ? service : max
    , services[0]);
    const lowestPriceService = services.reduce((min, service) => 
      Number(service.defaultPrice) < Number(min.defaultPrice) ? service : min
    , services[0]);

    return {
      totalServices,
      averagePrice,
      highestPriceService,
      lowestPriceService
    };
  }, [services]);

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
      defaultPrice: service.defaultPrice ? String(service.defaultPrice) : ''
    });
    formDisclosure.onOpen();
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      toast({
        status: 'warning',
        title: 'Service name required',
        description: 'Please enter a name for the service.',
        position: 'top-right'
      });
      return;
    }

    if (!formState.defaultPrice || Number(formState.defaultPrice) <= 0) {
      toast({
        status: 'warning',
        title: 'Valid price required',
        description: 'Please enter a valid price for the service.',
        position: 'top-right'
      });
      return;
    }

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      defaultPrice: Number(formState.defaultPrice) || 0
    };

    try {
      if (formMode === 'create') {
        await createServiceItem(payload);
        toast({
          status: 'success',
          title: 'Service added successfully',
          description: `${payload.name} is now available to quote.`,
          position: 'top-right'
        });
      } else if (serviceBeingEdited) {
        await updateServiceItem({ id: serviceBeingEdited.id, payload });
        toast({
          status: 'success',
          title: 'Service updated successfully',
          description: `${payload.name} has been updated.`,
          position: 'top-right'
        });
      }
      resetForm();
      formDisclosure.onClose();
    } catch (submitError) {
      toast({
        status: 'error',
        title: formMode === 'create' ? 'Unable to add service' : 'Unable to update service',
        description: submitError instanceof Error ? submitError.message : 'Please try again.',
        position: 'top-right'
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
        description: `${servicePendingDelete.name} has been removed from the catalog.`,
        position: 'top-right'
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove service',
        description: deleteError instanceof Error ? deleteError.message : 'Please try again.',
        position: 'top-right'
      });
    }
  };

  // Mobile card view for services
  const ServiceCard = ({ service }: { service: ServiceItem }) => (
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
                {service.name}
              </Text>
              <Badge 
                colorScheme="blue" 
                variant="subtle"
                fontSize="xs"
              >
                <HStack spacing={1}>
                  <Icon as={MdBuild} boxSize={3} />
                  <Text>Service</Text>
                </HStack>
              </Badge>
            </Box>
            <Text fontWeight="bold" fontSize="xl" color={accentColor}>
              {formatCurrency(Number(service.defaultPrice))}
            </Text>
          </Flex>

          {/* Description */}
          {service.description && (
            <Text fontSize="sm" color={mutedText} noOfLines={3}>
              {service.description}
            </Text>
          )}

          {/* Actions */}
          <Flex justify="flex-end" pt={2}>
            <HStack spacing={1}>
              <Tooltip label="Edit service">
                <IconButton
                  aria-label="Edit service"
                  icon={<FiEdit2 />}
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(service)}
                />
              </Tooltip>
              <Tooltip label="Remove service">
                <IconButton
                  aria-label="Remove service"
                  icon={<FiTrash2 />}
                  variant="ghost"
                  colorScheme="red"
                  size="sm"
                  onClick={() => openDeleteDialog(service)}
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
      title="Service Catalog"
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Services' }
      ]}
      actions={
        <Button 
          colorScheme="brand" 
          onClick={openCreateModal}
          leftIcon={<MdAdd />}
          size={buttonSize}
        >
          Add Service
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      <Stack spacing={6}>
        {/* Service Statistics */}
        {serviceStats && (
          <SimpleGrid columns={gridColumns} gap={4}>
            <StatCard 
              label="Total Services" 
              value={serviceStats.totalServices}
              icon={MdDesignServices}
              colorScheme="blue"
              size="sm"
            />
            <StatCard 
              label="Average Price" 
              value={formatCurrency(serviceStats.averagePrice)}
              icon={FiDollarSign}
              colorScheme="green"
              size="sm"
              isCurrency
            />
            <StatCard 
              label="Price Range" 
              value={`${formatCurrency(Number(serviceStats.lowestPriceService.defaultPrice))} - ${formatCurrency(Number(serviceStats.highestPriceService.defaultPrice))}`}
              icon={FiTrendingUp}
              colorScheme="purple"
              size="sm"
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
                  placeholder="Search services by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
             
            </Stack>
          </CardBody>
        </Card>

        {/* Services List */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={3}>
                <Icon as={MdDesignServices} color={accentColor} boxSize={6} />
                <Text fontSize="xl" fontWeight="semibold">Service Catalog</Text>
              </HStack>
              {!isLoading && (
                <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                  {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
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
                        <Th>Description</Th>
                        <Th isNumeric>Default Price</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <ServiceRowSkeleton key={index} />
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
                  <Text fontWeight="semibold">Unable to load services</Text>
                  <Text fontSize="sm" mt={1}>
                    {error instanceof Error ? error.message : 'Please check your connection and try again.'}
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredServices.length === 0 && (
              <Box textAlign="center" py={12}>
                <Icon as={MdDesignServices} boxSize={12} color={mutedText} mb={4} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  {searchTerm ? 'No matching services found' : 'No services yet'}
                </Text>
                <Text color={mutedText} mb={6}>
                  {searchTerm 
                    ? 'Try adjusting your search terms to find what you\'re looking for.'
                    : 'Get started by adding your first service to the catalog.'
                  }
                </Text>
                {!searchTerm && (
                  <Button 
                    colorScheme="brand" 
                    onClick={openCreateModal}
                    leftIcon={<MdAdd />}
                  >
                    Add First Service
                  </Button>
                )}
              </Box>
            )}

            {/* Results - Mobile Card View */}
            {!isLoading && !error && filteredServices.length > 0 && showMobileCards && (
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </SimpleGrid>
            )}

            {/* Results - Desktop Table View */}
            {!isLoading && !error && filteredServices.length > 0 && !showMobileCards && (
              <Box overflowX="auto">
                <Table variant={tableVariant}>
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th>Service Name</Th>
                      <Th>Description</Th>
                      <Th isNumeric>Default Price</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredServices.map((service) => (
                      <Tr 
                        key={service.id}
                        _hover={{ bg: hoverBg }}
                        transition="background 0.2s"
                      >
                        <Td>
                          <Box>
                            <Text fontWeight="medium">{service.name}</Text>
                            <Badge 
                              colorScheme="blue" 
                              variant="subtle"
                              fontSize="xs"
                              mt={1}
                            >
                              <HStack spacing={1}>
                                <Icon as={MdBuild} boxSize={3} />
                                <Text>Service</Text>
                              </HStack>
                            </Badge>
                          </Box>
                        </Td>
                        <Td>
                          {service.description ? (
                            <Text fontSize="sm" color={mutedText} noOfLines={2}>
                              {service.description}
                            </Text>
                          ) : (
                            <Text fontSize="sm" color={mutedText} fontStyle="italic">
                              No description
                            </Text>
                          )}
                        </Td>
                        <Td isNumeric fontWeight="bold" color={accentColor}>
                          {formatCurrency(Number(service.defaultPrice))}
                        </Td>
                        <Td>
                          <HStack justify="flex-end" spacing={1}>
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
                    ))}
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
        title={formMode === 'create' ? 'Add New Service' : `Edit ${serviceBeingEdited?.name}`}
        submitLabel={formMode === 'create' ? 'Create Service' : 'Save Changes'}
        isSubmitting={formMode === 'create' ? isCreating : isUpdating}
        onSubmit={handleSubmit}
        size={(modalSize ?? 'xl') as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full'}
        variant="default"
      >
        <Grid templateColumns="1fr" gap={4}>
          <FormControl isRequired>
            <FormLabel>Service Name</FormLabel>
            <Input
              value={formState.name}
              onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Enter service name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input
              value={formState.description}
              onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="Service description (optional)"
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
              <NumberInputField placeholder="0.00" />
            </NumberInput>
            <Text fontSize="sm" color={mutedText} mt={1}>
              This will be the default price when adding this service to work orders.
            </Text>
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
                <Text>Delete Service</Text>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody>
              {servicePendingDelete && (
                <VStack align="stretch" spacing={3}>
                  <Text>
                    Are you sure you want to delete the service <strong>{servicePendingDelete.name}</strong>?
                  </Text>
                  <Text color={mutedText}>
                    This will permanently remove the service from your catalog. This action cannot be undone.
                  </Text>
                  <Alert status="warning" size="sm" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      This service may be linked to existing work orders. Deleting it may affect historical records.
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
                onClick={handleDelete} 
                ml={3} 
                isLoading={isDeleting}
                size="sm"
              >
                Delete Service
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
};