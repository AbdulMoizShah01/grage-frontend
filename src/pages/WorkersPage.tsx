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
  Card,
  CardBody,
  CardHeader,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
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
  Tag,
  TagLabel,
  useDisclosure,
  useToast,
  useColorModeValue,
  useBreakpointValue,
  VStack,
  Badge,
  Wrap,
  WrapItem,
  Avatar,
  Progress
} from '@chakra-ui/react';
import { FiEdit2, FiInfo, FiSearch, FiTrash2, FiUser, FiPhone, FiDollarSign, FiTrendingUp, FiPackage } from 'react-icons/fi';
import { MdAdd, MdWork, MdWarning, MdPayment, MdAttachMoney, MdSchedule } from 'react-icons/md';

import { AppShell } from '../components/shell/AppShell';
import { FormModal } from '../components/forms/FormModal';
import { StatCard } from '../components/cards/StatCard';
import { useWorkers } from '../hooks/useWorkers';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { ApiError } from '../api/client';
import { useApiQuery } from '../hooks/useApiQuery';
import { Worker, WorkerDetail } from '../types/api';
import { WorkOrderStatus } from '../types/enums';
import { formatCurrency } from '../utils/formatting';

const initialFormState = {
  name: '',
  phone: '',
  salaryAmount: '',
  salaryFrequency: 'MONTHLY',
  commuteExpense: '',
  shiftExpense: '',
  mealExpense: '',
  otherExpense: ''
};

const sanitizeOptionalField = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const parseExpenseField = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const toExpenseNumber = (value: string | undefined | null) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTotalExpenses = (worker: Worker | WorkerDetail) =>
  toExpenseNumber(worker.commuteExpense) +
  toExpenseNumber(worker.shiftExpense) +
  toExpenseNumber(worker.mealExpense) +
  toExpenseNumber(worker.otherExpense);

