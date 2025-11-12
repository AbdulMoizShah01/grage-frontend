import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
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
  Grid,
  GridItem,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
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
  VStack,
  useBreakpointValue,
  Wrap,
  WrapItem,
  Avatar,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react';
import { FiDownload, FiRefreshCcw, FiSearch, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { MdPrint, MdReceipt, MdAssignment, MdCheckCircle, MdSchedule, MdCancel } from 'react-icons/md';

import { AppShell } from '../components/shell/AppShell';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatCurrency } from '../utils/formatting';
import { buildInvoiceCode, downloadInvoice } from '../utils/invoices';
import { WorkOrderStatus } from '../types/enums';
import { WorkOrder } from '../types/api';
import { StatCard } from '../components/cards/StatCard';

const statusColor: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.IN_PROGRESS]: 'blue',
  [WorkOrderStatus.COMPLETED]: 'green',
  [WorkOrderStatus.PENDING]: 'orange',
  [WorkOrderStatus.CANCELLED]: 'red'
};

const statusIcons: Record<WorkOrderStatus, any> = {
  [WorkOrderStatus.IN_PROGRESS]: MdAssignment,
  [WorkOrderStatus.COMPLETED]: MdCheckCircle,
  [WorkOrderStatus.PENDING]: MdSchedule,
  [WorkOrderStatus.CANCELLED]: MdCancel
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');
const formatDateShort = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

// Skeleton loader for work order rows
const WorkOrderRowSkeleton = () => (
  <Tr>
    <Td><Skeleton height="20px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
    <Td><Skeleton height="20px" width="120px" /></Td>
    <Td><Skeleton height="20px" width="100px" /></Td>
    <Td><Skeleton height="20px" width="140px" /></Td>
    <Td><Skeleton height="20px" width="80px" /></Td>
    <Td><Skeleton height="20px" width="60px" /></Td>
  </Tr>
);

// Mobile card skeleton
const WorkOrderCardSkeleton = () => (
  <Card>
    <CardBody>
      <Stack spacing={3}>
        <Skeleton height="24px" width="60%" />
        <Skeleton height="20px" width="40%" />
        <Skeleton height="16px" width="70%" />
        <Skeleton height="16px" width="50%" />
        <Skeleton height="20px" width="30%" />
      </Stack>
    </CardBody>
  </Card>
);

export const WorkOrderHistoryPage = () => {
  const toast = useToast();
  const detailDisclosure = useDisclosure();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderSnapshot, setSelectedOrderSnapshot] = useState<WorkOrder | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);

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

  // Responsive values
  const drawerSize = useBreakpointValue({ base: 'full', md: 'lg', lg: 'xl' });
  const tableVariant = useBreakpointValue({ base: 'simple', md: 'striped' });
  const showMobileCards = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const filterLayout = useBreakpointValue({ base: 'vertical', md: 'horizontal' });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const successColor = useColorModeValue('green.600', 'green.300');

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

  // Calculate statistics from the current filtered data
  const statistics = useMemo(() => {
    if (!history.length) return null;

    const totalRevenue = history.reduce((sum, order) => sum + Number(order.totalCost), 0);
    const completedOrders = history.filter(order => order.status === WorkOrderStatus.COMPLETED).length;
    const averageOrderValue = totalRevenue / history.length;
    const statusBreakdown = history.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders: history.length,
      totalRevenue,
      completedOrders,
      averageOrderValue,
      statusBreakdown
    };
  }, [history]);

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
        description: 'Try adjusting your filters first.',
        position: 'top-right'
      });
      return;
    }

    const headers = ['Code', 'Status', 'Customer', 'Vehicle', 'VIN', 'License Plate', 'Completed Date', 'Total Cost', 'Labor Cost', 'Parts Cost'];
    const rows = history.map((order) => [
      order.code,
      order.status,
      order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unassigned',
      `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`,
      order.vehicle.vin,
      order.vehicle.licensePlate || 'N/A',
      formatDate(order.completedDate ?? order.updatedAt),
      formatCurrency(Number(order.totalCost)),
      formatCurrency(Number(order.laborCost)),
      formatCurrency(Number(order.partsCost))
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

    toast({
      status: 'success',
      title: 'Export completed',
      description: `${history.length} work orders exported to CSV.`,
      position: 'top-right'
    });
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
    // Prevent multiple simultaneous downloads
    if (downloadingInvoiceId === order.id) {
      return;
    }

    try {
      setDownloadingInvoiceId(order.id);
      const invoiceName = buildInvoiceCode(order).replace(/\//g, '-');
      await downloadInvoice(order.id, invoiceName);
      toast({ 
        status: 'success', 
        title: 'Invoice downloaded successfully',
        description: `Invoice ${invoiceName} has been downloaded.`,
        position: 'top-right',
        duration: 3000
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to generate invoice';
      toast({
        status: 'error',
        title: 'Failed to download invoice',
        description: errorMessage,
        position: 'top-right',
        duration: 5000
      });
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Mobile card component for work orders
  const WorkOrderCard = ({ order }: { order: WorkOrder }) => (
    <Card 
      bg={cardBg} 
      border="1px" 
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
        cursor: 'pointer'
      }}
      onClick={() => openOrderDetail(order)}
    >
      <CardBody>
        <VStack align="stretch" spacing={3}>
          {/* Header */}
          <Flex justify="space-between" align="flex-start">
            <Box flex={1}>
              <Text fontWeight="bold" fontSize="lg" color={accentColor}>
                {order.code}
              </Text>
              <Badge
                colorScheme={statusColor[order.status]}
                variant="subtle"
                size="sm"
                mt={1}
              >
                <HStack spacing={1}>
                  <Icon as={statusIcons[order.status]} boxSize={3} />
                  <Text>{order.status}</Text>
                </HStack>
              </Badge>
            </Box>
            <Text fontWeight="bold" fontSize="lg">
              {formatCurrency(Number(order.totalCost))}
            </Text>
          </Flex>

          {/* Customer & Vehicle */}
          <Box>
            <Text fontSize="sm" color={mutedText} mb={1}>Customer & Vehicle</Text>
            <HStack spacing={2} mb={1}>
              <Avatar 
                size="xs" 
                name={order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown'}
                bg="brand.500"
              />
              <Text fontWeight="medium">
                {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unassigned'}
              </Text>
            </HStack>
            <Text fontSize="sm">
              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
            </Text>
            {order.vehicle.licensePlate && (
              <Text fontSize="xs" color={mutedText}>
                Plate: {order.vehicle.licensePlate}
              </Text>
            )}
          </Box>

          {/* Dates */}
          <Box>
            <Text fontSize="sm" color={mutedText} mb={1}>Completed</Text>
            <Text fontSize="sm">
              {formatDateShort(order.completedDate ?? order.updatedAt)}
            </Text>
          </Box>

          {/* Financial Summary */}
          <Box>
            <Text fontSize="sm" color={mutedText} mb={1}>Cost Breakdown</Text>
            <SimpleGrid columns={2} spacing={2} fontSize="xs">
              <Text>Labor: {formatCurrency(Number(order.laborCost))}</Text>
              <Text>Parts: {formatCurrency(Number(order.partsCost))}</Text>
            </SimpleGrid>
          </Box>

          {/* Actions */}
          <Flex justify="flex-end" pt={2}>
            <Tooltip label="Download invoice">
              <IconButton
                aria-label="Download invoice"
                icon={<MdPrint />}
                size="sm"
                variant="ghost"
                isLoading={downloadingInvoiceId === order.id}
                isDisabled={downloadingInvoiceId !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadInvoice(order);
                }}
              />
            </Tooltip>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <AppShell
      title="Work Order History"
      inventoryAlertsCount={summary?.inventoryAlertsCount}
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Work Orders', to: '/work-orders' },
        { label: 'History' }
      ]}
      actions={
        <HStack spacing={2}>
          <Button
            leftIcon={<FiDownload />}
            colorScheme="brand"
            variant="outline"
            onClick={handleExportCsv}
            isDisabled={history.length === 0}
            size={buttonSize}
          >
            Export CSV
          </Button>
          <Tooltip label="Reset all filters">
            <IconButton
              aria-label="Reset filters"
              icon={<FiRefreshCcw />}
              variant="ghost"
              onClick={clearFilters}
              size={buttonSize}
            />
          </Tooltip>
        </HStack>
      }
    >
      <Stack spacing={6}>
        {/* Statistics Overview */}
        {statistics && (
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <StatCard 
              label="Total Orders" 
              value={statistics.totalOrders}
              icon={MdReceipt}
              colorScheme="blue"
              size="sm"
            />
            <StatCard 
              label="Completed" 
              value={statistics.completedOrders}
              icon={MdCheckCircle}
              colorScheme="green"
              size="sm"
            />
            <StatCard 
              label="Total Revenue" 
              value={formatCurrency(statistics.totalRevenue)}
              icon={FiDollarSign}
              colorScheme="purple"
              size="sm"
              isCurrency
            />
            <StatCard 
              label="Average Order" 
              value={formatCurrency(statistics.averageOrderValue)}
              icon={MdAssignment}
              colorScheme="orange"
              size="sm"
              isCurrency
            />
          </SimpleGrid>
        )}

        {/* Filters Card */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stack 
              direction={filterLayout === 'horizontal' ? 'row' : 'column'} 
              spacing={4}
              align={filterLayout === 'horizontal' ? 'center' : 'stretch'}
              wrap="wrap"
            >
              <InputGroup maxW={{ base: '100%', md: '320px', lg:'600px' }}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color={mutedText} />
                </InputLeftElement>
                <Input 
                  placeholder="Search by code, customer, vehicle, or VIN..." 
                  value={searchTerm} 
                  onChange={handleSearchChange} 
                />
              </InputGroup>
              
              <HStack spacing={4} flex={1} justify={filterLayout === 'horizontal' ? 'flex-start' : 'stretch'}>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as WorkOrderStatus | 'ALL')}
                  maxW={{ base: '100%', md: '200px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value={WorkOrderStatus.IN_PROGRESS}>In Progress</option>
                  <option value={WorkOrderStatus.COMPLETED}>Completed</option>
                  <option value={WorkOrderStatus.PENDING}>Pending</option>
                  <option value={WorkOrderStatus.CANCELLED}>Cancelled</option>
                </Select>
                
                <HStack>
                  <Switch 
                    isChecked={historicalOnly} 
                    onChange={(event) => setHistoricalOnly(event.target.checked)} 
                    colorScheme="brand"
                  />
                  <Text fontSize="sm" color={mutedText} whiteSpace="nowrap">
                    Historical Only
                  </Text>
                </HStack>
              </HStack>

              {/* Active filters badge */}
              {(searchTerm || statusFilter !== 'ALL') && (
                <Badge colorScheme="brand" variant="subtle" px={2} py={1}>
                  {[searchTerm && 'Search', statusFilter !== 'ALL' && 'Status']
                    .filter(Boolean)
                    .join(' • ')}
                </Badge>
              )}
            </Stack>
          </CardBody>
        </Card>

        {/* Results Card */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={3}>
                <Icon as={MdReceipt} color={accentColor} boxSize={6} />
                <Text fontSize="xl" fontWeight="semibold">Work Order History</Text>
              </HStack>
              {!isLoading && (
                <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                  {history.length} {history.length === 1 ? 'order' : 'orders'}
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
                      <WorkOrderCardSkeleton key={index} />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Table variant={tableVariant}>
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
                      {Array.from({ length: 5 }).map((_, index) => (
                        <WorkOrderRowSkeleton key={index} />
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
                  <Text fontWeight="semibold">Unable to load work order history</Text>
                  <Text fontSize="sm" mt={1}>
                    {error instanceof Error ? error.message : 'Please check your connection and try again.'}
                  </Text>
                </Box>
                <Button 
                  size="sm" 
                  colorScheme="red" 
                  variant="outline" 
                  ml="auto"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !error && history.length === 0 && (
              <Box textAlign="center" py={12}>
                <Icon as={MdReceipt} boxSize={12} color={mutedText} mb={4} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  No work orders found
                </Text>
                <Text color={mutedText} mb={4}>
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search or filters to see more results.' 
                    : 'Completed work orders will appear here once marked as historical.'}
                </Text>
                {(searchTerm || statusFilter !== 'ALL') && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    leftIcon={<FiRefreshCcw />}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            )}

            {/* Results - Mobile Card View */}
            {!isLoading && !error && history.length > 0 && showMobileCards && (
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {history.map((order) => (
                  <WorkOrderCard key={order.id} order={order} />
                ))}
              </SimpleGrid>
            )}

            {/* Results - Desktop Table View */}
            {!isLoading && !error && history.length > 0 && !showMobileCards && (
              <Box overflowX="auto">
                <Table variant={tableVariant}>
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
                    {history.map((order) => (
                      <Tr 
                        key={order.id} 
                        _hover={{ bg: rowHoverBg }} 
                        cursor="pointer" 
                        onClick={() => openOrderDetail(order)}
                        transition="background 0.2s"
                      >
                        <Td fontWeight="medium" color={accentColor}>
                          {order.code}
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={statusColor[order.status]} 
                            variant="subtle"
                            fontSize="sm"
                          >
                            <HStack spacing={1}>
                              <Icon as={statusIcons[order.status]} boxSize={3} />
                              <Text>{order.status}</Text>
                            </HStack>
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Avatar 
                              size="xs" 
                              name={order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown'}
                              bg="brand.500"
                            />
                            <Text>
                              {order.customer
                                ? `${order.customer.firstName} ${order.customer.lastName}`
                                : 'Unassigned'}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontWeight="medium">
                            {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                          </Text>
                          <Text fontSize="sm" color={mutedText}>
                            {order.vehicle.licensePlate || 'No plate'}
                          </Text>
                        </Td>
                        <Td>
                          {formatDateShort(order.completedDate ?? order.updatedAt)}
                          <Text fontSize="sm" color={mutedText}>
                            {order.completedDate ? new Date(order.completedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </Text>
                        </Td>
                        <Td isNumeric fontWeight="bold">
                          {formatCurrency(Number(order.totalCost))}
                        </Td>
                        <Td textAlign="right">
                          <Tooltip label="Download invoice">
                            <IconButton
                              aria-label="Download invoice"
                              icon={<MdPrint />}
                              size="sm"
                              variant="ghost"
                              isLoading={downloadingInvoiceId === order.id}
                              isDisabled={downloadingInvoiceId !== null}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDownloadInvoice(order);
                              }}
                            />
                          </Tooltip>
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

      {/* Detail Drawer */}
      <Drawer 
        isOpen={detailDisclosure.isOpen} 
        placement="right" 
        size={drawerSize} 
        onClose={closeOrderDetail}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold">{detail?.code ?? 'Work Order'}</Text>
              {detail && (
                <Badge 
                  colorScheme={statusColor[detail.status]} 
                  variant="subtle"
                  fontSize="sm"
                >
                  <HStack spacing={1}>
                    <Icon as={statusIcons[detail.status]} boxSize={3} />
                    <Text>{detail.status}</Text>
                  </HStack>
                </Badge>
              )}
            </VStack>
          </DrawerHeader>
          <DrawerBody>
            {detailDisclosure.isOpen && detailQuery.isLoading ? (
              <Stack spacing={4}>
                <Skeleton height="20px" />
                <Skeleton height="20px" width="80%" />
                <Skeleton height="100px" />
              </Stack>
            ) : detail ? (
              <Stack spacing={6}>
                {/* Action Bar */}
                <Flex justify="flex-end">
                  <Button 
                    leftIcon={<MdPrint />} 
                    variant="outline" 
                    onClick={() => detail && handleDownloadInvoice(detail)}
                    size="sm"
                    isLoading={detail ? downloadingInvoiceId === detail.id : false}
                    isDisabled={downloadingInvoiceId !== null}
                    loadingText="Downloading..."
                  >
                    Download Invoice
                  </Button>
                </Flex>

                {/* Overview Section */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <HStack spacing={2}>
                      <Icon as={MdAssignment} color={accentColor} />
                      <Text fontWeight="semibold">Overview</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color={mutedText}>Status</Text>
                        <Text fontWeight="medium">{detail.status}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={mutedText}>Created</Text>
                        <Text>{formatDate(detail.createdAt)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={mutedText}>Arrival</Text>
                        <Text>{formatDate(detail.arrivalDate ?? detail.createdAt)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={mutedText}>Scheduled</Text>
                        <Text>{formatDate(detail.scheduledDate) || '—'}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={mutedText}>Completed</Text>
                        <Text>{formatDate(detail.completedDate) || '—'}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Customer & Vehicle Section */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <HStack spacing={2}>
                      <Icon as={FiUser} color={accentColor} />
                      <Text fontWeight="semibold">Customer & Vehicle</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color={mutedText} mb={2}>Customer Information</Text>
                        <VStack align="flex-start" spacing={1}>
                          <HStack spacing={2}>
                            <Avatar 
                              size="sm" 
                              name={`${detail.customer?.firstName} ${detail.customer?.lastName}`}
                              bg="brand.500"
                            />
                            <Text fontWeight="medium">
                              {detail.customer
                                ? `${detail.customer.firstName} ${detail.customer.lastName}`
                                : 'Unassigned'}
                            </Text>
                          </HStack>
                          {detail.customer?.phone && (
                            <Text fontSize="sm" color={mutedText}>
                              📞 {detail.customer.phone}
                            </Text>
                          )}
                          {detail.customer?.email && (
                            <Text fontSize="sm" color={mutedText}>
                              ✉️ {detail.customer.email}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={mutedText} mb={2}>Vehicle Information</Text>
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="medium">
                            {detail.vehicle.year} {detail.vehicle.make} {detail.vehicle.model}
                          </Text>
                          <Text fontSize="sm" color={mutedText}>VIN: {detail.vehicle.vin}</Text>
                          {detail.vehicle.licensePlate && (
                            <Text fontSize="sm" color={mutedText}>Plate: {detail.vehicle.licensePlate}</Text>
                          )}
                          {detail.vehicle.color && (
                            <Text fontSize="sm" color={mutedText}>Color: {detail.vehicle.color}</Text>
                          )}
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Financial Summary */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <HStack spacing={2}>
                      <Icon as={FiDollarSign} color={accentColor} />
                      <Text fontWeight="semibold">Financial Summary</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text>Labor Cost</Text>
                        <Text>{formatCurrency(Number(detail.laborCost))}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Parts Cost</Text>
                        <Text>{formatCurrency(Number(detail.partsCost))}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Taxes</Text>
                        <Text>{formatCurrency(Number(detail.taxes))}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Parking Charge</Text>
                        <Text>{formatCurrency(Number(detail.parkingCharge))}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Discount</Text>
                        <Text color={successColor}>-{formatCurrency(Number(detail.discount))}</Text>
                      </Flex>
                      <Divider />
                      <Flex justify="space-between" fontWeight="bold" fontSize="lg">
                        <Text>Total</Text>
                        <Text color={accentColor}>{formatCurrency(Number(detail.totalCost))}</Text>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Line Items */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <HStack spacing={2}>
                      <Icon as={MdReceipt} color={accentColor} />
                      <Text fontWeight="semibold">Line Items</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    {detail.lineItems.length === 0 ? (
                      <Text color={mutedText}>No line items recorded.</Text>
                    ) : (
                      <Box borderWidth="1px" borderRadius="lg" borderColor={borderColor} overflow="hidden">
                        <Table size="sm">
                          <Thead bg={headerBg}>
                            <Tr>
                              <Th>Description</Th>
                              <Th>Qty</Th>
                              <Th isNumeric>Unit Price</Th>
                              <Th isNumeric>Total</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {detail.lineItems.map((item) => (
                              <Tr key={item.id}>
                                <Td>{item.description}</Td>
                                <Td>{item.quantity}</Td>
                                <Td isNumeric>{formatCurrency(Number(item.unitPrice))}</Td>
                                <Td isNumeric fontWeight="medium">
                                  {formatCurrency(Number(item.lineTotal))}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </CardBody>
                </Card>

                {/* Assignments */}
                {detail.assignments.length > 0 && (
                  <Card variant="outline">
                    <CardHeader pb={3}>
                      <HStack spacing={2}>
                        <Icon as={FiUser} color={accentColor} />
                        <Text fontWeight="semibold">Assignments</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack align="stretch" spacing={3}>
                        {detail.assignments.map((assignment) => (
                          <Box key={assignment.id} borderWidth="1px" borderRadius="md" borderColor={borderColor} p={3}>
                            <HStack justify="space-between" mb={2}>
                              <Text fontWeight="semibold">{assignment.worker.name}</Text>
                              {assignment.role && (
                                <Badge colorScheme="blue" variant="subtle">
                                  {assignment.role}
                                </Badge>
                              )}
                            </HStack>
                            <VStack align="flex-start" spacing={1} color={mutedText}>
                              {assignment.notes && (
                                <Text fontSize="sm">Notes: {assignment.notes}</Text>
                              )}
                              <Text fontSize="sm">Services completed: {assignment.servicesCount}</Text>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Notes */}
                {detail.notes && (
                  <Card variant="outline">
                    <CardHeader pb={3}>
                      <HStack spacing={2}>
                        <Icon as={MdAssignment} color={accentColor} />
                        <Text fontWeight="semibold">Notes</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text>{detail.notes}</Text>
                    </CardBody>
                  </Card>
                )}
              </Stack>
            ) : (
              <Text color={mutedText}>Select a work order to view its details.</Text>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
};