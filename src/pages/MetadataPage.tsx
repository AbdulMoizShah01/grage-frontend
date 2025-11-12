import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { FaCar } from "react-icons/fa";
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
  Card,
  CardBody,
  CardHeader,
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
  VStack,
  Flex,
  Badge,
  useBreakpointValue,
  Grid,
  GridItem,
  Wrap,
  WrapItem,
  Avatar,
  Skeleton,
  SkeletonText,
  Icon
} from '@chakra-ui/react';
import { 
  FiEdit2, 
  FiPlus, 
  FiSearch, 
  FiTrash2, 
  FiUser,  
  FiPhone, 
  FiMail,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiBarChart2
} from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { useMetadata, MetadataInput } from '../hooks/useMetadata';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { MetadataRecord } from '../types/api';
import { FormModal } from '../components/forms/FormModal';
import { StatCard } from '../components/cards/StatCard';
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

// Skeleton loader for metadata cards
const MetadataCardSkeleton = () => (
  <Card>
    <CardBody>
      <Stack spacing={4}>
        <Skeleton height="20px" width="60%" />
        <Skeleton height="16px" width="40%" />
        <Skeleton height="16px" width="70%" />
        <Skeleton height="16px" width="50%" />
        <HStack spacing={2}>
          <Skeleton height="24px" width="60px" />
          <Skeleton height="24px" width="50px" />
        </HStack>
      </Stack>
    </CardBody>
  </Card>
);

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

  // Responsive values
  const gridColumns = useBreakpointValue({ 
    base: 1, 
    sm: 2, 
    lg: 3, 
    xl: 4 
  });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const modalSize = useBreakpointValue({ base: 'full', md: 'xl', lg: '4xl' });
  const statsGridColumns = useBreakpointValue({ base: 2, md: 4 });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('brand.500', 'brand.300');

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
        toast({ 
          status: 'success', 
          title: 'Metadata updated successfully',
          position: 'top-right'
        });
      } else {
        await createMetadata(formState);
        toast({ 
          status: 'success', 
          title: 'Metadata added successfully',
          position: 'top-right'
        });
      }
      formDisclosure.onClose();
      resetForm();
    } catch (submitError) {
      toast({
        status: 'error',
        title: 'Unable to save metadata',
        description: submitError instanceof Error ? submitError.message : 'Please try again.',
        position: 'top-right'
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
      toast({ 
        status: 'success', 
        title: 'Metadata deleted successfully',
        position: 'top-right'
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to delete metadata',
        description: deleteError instanceof Error ? deleteError.message : 'Please try again.',
        position: 'top-right'
      });
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!records.length) return null;
    
    const totalCustomers = records.length;
    const totalVehicles = records.length;
    const totalOpenOrders = records.reduce((sum, record) => sum + record.stats.openWorkOrders, 0);
    const totalOutstanding = records.reduce((sum, record) => sum + record.stats.outstandingBalance, 0);

    return {
      totalCustomers,
      totalVehicles,
      totalOpenOrders,
      totalOutstanding
    };
  }, [records]);

  return (
    <AppShell
      title="Customer & Vehicle Database"
      inventoryAlertsCount={summary?.inventoryAlertsCount}
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Metadata' }
      ]}
      actions={
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="brand" 
          onClick={openCreateModal}
          size={buttonSize}
        >
          Add Record
        </Button>
      }
    >
      <Stack spacing={6}>
        {/* Summary Statistics */}
        {summaryStats && (
          <SimpleGrid columns={statsGridColumns} gap={4}>
            <StatCard 
              label="Total Customers" 
              value={summaryStats.totalCustomers}
              icon={FiUser}
              colorScheme="blue"
              size="sm"
            />
            <StatCard 
              label="Total Vehicles" 
              value={summaryStats.totalVehicles}
              icon={FaCar}
              colorScheme="green"
              size="sm"
            />
            <StatCard 
              label="Open Work Orders" 
              value={summaryStats.totalOpenOrders}
              icon={FiBarChart2}
              colorScheme="orange"
              size="sm"
            />
            <StatCard 
              label="Outstanding Balance" 
              value={formatCurrency(summaryStats.totalOutstanding)}
              icon={FiDollarSign}
              colorScheme="red"
              size="sm"
              isCurrency
            />
          </SimpleGrid>
        )}

        {/* Search and Filters */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stack spacing={4}>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color={mutedText} />
                </InputLeftElement>
                <Input
                  placeholder="Search by customer name, vehicle plate, VIN, make, model, or year..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  borderRadius="lg"
                />
              </InputGroup>
              
              {/* Quick Filters */}
              <Wrap spacing={2}>
                <Tag 
                  size="md" 
                  variant={searchTerm ? 'subtle' : 'solid'} 
                  colorScheme="brand"
                  cursor="pointer"
                  onClick={() => setSearchTerm('')}
                >
                  All Records
                </Tag>
                <Tag 
                  size="md" 
                  variant="subtle"
                  colorScheme="orange"
                  cursor="pointer"
                  onClick={() => setSearchTerm('status:active')}
                >
                  Active Work Orders
                </Tag>
                <Tag 
                  size="md" 
                  variant="subtle"
                  colorScheme="red"
                  cursor="pointer"
                  onClick={() => setSearchTerm('balance:outstanding')}
                >
                  Outstanding Balance
                </Tag>
              </Wrap>
            </Stack>
          </CardBody>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <SimpleGrid columns={gridColumns} spacing={4}>
            {Array.from({ length: 8 }).map((_, index) => (
              <MetadataCardSkeleton key={index} />
            ))}
          </SimpleGrid>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">Unable to load metadata records</Text>
              <Text fontSize="sm" mt={1}>
                {error instanceof Error ? error.message : 'Please check your connection and try again.'}
              </Text>
            </Box>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && records.length === 0 && (
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody textAlign="center" py={12}>
              <Icon as={FiUser} boxSize={12} color={mutedText} mb={4} />
              <Text fontSize="lg" fontWeight="semibold" mb={2}>
                No metadata records found
              </Text>
              <Text color={mutedText} mb={6}>
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first customer and vehicle'}
              </Text>
              <Button 
                leftIcon={<FiPlus />} 
                colorScheme="brand" 
                onClick={openCreateModal}
                size="lg"
              >
                Add First Record
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Records Grid */}
        {!isLoading && !error && records.length > 0 && (
          <SimpleGrid columns={gridColumns} spacing={4}>
            {records.map((record) => (
              <Card 
                key={record.id} 
                bg={cardBg} 
                border="1px" 
                borderColor={borderColor}
                transition="all 0.2s"
                _hover={{ 
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                  borderColor: accentColor
                }}
                cursor="pointer"
                onClick={() => openEditModal(record)}
              >
                <CardHeader pb={3}>
                  <Flex justify="space-between" align="flex-start">
                    <Box flex={1}>
                      <HStack spacing={2} mb={2}>
                        <Avatar 
                          size="sm" 
                          name={`${record.customer.firstName} ${record.customer.lastName}`}
                          bg="brand.500"
                          color="white"
                        />
                        <Box>
                          <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                            {record.customer.firstName} {record.customer.lastName}
                          </Text>
                          <Text fontSize="sm" color={mutedText} noOfLines={1}>
                            {record.customer.company}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                    <HStack spacing={1}>
                      <Tooltip label="Edit">
                        <IconButton
                          aria-label="Edit metadata"
                          icon={<FiEdit2 />}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(record);
                          }}
                        />
                      </Tooltip>
                      <Tooltip label="Delete">
                        <IconButton
                          aria-label="Delete metadata"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(record);
                          }}
                          isDisabled={isDeleting}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                </CardHeader>

                <CardBody pt={0}>
                  <VStack align="stretch" spacing={4}>
                    {/* Vehicle Information */}
                    <Box>
                      <HStack spacing={2} mb={2}>
                        <Icon as={FaCar} color={accentColor} />
                        <Text fontWeight="semibold" color={accentColor}>
                          Vehicle Details
                        </Text>
                      </HStack>
                      <Text fontWeight="medium" fontSize="lg">
                        {record.vehicle.year} {record.vehicle.make} {record.vehicle.model}
                      </Text>
                      <VStack align="stretch" spacing={1} mt={2}>
                        <Text fontSize="sm" color={mutedText}>
                          <strong>VIN:</strong> {record.vehicle.vin}
                        </Text>
                        {record.vehicle.licensePlate && (
                          <Text fontSize="sm" color={mutedText}>
                            <strong>Plate:</strong> {record.vehicle.licensePlate}
                          </Text>
                        )}
                        {record.vehicle.color && (
                          <Text fontSize="sm" color={mutedText}>
                            <strong>Color:</strong> {record.vehicle.color}
                          </Text>
                        )}
                      </VStack>
                    </Box>

                    {/* Contact Information */}
                    <Box>
                      <HStack spacing={2} mb={2}>
                        <Icon as={FiUser} color={accentColor} />
                        <Text fontWeight="semibold" color={accentColor}>
                          Contact Info
                        </Text>
                      </HStack>
                      <VStack align="stretch" spacing={1}>
                        <HStack spacing={2}>
                          <Icon as={FiPhone} size="12px" color={mutedText} />
                          <Text fontSize="sm">{record.customer.phone}</Text>
                        </HStack>
                        {record.customer.email && (
                          <HStack spacing={2}>
                            <Icon as={FiMail} size="12px" color={mutedText} />
                            <Text fontSize="sm" noOfLines={1}>{record.customer.email}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>

                    {/* Statistics */}
                    <Box>
                      <HStack spacing={2} mb={2}>
                        <Icon as={FiBarChart2} color={accentColor} />
                        <Text fontWeight="semibold" color={accentColor}>
                          Statistics
                        </Text>
                      </HStack>
                      <SimpleGrid columns={2} spacing={2}>
                        <Box>
                          <Text fontSize="xs" color={mutedText}>Work Orders</Text>
                          <HStack spacing={1}>
                            <Badge 
                              colorScheme={record.stats.openWorkOrders > 0 ? 'orange' : 'green'} 
                              variant="subtle"
                              size="sm"
                            >
                              {record.stats.openWorkOrders} active
                            </Badge>
                            <Badge variant="subtle" size="sm">
                              {record.stats.totalWorkOrders} total
                            </Badge>
                          </HStack>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color={mutedText}>Balance</Text>
                          <Text fontSize="sm" fontWeight="bold" color={record.stats.outstandingBalance > 0 ? 'red.500' : 'green.500'}>
                            {formatCurrency(record.stats.outstandingBalance)}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </Box>

                    {/* Recent Activity */}
                    {record.recentWorkOrders.length > 0 && (
                      <Box>
                        <Text fontSize="xs" color={mutedText} mb={2}>
                          Recent Activity
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {record.recentWorkOrders.slice(0, 2).map((order) => (
                            <Box 
                              key={order.id} 
                              p={2} 
                              borderRadius="md" 
                              bg={hoverBg}
                              fontSize="xs"
                            >
                              <Text fontWeight="medium" noOfLines={1}>{order.code}</Text>
                              <Text color={mutedText} noOfLines={1}>
                                {order.status} • {formatCurrency(Number(order.totalCost))}
                              </Text>
                            </Box>
                          ))}
                          {record.recentWorkOrders.length > 2 && (
                            <Text fontSize="xs" color={mutedText} textAlign="center">
                              +{record.recentWorkOrders.length - 2} more
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Form Modal */}
      <FormModal
        isOpen={formDisclosure.isOpen}
        onClose={() => {
          formDisclosure.onClose();
          resetForm();
        }}
        title={recordBeingEdited ? 'Edit Customer & Vehicle' : 'Add New Customer & Vehicle'}
        onSubmit={handleSubmit}
        isSubmitting={recordBeingEdited ? isUpdating : isCreating}
        size={(modalSize ?? 'xl') as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full'}
        submitLabel={recordBeingEdited ? 'Update Record' : 'Create Record'}
        variant="default"
      >
        <Stack spacing={6} divider={<Divider />}>
          {/* Customer Section */}
          <Box>
            <HStack spacing={3} mb={4}>
              <Icon as={FiUser} color="brand.500" boxSize={5} />
              <Text fontSize="lg" fontWeight="semibold">Customer Information</Text>
            </HStack>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <FormControl isRequired>
                <FormLabel>First Name</FormLabel>
                <Input 
                  value={formState.customer.firstName} 
                  onChange={handleFormChange('customer', 'firstName')}
                  placeholder="Enter first name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input 
                  value={formState.customer.lastName} 
                  onChange={handleFormChange('customer', 'lastName')}
                  placeholder="Enter last name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input 
                  value={formState.customer.phone} 
                  onChange={handleFormChange('customer', 'phone')}
                  placeholder="Enter phone number"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Email Address</FormLabel>
                <Input 
                  type="email"
                  value={formState.customer.email} 
                  onChange={handleFormChange('customer', 'email')}
                  placeholder="Enter email address"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Company</FormLabel>
                <Input 
                  value={formState.customer.company} 
                  onChange={handleFormChange('customer', 'company')}
                  placeholder="Enter company name"
                />
              </FormControl>
            </Grid>
            <FormControl mt={4}>
              <FormLabel>Customer Notes</FormLabel>
              <Textarea 
                value={formState.customer.notes} 
                onChange={handleFormChange('customer', 'notes')} 
                rows={3}
                placeholder="Additional notes about the customer..."
              />
            </FormControl>
          </Box>

          {/* Vehicle Section */}
          <Box>
            <HStack spacing={3} mb={4}>
              <Icon as={FaCar} color="brand.500" boxSize={5} />
              <Text fontSize="lg" fontWeight="semibold">Vehicle Information</Text>
            </HStack>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <FormControl isRequired>
                <FormLabel>VIN</FormLabel>
                <Input 
                  value={formState.vehicle.vin} 
                  onChange={handleFormChange('vehicle', 'vin')}
                  placeholder="Enter vehicle VIN"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Make</FormLabel>
                <Input 
                  value={formState.vehicle.make} 
                  onChange={handleFormChange('vehicle', 'make')}
                  placeholder="Enter vehicle make"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Model</FormLabel>
                <Input 
                  value={formState.vehicle.model} 
                  onChange={handleFormChange('vehicle', 'model')}
                  placeholder="Enter vehicle model"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Year</FormLabel>
                <Input
                  type="number"
                  value={formState.vehicle.year}
                  onChange={handleFormChange('vehicle', 'year')}
                  placeholder="Enter vehicle year"
                />
              </FormControl>
              <FormControl>
                <FormLabel>License Plate</FormLabel>
                <Input 
                  value={formState.vehicle.licensePlate ?? ''} 
                  onChange={handleFormChange('vehicle', 'licensePlate')}
                  placeholder="Enter license plate"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Mileage</FormLabel>
                <Input
                  type="number"
                  value={formState.vehicle.mileage || ''}
                  onChange={handleFormChange('vehicle', 'mileage')}
                  placeholder="Enter current mileage"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Color</FormLabel>
                <Input 
                  value={formState.vehicle.color ?? ''} 
                  onChange={handleFormChange('vehicle', 'color')}
                  placeholder="Enter vehicle color"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Engine</FormLabel>
                <Input 
                  value={formState.vehicle.engine ?? ''} 
                  onChange={handleFormChange('vehicle', 'engine')}
                  placeholder="Enter engine details"
                />
              </FormControl>
            </Grid>
            <FormControl mt={4}>
              <FormLabel>Vehicle Notes</FormLabel>
              <Textarea 
                value={formState.vehicle.notes} 
                onChange={handleFormChange('vehicle', 'notes')} 
                rows={3}
                placeholder="Additional notes about the vehicle..."
              />
            </FormControl>
          </Box>
        </Stack>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        isOpen={deleteDisclosure.isOpen} 
        leastDestructiveRef={cancelDeleteRef} 
        onClose={closeDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Record
            </AlertDialogHeader>
            <AlertDialogBody>
              {recordPendingDelete && (
                <VStack align="stretch" spacing={3}>
                  <Text>
                    Are you sure you want to delete the record for{' '}
                    <strong>{recordPendingDelete.customer.firstName} {recordPendingDelete.customer.lastName}</strong>?
                  </Text>
                  <Text color={mutedText}>
                    This will remove the customer and their vehicle ({recordPendingDelete.vehicle.year} {recordPendingDelete.vehicle.make} {recordPendingDelete.vehicle.model}) 
                    from the system. This action cannot be undone.
                  </Text>
                  {recordPendingDelete.stats.totalWorkOrders > 0 && (
                    <Alert status="warning" size="sm" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        This customer has {recordPendingDelete.stats.totalWorkOrders} work order(s) associated with them.
                        Deleting this record may affect work order history.
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
                Delete Record
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
};