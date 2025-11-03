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
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
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
  SimpleGrid,
  NumberInput,
  NumberInputField,
  useDisclosure,
  useToast,
  useColorModeValue,
  FormControl,
  FormLabel,
  VStack
} from '@chakra-ui/react';
import { FiEdit2, FiInfo, FiSearch, FiTrash2 } from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { useWorkers } from '../hooks/useWorkers';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { FormModal } from '../components/forms/FormModal';
import { ApiError } from '../api/client';
import { useApiQuery } from '../hooks/useApiQuery';
import { Worker, WorkerDetail } from '../types/api';
import { WorkOrderStatus } from '../types/enums';
import { formatCurrency } from '../utils/formatting';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
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

export const WorkersPage = () => {
  const toast = useToast();

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

  const {
    data: workers,
    isLoading,
    error,
    createWorker,
    isCreating,
    updateWorker,
    isUpdating,
    deleteWorker,
    isDeleting
  } = useWorkers();

  const { data: summary } = useDashboardSummary();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const detailTextColor = useColorModeValue('gray.700', 'gray.200');

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
      const matchesEmail = worker.email?.toLowerCase().includes(term) ?? false;
      const matchesPhone = worker.phone?.toLowerCase().includes(term) ?? false;
      return matchesName || matchesEmail || matchesPhone;
    });
  }, [sortedWorkers, searchTerm]);

  const handleCreateFieldChange =
    (field: keyof typeof initialFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setCreateFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleEditFieldChange =
    (field: keyof typeof initialFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setEditFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const resetCreateForm = () => setCreateFormState(initialFormState);
  const resetEditForm = () => setEditFormState(initialFormState);

  const handleCreateSubmit = async () => {
    if (!createFormState.name.trim()) {
      toast({
        status: 'warning',
        title: 'Name required',
        description: 'Please provide the worker name before saving.'
      });
      return;
    }

    const commuteValue = parseExpenseField(createFormState.commuteExpense);
    const shiftValue = parseExpenseField(createFormState.shiftExpense);
    const mealValue = parseExpenseField(createFormState.mealExpense);
    const otherValue = parseExpenseField(createFormState.otherExpense);

    if (commuteValue === null || shiftValue === null || mealValue === null || otherValue === null) {
      toast({
        status: 'warning',
        title: 'Invalid expense amount',
        description: 'Expenses must be non-negative numbers.'
      });
      return;
    }

    try {
      await createWorker({
        name: createFormState.name.trim(),
        email: sanitizeOptionalField(createFormState.email),
        phone: sanitizeOptionalField(createFormState.phone),
        commuteExpense: commuteValue ?? undefined,
        shiftExpense: shiftValue ?? undefined,
        mealExpense: mealValue ?? undefined,
        otherExpense: otherValue ?? undefined
      });
      toast({
        status: 'success',
        title: 'Worker added',
        description: `${createFormState.name.trim()} has been added to the roster.`
      });
      resetCreateForm();
      createDisclosure.onClose();
    } catch (createError) {
      toast({
        status: 'error',
        title: 'Unable to add worker',
        description: getErrorMessage(createError, 'Please try again after syncing the database.')
      });
    }
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setEditFormState({
      name: worker.name,
      email: worker.email ?? '—',
      phone: worker.phone ?? '—',
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
        description: 'Please provide the worker name before saving.'
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
        description: 'Expenses must be non-negative numbers.'
      });
      return;
    }

    try {
      await updateWorker({
        id: editingWorker.id,
        payload: {
          name: editFormState.name.trim(),
          email: sanitizeOptionalField(editFormState.email),
          phone: sanitizeOptionalField(editFormState.phone),
          commuteExpense: commuteValue ?? undefined,
          shiftExpense: shiftValue ?? undefined,
          mealExpense: mealValue ?? undefined,
          otherExpense: otherValue ?? undefined
        }
      });

      toast({
        status: 'success',
        title: 'Worker updated',
        description: `${editFormState.name.trim()} has been updated.`
      });
      resetEditForm();
      setEditingWorker(null);
      editDisclosure.onClose();
    } catch (updateError) {
      toast({
        status: 'error',
        title: 'Unable to update worker',
        description: getErrorMessage(updateError, 'Please review the details and try again.')
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
        description: `${workerPendingDelete.name} has been removed from the roster.`
      });
      closeDeleteDialog();
    } catch (deleteError) {
      toast({
        status: 'error',
        title: 'Unable to remove worker',
        description: getErrorMessage(
          deleteError,
          'Remove any open assignments for this worker before deleting.'
        )
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

  return (
    <AppShell
      title="Team & Technicians"
      actions={
        <Button
          colorScheme="brand"
          onClick={() => {
            resetCreateForm();
            createDisclosure.onOpen();
          }}
        >
          Add Worker
        </Button>
      }
      inventoryAlertsCount={summary?.inventoryAlertsCount}
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Failed to load worker catalog
        </Alert>
      ) : (
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <Box px={6} py={4}>
            <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
              <InputGroup maxW="320px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="var(--chakra-colors-gray-400)" />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, email, or phone"
                />
              </InputGroup>
              <Text color={mutedText} fontSize="sm">
                {filteredWorkers.length} of {sortedWorkers.length} team members showing
              </Text>
            </Flex>
          </Box>
          <Divider />
          <Table>
            <Thead bg={headerBg}>
              <Tr>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th isNumeric>Jobs Completed</Th>
                <Th isNumeric>Services Delivered</Th>
                <Th isNumeric>Total Expenses</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredWorkers.length === 0 ? (
                <Tr>
                  <Td colSpan={6}>
                    <Text color={mutedText}>
                      {searchTerm.trim()
                        ? 'No workers match your search.'
                        : 'No team members recorded yet.'}
                    </Text>
                  </Td>
                </Tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <Tr key={worker.id} _hover={{ bg: rowHoverBg }}>
                    <Td>
                      <Text fontWeight="medium">{worker.name}</Text>
                    </Td>
                    <Td>
                      <VStack align="flex-start" spacing={0}>
                        <Text>{worker.email ?? '—'}</Text>
                        <Text>{worker.phone ?? '—'}</Text>
                      </VStack>
                    </Td>
                    <Td isNumeric>{worker.totalJobs}</Td>
                    <Td isNumeric>{worker.totalServices}</Td>
                    <Td isNumeric>{formatCurrency(getTotalExpenses(worker))}</Td>
                    <Td>
                      <HStack justify="flex-end" spacing={2}>
                        <Tooltip label="View worker profile">
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
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      <FormModal
        isOpen={createDisclosure.isOpen}
        onClose={() => {
          resetCreateForm();
          createDisclosure.onClose();
        }}
        title="Add Worker"
        isSubmitting={isCreating}
        onSubmit={handleCreateSubmit}
      >
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input value={createFormState.name} onChange={handleCreateFieldChange('name')} />
          </FormControl>
          <HStack spacing={4} w="100%">
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={createFormState.email} onChange={handleCreateFieldChange('email')} />
            </FormControl>
            <FormControl>
              <FormLabel>Phone</FormLabel>
              <Input value={createFormState.phone} onChange={handleCreateFieldChange('phone')} />
            </FormControl>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
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
                <NumberInputField />
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
                <NumberInputField />
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
                <NumberInputField />
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
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </SimpleGrid>
        </VStack>
      </FormModal>

      <FormModal
        isOpen={editDisclosure.isOpen}
        onClose={() => {
          resetEditForm();
          setEditingWorker(null);
          editDisclosure.onClose();
        }}
        title="Edit Worker"
        submitLabel="Save Changes"
        isSubmitting={isUpdating}
        onSubmit={handleEditSubmit}
      >
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input value={editFormState.name} onChange={handleEditFieldChange('name')} />
            </FormControl>
            <HStack spacing={4} w="100%">
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={editFormState.email} onChange={handleEditFieldChange('email')} />
              </FormControl>
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input value={editFormState.phone} onChange={handleEditFieldChange('phone')} />
              </FormControl>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
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
                  <NumberInputField />
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
                  <NumberInputField />
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
                  <NumberInputField />
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
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
          </VStack>
        </FormModal>

      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Worker
            </AlertDialogHeader>

            <AlertDialogBody>
              {workerPendingDelete
                ? `Are you sure you want to remove ${workerPendingDelete.name}? This action cannot be undone.`
                : 'Are you sure you want to remove this worker?'}
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

      <Drawer isOpen={detailDisclosure.isOpen} placement="right" size="md" onClose={closeDetailDrawer}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {workerDetailQuery.data?.name ?? 'Worker profile'}
          </DrawerHeader>
          <DrawerBody>
            {workerDetailQuery.isLoading ? (
              <Spinner />
            ) : workerDetailQuery.error ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                Unable to load worker details. Try again in a moment.
              </Alert>
            ) : workerDetailQuery.data ? (
              <Stack spacing={6}>
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    Contact
                  </Text>
                  <Stack spacing={1} color={detailTextColor}>
                    <Text>Email: {workerDetailQuery.data.email ?? '—'}</Text>
                    <Text>Phone: {workerDetailQuery.data.phone ?? '—'}</Text>
                  </Stack>
                </Box>
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    Performance
                  </Text>
                  <HStack spacing={6}>
                    <Box>
                      <Text fontSize="sm" color={mutedText}>
                        Jobs completed
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold">
                        {workerDetailQuery.data.totalJobs}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={mutedText}>
                        Services delivered
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold">
                        {workerDetailQuery.data.totalServices}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    Expenses
                  </Text>
                  <Stack spacing={1} color={detailTextColor}>
                    <Text>Commute: {formatCurrency(toExpenseNumber(workerDetailQuery.data.commuteExpense))}</Text>
                    <Text>Shift: {formatCurrency(toExpenseNumber(workerDetailQuery.data.shiftExpense))}</Text>
                    <Text>Meal: {formatCurrency(toExpenseNumber(workerDetailQuery.data.mealExpense))}</Text>
                    <Text>Other: {formatCurrency(toExpenseNumber(workerDetailQuery.data.otherExpense))}</Text>
                    <Text fontWeight="semibold">
                      Total: {formatCurrency(detailExpensesTotal)}
                    </Text>
                  </Stack>
                </Box>
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    Profile
                  </Text>
                  <Stack spacing={1} color={detailTextColor}>
                    <Text>Created: {formatDateTime(workerDetailQuery.data.createdAt)}</Text>
                    <Text>Last updated: {formatDateTime(workerDetailQuery.data.updatedAt)}</Text>
                  </Stack>
                </Box>
                <Divider />
                <Box>
                  <Text fontWeight="medium" mb={3}>
                    Recent assignments
                  </Text>
                  {workerDetailQuery.data.assignments.length === 0 ? (
                    <Text color={mutedText}>No assignments recorded for this worker.</Text>
                  ) : (
                    <Stack spacing={4}>
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
                          <Stack spacing={1} mt={3} color={detailTextColor}>
                            {assignment.role ? <Text>Role: {assignment.role}</Text> : null}
                            {assignment.notes ? <Text>Notes: {assignment.notes}</Text> : null}
                            <Text>Services: {assignment.servicesCount}</Text>
                            <Text>
                              Work order total: {formatCurrency(assignment.workOrder.totalCost)}
                            </Text>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Stack>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
};


