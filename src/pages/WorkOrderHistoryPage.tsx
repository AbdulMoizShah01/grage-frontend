import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import { FiDownload, FiRefreshCcw, FiSearch } from 'react-icons/fi';
import { MdPrint } from 'react-icons/md';

import { AppShell } from '../components/shell/AppShell';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatCurrency } from '../utils/formatting';
import { buildInvoiceCode, downloadInvoice } from '../utils/invoices';
import { WorkOrderStatus } from '../types/enums';
import { WorkOrder } from '../types/api';

const statusColor: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.IN_PROGRESS]: 'blue',
  [WorkOrderStatus.COMPLETED]: 'green',
  [WorkOrderStatus.PENDING]: 'orange',
  [WorkOrderStatus.CANCELLED]: 'red'
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');

export const WorkOrderHistoryPage = () => {
  const toast = useToast();
  const detailDisclosure = useDisclosure();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderSnapshot, setSelectedOrderSnapshot] = useState<WorkOrder | null>(null);

  const { data: summary } = useDashboardSummary();
  const {
    data,
    isLoading,
    error,
    filters,
    updateFilters,
    setFilters
  } = useWorkOrders({ status: 'ALL', historical: true });
  const detailQuery = useApiQuery<WorkOrder>(
    ['work-orders', 'detail', selectedOrderId],
    `/work-orders/${selectedOrderId ?? ''}`,
    { enabled: selectedOrderId !== null }
  );

  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
  const [historicalOnly, setHistoricalOnly] = useState(filters.historical ?? true);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>(filters.status ?? 'ALL');

  const history = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    updateFilters({ historical: historicalOnly ? true : undefined });
  }, [historicalOnly, updateFilters]);

  useEffect(() => {
    updateFilters({ status: statusFilter });
  }, [statusFilter, updateFilters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    updateFilters({ search: value.trim() || undefined });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setHistoricalOnly(true);
    setStatusFilter('ALL');
    setFilters({
      ...filters,
      search: undefined,
      from: undefined,
      to: undefined,
      historical: true,
      status: 'ALL'
    });
  };

  const handleExportCsv = () => {
    if (history.length === 0) {
      toast({
        status: 'info',
        title: 'No work orders to export',
        description: 'Try adjusting your filters first.'
      });
      return;
    }

    const headers = ['Code', 'Status', 'Customer', 'Vehicle', 'Completed', 'Total'];
    const rows = history.map((order) => [
      order.code,
      order.status,
      order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unassigned',
      `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`,
      formatDate(order.completedDate ?? order.updatedAt),
      formatCurrency(Number(order.totalCost))
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? '');
            return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work-order-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openOrderDetail = (order: WorkOrder) => {
    setSelectedOrderId(order.id);
    setSelectedOrderSnapshot(order);
    detailDisclosure.onOpen();
  };

  const closeOrderDetail = () => {
    detailDisclosure.onClose();
    setSelectedOrderId(null);
    setSelectedOrderSnapshot(null);
  };

  const detail = detailQuery.data ?? selectedOrderSnapshot ?? undefined;

  const handleDownloadInvoice = async (order: WorkOrder) => {
    try {
      const invoiceName = buildInvoiceCode(order).replace(/\//g, '-');
      await downloadInvoice(order.id, invoiceName);
      toast({ status: 'success', title: 'Invoice generated.' });
    } catch (error) {
      toast({
        status: 'error',
        title: 'Unable to generate invoice.',
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    }
  };

  return (
    <AppShell
      title="Work Order History"
      inventoryAlertsCount={summary?.inventoryAlertsCount}
      actions={
        <HStack spacing={3}>
          <Button
            leftIcon={<FiDownload />}
            colorScheme="brand"
            variant="outline"
            onClick={handleExportCsv}
            isDisabled={history.length === 0}
          >
            Export CSV
          </Button>
          <Tooltip label="Reset filters">
            <IconButton
              aria-label="Reset filters"
              icon={<FiRefreshCcw />}
              variant="ghost"
              onClick={clearFilters}
            />
          </Tooltip>
        </HStack>
      }
    >
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={3}
        align={{ base: 'stretch', md: 'center' }}
        mb={4}
      >
        <InputGroup maxW="260px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="var(--chakra-colors-gray-400)" />
          </InputLeftElement>
          <Input placeholder="Search by code, customer, plate, make, model, or VIN" value={searchTerm} onChange={handleSearchChange} />
        </InputGroup>
        <HStack spacing={3} align={{ base: 'flex-start', md: 'center' }}>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as WorkOrderStatus | 'ALL')}
            maxW="220px"
          >
            <option value="ALL">All statuses</option>
            <option value={WorkOrderStatus.IN_PROGRESS}>In progress</option>
            <option value={WorkOrderStatus.COMPLETED}>Completed</option>
            <option value={WorkOrderStatus.PENDING}>Pending</option>
            <option value={WorkOrderStatus.CANCELLED}>Cancelled</option>
          </Select>
          <HStack>
            <Switch isChecked={historicalOnly} onChange={(event) => setHistoricalOnly(event.target.checked)} />
            <Text fontSize="sm" color={mutedText}>
              Historical only
            </Text>
          </HStack>
        </HStack>
      </Stack>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Unable to load historical work orders
        </Alert>
      ) : (
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <Table>
            <Thead bg={headerBg}>
              <Tr>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th>Customer</Th>
                <Th>Vehicle</Th>
                <Th>Completed</Th>
                <Th isNumeric>Total</Th>
                <Th textAlign="right">Invoice</Th>
              </Tr>
            </Thead>
            <Tbody>
              {history.length === 0 ? (
                <Tr>
                  <Td colSpan={6}>
                    <Text color={mutedText}>No work orders found for the selected filters.</Text>
                  </Td>
                </Tr>
              ) : (
                history.map((order) => (
                  <Tr key={order.id} _hover={{ bg: rowHoverBg }} cursor="pointer" onClick={() => openOrderDetail(order)}>
                    <Td>{order.code}</Td>
                    <Td>
                      <Badge colorScheme={statusColor[order.status] ?? 'gray'}>{order.status}</Badge>
                    </Td>
                    <Td>
                      {order.customer
                        ? `${order.customer.firstName} ${order.customer.lastName}`
                        : 'Unassigned'}
                    </Td>
                    <Td>
                      {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                    </Td>
                    <Td>{formatDate(order.completedDate ?? order.updatedAt)}</Td>
                    <Td isNumeric>{formatCurrency(Number(order.totalCost))}</Td>
                    <Td textAlign="right">
                      <Tooltip label="Download invoice">
                        <IconButton
                          aria-label="Download invoice"
                          icon={<MdPrint />}
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDownloadInvoice(order);
                          }}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      <Drawer isOpen={detailDisclosure.isOpen} placement="right" size="lg" onClose={closeOrderDetail}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{detail?.code ?? 'Work Order'}</DrawerHeader>
          <DrawerBody>
            {detailDisclosure.isOpen && detailQuery.isLoading ? (
              <Spinner />
            ) : detail ? (
              <Stack spacing={6}>
                <HStack justify="flex-end">
                  <Button leftIcon={<MdPrint />} variant="outline" onClick={() => handleDownloadInvoice(detail)}>
                    Export Invoice
                  </Button>
                </HStack>
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Overview
                  </Text>
                  <VStack align="flex-start" spacing={1} color={mutedText}>
                    <Text>Status: {detail.status}</Text>
                    <Text>Created: {formatDate(detail.createdAt)}</Text>
                    <Text>Arrival: {formatDate(detail.arrivalDate ?? detail.createdAt)}</Text>
                    <Text>Scheduled: {formatDate(detail.scheduledDate)}</Text>
                    <Text>Completed: {formatDate(detail.completedDate)}</Text>
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Customer & Vehicle
                  </Text>
                  <VStack align="flex-start" spacing={1} color={mutedText}>
                    <Text>
                      Customer:{' '}
                      {detail.customer
                        ? `${detail.customer.firstName} ${detail.customer.lastName}`
                        : 'Unassigned'}
                    </Text>
                    <Text>
                      Vehicle: {detail.vehicle.year} {detail.vehicle.make} {detail.vehicle.model}
                    </Text>
                    <Text>VIN: {detail.vehicle.vin}</Text>
                    {detail.vehicle.licensePlate ? <Text>Plate: {detail.vehicle.licensePlate}</Text> : null}
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Financial Summary
                  </Text>
                  <VStack align="flex-start" spacing={1} color={mutedText}>
                    <Text>Labour: {formatCurrency(Number(detail.laborCost))}</Text>
                    <Text>Parts: {formatCurrency(Number(detail.partsCost))}</Text>
                    <Text>Taxes: {formatCurrency(Number(detail.taxes))}</Text>
                    <Text>Parking: {formatCurrency(Number(detail.parkingCharge))}</Text>
                    <Text>Discount: {formatCurrency(Number(detail.discount))}</Text>
                    <Text fontWeight="semibold" color={useColorModeValue('brand.600', 'blue.200')}>
                      Total: {formatCurrency(Number(detail.totalCost))}
                    </Text>
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Line Items
                  </Text>
                  {detail.lineItems.length === 0 ? (
                    <Text color={mutedText}>No line items recorded.</Text>
                  ) : (
                    <Box borderWidth="1px" borderRadius="lg" borderColor={borderColor} overflow="hidden">
                      <Table size="sm">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th>Description</Th>
                            <Th>Qty</Th>
                            <Th isNumeric>Unit</Th>
                            <Th isNumeric>Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {detail.lineItems.map((item) => (
                            <Tr key={item.id}>
                              <Td>{item.description}</Td>
                              <Td>{item.quantity}</Td>
                              <Td isNumeric>{formatCurrency(Number(item.unitPrice))}</Td>
                              <Td isNumeric>{formatCurrency(Number(item.lineTotal))}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Assignments
                  </Text>
                  {detail.assignments.length === 0 ? (
                    <Text color={mutedText}>No worker assignments.</Text>
                  ) : (
                    <VStack align="stretch" spacing={3}>
                      {detail.assignments.map((assignment) => (
                        <Box key={assignment.id} borderWidth="1px" borderRadius="md" borderColor={borderColor} p={3}>
                          <Text fontWeight="semibold">{assignment.worker.name}</Text>
                          <VStack align="flex-start" spacing={1} color={mutedText} mt={1}>
                            {assignment.role ? <Text>Role: {assignment.role}</Text> : null}
                            {assignment.notes ? <Text>Notes: {assignment.notes}</Text> : null}
                            <Text>Services completed: {assignment.servicesCount}</Text>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Recent Updates
                  </Text>
                  {detail.logs && detail.logs.length > 0 ? (
                    <VStack align="stretch" spacing={2}>
                      {detail.logs.map((log) => (
                        <Box key={log.id} borderWidth="1px" borderRadius="md" borderColor={borderColor} p={3}>
                          <Text fontWeight="semibold">{log.message}</Text>
                          <Text fontSize="sm" color={mutedText}>
                            {formatDate(log.timestamp)} {log.author ? `• ${log.author}` : ''}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text color={mutedText}>No recent log entries.</Text>
                  )}
                </Box>
              </Stack>
            ) : (
              <Text color={mutedText}>Select a work order to view its details.</Text>
            )}
          </DrawerBody>
          {detail ? (
            <>
              <Divider />
              <Box px={6} py={4} color={mutedText}>
                <Text fontSize="sm">
                  Notes: {detail.notes ? detail.notes : 'No additional notes recorded.'}
                </Text>
              </Box>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
};