const statusColorMap: Record<WorkOrderStatus, string> = {
  PENDING: 'gray',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red'
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatStatusLabel = (status: WorkOrderStatus) => toTitleCase(status.replace(/_/g, ' '));

const formatDateTime = (value: string) => new Date(value).toLocaleString();

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

// Skeleton loader for worker rows
const WorkerRowSkeleton = () => (
  <Tr>
    <Td><Skeleton height="20px" /></Td>
    <Td><Skeleton height="20px" width="100px" /></Td>
    <Td><Skeleton height="20px" width="60px" /></Td>
    <Td><Skeleton height="20px" width="60px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
    <Td><Skeleton height="20px" width="60px" /></Td>
    <Td><Skeleton height="20px" width="100px" /></Td>
  </Tr>
);

export const WorkersPage = () => {
  const toast = useToast();

  // Responsive values
  const tableVariant = useBreakpointValue({ base: 'simple', md: 'striped' });
  const showMobileCards = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const modalSize = useBreakpointValue({ base: 'full', md: 'xl', lg: '2xl' });
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md', lg: 'lg' });
  const gridColumns = useBreakpointValue({ base: 2, md: 4 });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');

  const createDisclosure = useDisclosure();
  const editDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const detailDisclosure = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const [createFormState, setCreateFormState] = useState(initialFormState);
  const [editFormState, setEditFormState] = useState(initialFormState);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerPendingDelete, setWorkerPendingDelete] = useState<Worker | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [salaryUpdatingId, setSalaryUpdatingId] = useState<number | null>(null);

  const {
    data: workers,
    isLoading,
    error,
    createWorker,
    isCreating,
    updateWorker,
    isUpdating,
    deleteWorker,
    isDeleting,
    updateSalaryStatus,
    isUpdatingSalaryStatus
  } = useWorkers();

  const { data: summary } = useDashboardSummary();

  const workerDetailQuery = useApiQuery<WorkerDetail>(
    ['worker', selectedWorkerId],
    `/workers/${selectedWorkerId ?? ''}`,
    { enabled: selectedWorkerId !== null }
  );
  const detailExpensesTotal = workerDetailQuery.data ? getTotalExpenses(workerDetailQuery.data) : 0;

  const sortedWorkers = useMemo(
    () => [...(workers ?? [])].sort((a, b) => b.totalJobs - a.totalJobs || b.totalServices - a.totalServices),
    [workers]
  );

  const filteredWorkers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return sortedWorkers;
    }

    return sortedWorkers.filter((worker) => {
      const matchesName = worker.name.toLowerCase().includes(term);
      const matchesPhone = worker.phone?.toLowerCase().includes(term) ?? false;
      return matchesName || matchesPhone;
    });
  }, [sortedWorkers, searchTerm]);

  const salaryAlerts = useMemo(() => sortedWorkers.filter((worker) => worker.isSalaryDue), [sortedWorkers]);

  // Calculate worker statistics
  const workerStats = useMemo(() => {
    if (!sortedWorkers.length) return null;

    const totalWorkers = sortedWorkers.length;
    const totalJobs = sortedWorkers.reduce((sum, worker) => sum + worker.totalJobs, 0);
    const totalServices = sortedWorkers.reduce((sum, worker) => sum + worker.totalServices, 0);
    const totalExpenses = sortedWorkers.reduce((sum, worker) => sum + getTotalExpenses(worker), 0);
    const pendingSalaries = salaryAlerts.length;

    return {
      totalWorkers,
      totalJobs,
      totalServices,
      totalExpenses,
      pendingSalaries
    };
  }, [sortedWorkers, salaryAlerts]);

  const handleCreateFieldChange =
    (field: keyof typeof initialFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setCreateFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleEditFieldChange =
    (field: keyof typeof initialFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setEditFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const resetCreateForm = () => setCreateFormState(initialFormState);
  const resetEditForm = () => setEditFormState(initialFormState);

  const handleCreateSubmit = async () => {
    if (!createFormState.name.trim()) {
      toast({
        status: 'warning',
        title: 'Name required',
        description: 'Please provide the worker name before saving.',
        position: 'top-right'
      });
      return;
    }

    const commuteValue = parseExpenseField(createFormState.commuteExpense);
    const shiftValue = parseExpenseField(createFormState.shiftExpense);
    const mealValue = parseExpenseField(createFormState.mealExpense);
    const otherValue = parseExpenseField(createFormState.otherExpense);
    const salaryValue = parseExpenseField(createFormState.salaryAmount);

    if (
      commuteValue === null ||
      shiftValue === null ||
      mealValue === null ||
      otherValue === null ||
      salaryValue === null
    ) {
      toast({
        status: 'warning',
        title: 'Invalid expense amount',
        description: 'Expenses must be non-negative numbers.',
        position: 'top-right'
      });
      return;
    }

    try {
      await createWorker({
        name: createFormState.name.trim(),
        phone: sanitizeOptionalField(createFormState.phone),
        salaryAmount: salaryValue ?? undefined,
        salaryFrequency: createFormState.salaryFrequency as 'DAILY' | 'MONTHLY',
        commuteExpense: commuteValue ?? undefined,
        shiftExpense: shiftValue ?? undefined,
        mealExpense: mealValue ?? undefined,
        otherExpense: otherValue ?? undefined
      });
      toast({
        status: 'success',
        title: 'Worker added successfully',
        description: `${createFormState.name.trim()} has been added to the roster.`,
        position: 'top-right'
      });
      resetCreateForm();
      createDisclosure.onClose();
    } catch (createError) {
      toast({
        status: 'error',
        title: 'Unable to add worker',
        description: getErrorMessage(createError, 'Please try again after syncing the database.'),
        position: 'top-right'
      });
    }
  };

  const handleSalaryStatusChange = async (worker: Worker, markAs: 'PAID' | 'UNPAID') => {
    try {
      setSalaryUpdatingId(worker.id);
      await updateSalaryStatus({ id: worker.id, markAs });
      toast({
        status: 'success',
        title: `Salary status updated`,
        description: `${worker.name} has been marked as ${markAs === 'PAID' ? 'paid' : 'unpaid'}.`,
        position: 'top-right'
      });
    } catch (error) {
      toast({
        status: 'error',
        title: 'Unable to update salary status',
        description: getErrorMessage(error, 'Please try again.'),
        position: 'top-right'
      });
    } finally {
      setSalaryUpdatingId(null);
    }
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setEditFormState({
      name: worker.name,
      phone: worker.phone ?? '',
      salaryAmount: worker.salaryAmount ?? '',
      salaryFrequency: worker.salaryFrequency,
      commuteExpense: worker.commuteExpense ?? '',
      shiftExpense: worker.shiftExpense ?? '',
      mealExpense: worker.mealExpense ?? '',
      otherExpense: worker.otherExpense ?? ''
    });
    editDisclosure.onOpen();
  };

  const handleEditSubmit = async () => {
    if (!editingWorker) {
      return;
    }

    if (!editFormState.name.trim()) {
      toast({
        status: 'warning',
        title: 'Name required',
        description: 'Please provide the worker name before saving.',
        position: 'top-right'
      });
      return;
    }

    const commuteValue = parseExpenseField(editFormState.commuteExpense);
    const shiftValue = parseExpenseField(editFormState.shiftExpense);
    const mealValue = parseExpenseField(editFormState.mealExpense);
    const otherValue = parseExpenseField(editFormState.otherExpense);

    if (commuteValue === null || shiftValue === null || mealValue === null || otherValue === null) {
      toast({
        status: 'warning',
        title: 'Invalid expense amount',
        description: 'Expenses must be non-negative numbers.',
        position: 'top-right'
      });
      return;
    }

    try {
      await updateWorker({
        id: editingWorker.id,
        payload: {
          name: editFormState.name.trim(),
          phone: sanitizeOptionalField(editFormState.phone),
          commuteExpense: commuteValue ?? undefined,
          shiftExpense: shiftValue ?? undefined,
          mealExpense: mealValue ?? undefined,
          otherExpense: otherValue ?? undefined
        }
      });

      toast({
        status: 'success',
        title: 'Worker updated successfully',
        description: `${editFormState.name.trim()} has been updated.`,
        position: 'top-right'
      });
      resetEditForm();
      setEditingWorker(null);
      editDisclosure.onClose();
    } catch (updateError) {
      toast({
        status: 'error',
        title: 'Unable to update worker',
        description: getErrorMessage(updateError, 'Please review the details and try again.'),
        position: 'top-right'
      });
    }
  };

  const openDeleteDialog = (worker: Worker) => {
    setWorkerPendingDelete(worker);
    deleteDisclosure.onOpen();
  };

  const closeDeleteDialog = () => {
    deleteDisclosure.onClose();
    setWorkerPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!workerPendingDelete) {
      return;
    }

    try {
      await deleteWorker(workerPendingDelete.id);
      toast({
        status: 'success',
        title: 'Worker removed',
        description: `${workerPendingDelete.name} has been removed from the roster.`,
        position: 'top-right'
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove worker',
        description: getErrorMessage(
          deleteError,
          'Remove any open assignments for this worker before deleting.'
        ),
        position: 'top-right'
      });
    }
  };

  const openDetailDrawer = (worker: Worker) => {
    setSelectedWorkerId(worker.id);
    detailDisclosure.onOpen();
  };

  const closeDetailDrawer = () => {
    detailDisclosure.onClose();
    setSelectedWorkerId(null);
  };

  // Mobile card view for workers
  const WorkerCard = ({ worker }: { worker: Worker }) => {
    const totalExpenses = getTotalExpenses(worker);
    
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
              <HStack spacing={3} flex={1}>
                <Avatar 
                  size="md" 
                  name={worker.name}
                  bg="brand.500"
                  color="white"
                />
                <Box flex={1}>
                  <Text fontWeight="bold" fontSize="lg" mb={1}>
                    {worker.name}
                  </Text>
                  <Text fontSize="sm" color={mutedText}>
                    {worker.phone ?? 'No phone'}
                  </Text>
                </Box>
              </HStack>
              {worker.isSalaryDue && (
                <Badge colorScheme="orange" variant="solid" fontSize="xs">
                  Salary Due
                </Badge>
              )}
            </Flex>

            {/* Performance Stats */}
            <SimpleGrid columns={2} spacing={4}>
              <Box textAlign="center">
                <Text fontSize="xs" color={mutedText}>Jobs</Text>
                <Text fontWeight="bold" fontSize="lg">
                  {worker.totalJobs}
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="xs" color={mutedText}>Services</Text>
                <Text fontWeight="bold" fontSize="lg">
                  {worker.totalServices}
                </Text>
              </Box>
            </SimpleGrid>

            {/* Salary Information */}
            <Box>
              <Text fontSize="sm" color={mutedText} mb={1}>Salary</Text>
              <Flex justify="space-between" align="center">
                <Text fontWeight="medium">
                  {worker.salaryAmount ? formatCurrency(Number(worker.salaryAmount)) : '—'}
                </Text>
                <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                  {worker.salaryFrequency === 'DAILY' ? 'Daily' : 'Monthly'}
                </Badge>
              </Flex>
            </Box>

            {/* Expenses */}
            <Box>
              <Text fontSize="sm" color={mutedText} mb={1}>Total Expenses</Text>
              <Text fontWeight="bold" color={accentColor}>
                {formatCurrency(totalExpenses)}
              </Text>
            </Box>

            {/* Actions */}
            <Flex justify="space-between" pt={2}>
              <HStack spacing={1}>
                <Tooltip label="View details">
                  <IconButton
                    aria-label="View worker profile"
                    icon={<FiInfo />}
                    size="sm"
                    variant="ghost"
                    onClick={() => openDetailDrawer(worker)}
                  />
                </Tooltip>
                <Tooltip label="Edit worker">
                  <IconButton
                    aria-label="Edit worker"
                    icon={<FiEdit2 />}
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(worker)}
                  />
                </Tooltip>
              </HStack>
              <HStack spacing={1}>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme={worker.isSalaryDue ? 'orange' : 'green'}
                  isLoading={salaryUpdatingId === worker.id && isUpdatingSalaryStatus}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSalaryStatusChange(worker, worker.isSalaryDue ? 'PAID' : 'UNPAID');
                  }}
                >
                  {worker.isSalaryDue ? 'Mark Paid' : 'Mark Unpaid'}
                </Button>
                <Tooltip label="Remove worker">
                  <IconButton
                    aria-label="Remove worker"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => openDeleteDialog(worker)}
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
      title="Team & Technicians"
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Team' }
      ]}
      actions={
        <Button 
          colorScheme="brand" 
          onClick={() => {
            resetCreateForm();
            createDisclosure.onOpen();
          }}
          leftIcon={<MdAdd />}
          size={buttonSize}
        >
          Add Team Member
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      <Stack spacing={6}>
        {/* Salary Alert Banner */}
        {salaryAlerts.length > 0 && (
          <Alert status="warning" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">
                Salaries due for {salaryAlerts.length} technician{salaryAlerts.length > 1 ? 's' : ''}
              </Text>
              <Text fontSize="sm">
                Use the action buttons to mark salaries as paid when processed.
              </Text>
            </Box>
          </Alert>
        )}

        {/* Worker Statistics */}
        {workerStats && (
          <SimpleGrid columns={gridColumns} gap={4}>
            <StatCard 
              label="Total Team" 
              value={workerStats.totalWorkers}
              icon={FiUser}
              colorScheme="blue"
              size="sm"
            />
            <StatCard 
              label="Total Jobs" 
              value={workerStats.totalJobs}
              icon={MdWork}
              colorScheme="green"
              size="sm"
            />
            <StatCard 
              label="Pending Salaries" 
              value={workerStats.pendingSalaries}
              icon={MdPayment}
              colorScheme="orange"
              size="sm"
            />
            <StatCard 
              label="Total Expenses" 
              value={formatCurrency(workerStats.totalExpenses)}
              icon={FiDollarSign}
              colorScheme="purple"
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
                  placeholder="Search team members by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
           
            </Stack>
          </CardBody>
        </Card>

        {/* Workers List */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={3}>
                <Icon as={MdWork} color={accentColor} boxSize={6} />
                <Text fontSize="xl" fontWeight="semibold">Team Members</Text>
              </HStack>
              {!isLoading && (
                <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                  {filteredWorkers.length} {filteredWorkers.length === 1 ? 'member' : 'members'}
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
                        <Th>Contact</Th>
                        <Th isNumeric>Jobs</Th>
                        <Th isNumeric>Services</Th>
                        <Th>Salary</Th>
                        <Th isNumeric>Expenses</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <WorkerRowSkeleton key={index} />
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
                  <Text fontWeight="semibold">Unable to load team members</Text>
                  <Text fontSize="sm" mt={1}>
                    {error instanceof Error ? error.message : 'Please check your connection and try again.'}
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredWorkers.length === 0 && (
              <Box textAlign="center" py={12}>
                <Icon as={MdWork} boxSize={12} color={mutedText} mb={4} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  {searchTerm ? 'No matching team members found' : 'No team members yet'}
                </Text>
                <Text color={mutedText} mb={6}>
                  {searchTerm 
                    ? 'Try adjusting your search terms to find what you\'re looking for.'
                    : 'Get started by adding your first team member to the roster.'
                  }
                </Text>
                {!searchTerm && (
                  <Button 
                    colorScheme="brand" 
                    onClick={() => {
                      resetCreateForm();
                      createDisclosure.onOpen();
                    }}
                    leftIcon={<MdAdd />}
                  >
                    Add First Team Member
                  </Button>
                )}
              </Box>
            )}

            {/* Results - Mobile Card View */}
            {!isLoading && !error && filteredWorkers.length > 0 && showMobileCards && (
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {filteredWorkers.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))}
              </SimpleGrid>
            )}

            {/* Results - Desktop Table View */}
            {!isLoading && !error && filteredWorkers.length > 0 && !showMobileCards && (
              <Box overflowX="auto">
                <Table variant={tableVariant}>
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th>Team Member</Th>
                      <Th>Contact</Th>
                      <Th isNumeric>Jobs Completed</Th>
                      <Th isNumeric>Services Delivered</Th>
                      <Th>Salary Status</Th>
                      <Th isNumeric>Total Expenses</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredWorkers.map((worker) => {
                      const totalExpenses = getTotalExpenses(worker);
                      
                      return (
                        <Tr 
                          key={worker.id}
                          _hover={{ bg: hoverBg }}
                          transition="background 0.2s"
                        >
                          <Td>
                            <HStack spacing={3}>
                              <Avatar 
                                size="sm" 
                                name={worker.name}
                                bg="brand.500"
                                color="white"
                              />
                              <Box>
                                <Text fontWeight="medium">{worker.name}</Text>
                                <Text fontSize="xs" color={mutedText}>
                                  {worker.totalJobs} jobs • {worker.totalServices} services
                                </Text>
                              </Box>
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="sm">{worker.phone ?? '—'}</Text>
                              <Text fontSize="xs" color={mutedText}>
                                Next due: {worker.nextSalaryDueOn ? new Date(worker.nextSalaryDueOn).toLocaleDateString() : 'N/A'}
                              </Text>
                            </VStack>
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {worker.totalJobs}
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {worker.totalServices}
                          </Td>
                          <Td>
                            <VStack align="flex-start" spacing={1}>
                              <HStack spacing={2}>
                                <Text fontWeight="medium">
                                  {worker.salaryAmount ? formatCurrency(Number(worker.salaryAmount)) : '—'}
                                </Text>
                                <Badge 
                                  colorScheme={worker.isSalaryDue ? 'orange' : 'green'} 
                                  variant="subtle"
                                  fontSize="xs"
                                >
                                  {worker.salaryFrequency === 'DAILY' ? 'Daily' : 'Monthly'}
                                </Badge>
                              </HStack>
                              <Button
                                size="xs"
                                variant="outline"
                                colorScheme={worker.isSalaryDue ? 'orange' : 'green'}
                                isLoading={salaryUpdatingId === worker.id && isUpdatingSalaryStatus}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleSalaryStatusChange(worker, worker.isSalaryDue ? 'PAID' : 'UNPAID');
                                }}
                              >
                                {worker.isSalaryDue ? 'Mark Paid' : 'Mark Unpaid'}
                              </Button>
                            </VStack>
                          </Td>
                          <Td isNumeric fontWeight="bold" color={accentColor}>
                            {formatCurrency(totalExpenses)}
                          </Td>
                          <Td>
                            <HStack justify="flex-end" spacing={1}>
                              <Tooltip label="View details">
                                <IconButton
                                  aria-label="View worker profile"
                                  icon={<FiInfo />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDetailDrawer(worker)}
                                />
                              </Tooltip>
                              <Tooltip label="Edit worker">
                                <IconButton
                                  aria-label="Edit worker"
                                  icon={<FiEdit2 />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditModal(worker)}
                                />
                              </Tooltip>
                              <Tooltip label="Remove worker">
                                <IconButton
                                  aria-label="Remove worker"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => openDeleteDialog(worker)}
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

      {/* Create Worker Modal */}
      <FormModal
        isOpen={createDisclosure.isOpen}
        onClose={() => {
          resetCreateForm();
          createDisclosure.onClose();
        }}
        title="Add Team Member"
        submitLabel="Create Worker"
        isSubmitting={isCreating}
        onSubmit={handleCreateSubmit}
        size={(modalSize ?? 'xl') as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full'}
        variant="default"
      >
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <FormControl isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input 
              value={createFormState.name} 
              onChange={handleCreateFieldChange('name')} 
              placeholder="Enter worker's full name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Phone Number</FormLabel>
            <Input 
              value={createFormState.phone} 
              onChange={handleCreateFieldChange('phone')} 
              placeholder="Contact number (optional)"
            />
          </FormControl>
          
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Text fontWeight="semibold" mb={3} color={accentColor}>Salary Information</Text>
          </GridItem>
          
          <FormControl>
            <FormLabel>Salary Amount</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={createFormState.salaryAmount}
              onChange={(value) => setCreateFormState((prev) => ({ ...prev, salaryAmount: value }))}
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Salary Frequency</FormLabel>
            <Select
              value={createFormState.salaryFrequency}
              onChange={(event) => setCreateFormState((prev) => ({ ...prev, salaryFrequency: event.target.value }))}
            >
              <option value="DAILY">Daily</option>
              <option value="MONTHLY">Monthly</option>
            </Select>
          </FormControl>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Text fontWeight="semibold" mb={3} color={accentColor}>Expense Allowances</Text>
          </GridItem>

          <FormControl>
            <FormLabel>Commute Expense</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={createFormState.commuteExpense}
              onChange={(value) =>
                setCreateFormState((prev) => ({ ...prev, commuteExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Shift Expense</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={createFormState.shiftExpense}
              onChange={(value) =>
                setCreateFormState((prev) => ({ ...prev, shiftExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Meal Expense</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={createFormState.mealExpense}
              onChange={(value) =>
                setCreateFormState((prev) => ({ ...prev, mealExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Other Expenses</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={createFormState.otherExpense}
              onChange={(value) =>
                setCreateFormState((prev) => ({ ...prev, otherExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
        </Grid>
      </FormModal>

      {/* Edit Worker Modal */}
      <FormModal
        isOpen={editDisclosure.isOpen}
        onClose={() => {
          resetEditForm();
          setEditingWorker(null);
          editDisclosure.onClose();
        }}
        title={`Edit ${editingWorker?.name}`}
        submitLabel="Save Changes"
        isSubmitting={isUpdating}
        onSubmit={handleEditSubmit}
        size={(modalSize ?? 'xl') as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full'}
        variant="default"
      >
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <FormControl isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input value={editFormState.name} onChange={handleEditFieldChange('name')} />
          </FormControl>
          <FormControl>
            <FormLabel>Phone Number</FormLabel>
            <Input value={editFormState.phone} onChange={handleEditFieldChange('phone')} />
          </FormControl>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Text fontWeight="semibold" mb={3} color={accentColor}>Expense Allowances</Text>
          </GridItem>

          <FormControl>
            <FormLabel>Commute Expense</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={editFormState.commuteExpense}
              onChange={(value) =>
                setEditFormState((prev) => ({ ...prev, commuteExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Shift Expense</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={editFormState.shiftExpense}
              onChange={(value) =>
                setEditFormState((prev) => ({ ...prev, shiftExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Meal Expense</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={editFormState.mealExpense}
              onChange={(value) =>
                setEditFormState((prev) => ({ ...prev, mealExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>Other Expenses</FormLabel>
            <NumberInput
              min={0}
              precision={2}
              value={editFormState.otherExpense}
              onChange={(value) =>
                setEditFormState((prev) => ({ ...prev, otherExpense: value }))
              }
            >
              <NumberInputField placeholder="0.00" />
            </NumberInput>
          </FormControl>
        </Grid>
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
              <HStack spacing={2}>
                <Icon as={MdWarning} color="red.500" />
                <Text>Remove Team Member</Text>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody>
              {workerPendingDelete && (
                <VStack align="stretch" spacing={3}>
                  <Text>
                    Are you sure you want to remove <strong>{workerPendingDelete.name}</strong> from the team?
                  </Text>
                  <Text color={mutedText}>
                    This will permanently remove the worker and all their associated data. This action cannot be undone.
                  </Text>
                  <Alert status="warning" size="sm" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      This worker has {workerPendingDelete.totalJobs} completed jobs and {workerPendingDelete.totalServices} services.
                      Removing them may affect historical records.
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
                Remove Team Member
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Worker Detail Drawer */}
      <Drawer 
        isOpen={detailDisclosure.isOpen} 
        placement="right" 
        size={drawerSize} 
        onClose={closeDetailDrawer}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <VStack align="flex-start" spacing={2}>
              <HStack spacing={3}>
                <Avatar 
                  size="md" 
                  name={workerDetailQuery.data?.name}
                  bg="brand.500"
                  color="white"
                />
                <Box>
                  <Text fontSize="xl" fontWeight="bold">{workerDetailQuery.data?.name ?? 'Worker Profile'}</Text>
                  <Text fontSize="sm" color={mutedText}>
                    {workerDetailQuery.data?.phone ?? 'No contact information'}
                  </Text>
                </Box>
              </HStack>
              {workerDetailQuery.data?.isSalaryDue && (
                <Badge colorScheme="orange" variant="solid">
                  Salary Due
                </Badge>
              )}
            </VStack>
          </DrawerHeader>
          <DrawerBody>
            {workerDetailQuery.isLoading ? (
              <Stack spacing={4}>
                <Skeleton height="20px" />
                <Skeleton height="20px" width="80%" />
                <Skeleton height="100px" />
              </Stack>
            ) : workerDetailQuery.error ? (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                Unable to load worker details. Please try again.
              </Alert>
            ) : workerDetailQuery.data ? (
              <Stack spacing={6}>
                {/* Performance Summary */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <HStack spacing={2}>
                      <Icon as={MdWork} color={accentColor} />
                      <Text fontWeight="semibold">Performance Summary</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box textAlign="center">
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                          {workerDetailQuery.data.totalJobs}
                        </Text>
                        <Text fontSize="sm" color={mutedText}>Jobs Completed</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                          {workerDetailQuery.data.totalServices}
                        </Text>
                        <Text fontSize="sm" color={mutedText}>Services Delivered</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Salary Information */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <HStack spacing={2}>
                      <Icon as={MdAttachMoney} color={accentColor} />
                      <Text fontWeight="semibold">Salary Information</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text>Amount</Text>
                        <Text fontWeight="medium">
                          {workerDetailQuery.data.salaryAmount ? formatCurrency(Number(workerDetailQuery.data.salaryAmount)) : '—'}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Frequency</Text>
                        <Badge colorScheme="blue" variant="subtle">
                          {workerDetailQuery.data.salaryFrequency === 'DAILY' ? 'Daily' : 'Monthly'}
                        </Badge>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Last Paid</Text>
                        <Text>
                          {workerDetailQuery.data.lastSalaryPaidAt
                            ? formatDateTime(workerDetailQuery.data.lastSalaryPaidAt)
                            : 'Not recorded'}
                        </Text>
                      </Flex>
                      <Button
                        variant="outline"
                        colorScheme={workerDetailQuery.data.isSalaryDue ? 'orange' : 'green'}
                        isLoading={salaryUpdatingId === workerDetailQuery.data.id && isUpdatingSalaryStatus}
                        onClick={() =>
                          handleSalaryStatusChange(workerDetailQuery.data, workerDetailQuery.data.isSalaryDue ? 'PAID' : 'UNPAID')
                        }
                      >
                        {workerDetailQuery.data.isSalaryDue ? 'Mark Salary as Paid' : 'Mark as Unpaid'}
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Expense Breakdown */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <HStack spacing={2}>
                      <Icon as={FiDollarSign} color={accentColor} />
                      <Text fontWeight="semibold">Expense Breakdown</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={2}>
                      <Flex justify="space-between">
                        <Text>Commute</Text>
                        <Text>{formatCurrency(toExpenseNumber(workerDetailQuery.data.commuteExpense))}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Shift</Text>
                        <Text>{formatCurrency(toExpenseNumber(workerDetailQuery.data.shiftExpense))}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Meal</Text>
                        <Text>{formatCurrency(toExpenseNumber(workerDetailQuery.data.mealExpense))}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Other</Text>
                        <Text>{formatCurrency(toExpenseNumber(workerDetailQuery.data.otherExpense))}</Text>
                      </Flex>
                      <Divider />
                      <Flex justify="space-between" fontWeight="bold">
                        <Text>Total Expenses</Text>
                        <Text color={accentColor}>{formatCurrency(detailExpensesTotal)}</Text>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Recent Assignments */}
                {workerDetailQuery.data.assignments.length > 0 && (
                  <Card variant="outline">
                    <CardHeader pb={3}>
                      <HStack spacing={2}>
                        <Icon as={MdSchedule} color={accentColor} />
                        <Text fontWeight="semibold">Recent Assignments</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack align="stretch" spacing={3}>
                        {workerDetailQuery.data.assignments.map((assignment) => (
                          <Box key={assignment.id} borderWidth="1px" borderRadius="lg" p={4}>
                            <HStack justify="space-between" align="flex-start">
                              <Box>
                                <Text fontWeight="semibold">{assignment.workOrder.code}</Text>
                                <Text fontSize="sm" color={mutedText}>
                                  Logged on {formatDateTime(assignment.createdAt)}
                                </Text>
                              </Box>
                              <Tag colorScheme={statusColorMap[assignment.workOrder.status]}>
                                <TagLabel>{formatStatusLabel(assignment.workOrder.status)}</TagLabel>
                              </Tag>
                            </HStack>
                            <Stack spacing={1} mt={3}>
                              {assignment.role && <Text fontSize="sm">Role: {assignment.role}</Text>}
                              {assignment.notes && <Text fontSize="sm">Notes: {assignment.notes}</Text>}
                              <Text fontSize="sm">Services: {assignment.servicesCount}</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                Work order total: {formatCurrency(assignment.workOrder.totalCost)}
                              </Text>
                            </Stack>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </Stack>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
};