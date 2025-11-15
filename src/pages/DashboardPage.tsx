import { 
  Grid, 
  GridItem, 
  SimpleGrid, 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Badge, 
  Spinner, 
  Alert, 
  AlertIcon, 
  Button, 
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Icon,
  Stack,
  Progress,
  useBreakpointValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiTruck, 
  FiTool, 
  FiAlertTriangle, 
  FiDollarSign, 
  FiTrendingUp,
  FiCalendar,
  FiPackage
} from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { StatCard } from '../components/cards/StatCard';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { formatCurrency } from '../utils/formatting';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboardSummary();
  
  // Color values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const headerColor = useColorModeValue('gray.800', 'white');
  
  // Responsive values
  const mainGridTemplate = useBreakpointValue({ 
    base: '1fr', 
    lg: '2fr 1fr',
    xl: '3fr 1fr'
  });
  
  const statGridColumns = useBreakpointValue({ 
    base: 1, 
    sm: 2, 
    md: 4 
  });

  const sectionSpacing = useBreakpointValue({ 
    base: 4, 
    md: 6 
  });

  if (isLoading) {
    return (
      <AppShell title="Dashboard Overview">
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="3px" />
            <Text color={mutedText}>Loading dashboard data...</Text>
          </VStack>
        </Flex>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Dashboard Overview">
        <Alert status="error" borderRadius="lg" variant="left-accent">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Failed to load dashboard data</Text>
            <Text fontSize="sm" color={mutedText}>
              Please try refreshing the page
            </Text>
          </Box>
        </Alert>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Dashboard Overview">
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          No dashboard data available
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard Overview"
      inventoryAlertsCount={data.inventoryAlertsCount}
      actions={
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
          <Button 
            variant="outline" 
            onClick={() => navigate('/insights')}
            size={{ base: 'sm', md: 'md' }}
          >
            View Insights
          </Button>
          <Button 
            onClick={() => navigate('/work-orders/history')}
            size={{ base: 'sm', md: 'md' }}
            colorScheme="brand"
          >
            Work Order History
          </Button>
        </Stack>
      }
    >
      <Grid templateColumns={mainGridTemplate} gap={sectionSpacing}>
        {/* Main Content */}
        <GridItem>
          <VStack spacing={sectionSpacing} align="stretch">
            {/* Key Metrics */}
            <SimpleGrid columns={statGridColumns} gap={4}>
              <StatCard 
                label="Customers" 
                value={data.totals.customers}
                icon={FiUsers}
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard 
                label="Vehicles" 
                value={data.totals.vehicles}
                icon={FiTruck}
              />
              <StatCard 
                label="Open Work Orders" 
                value={data.totals.openWorkOrders}
                icon={FiTool}
                colorScheme="orange"
              />
              <StatCard 
                label="Inventory Alerts" 
                value={data.inventoryAlertsCount}
                icon={FiAlertTriangle}
                colorScheme="red"
                helperText="At or below threshold"
              />
            </SimpleGrid>

            {/* Financial Overview */}
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
              <StatCard 
                label="Net Earned (6 mo)" 
                value={formatCurrency(data.financials.netEarned)}
                icon={FiDollarSign}
                colorScheme="green"
              />
              <StatCard 
                label="Net Expense (6 mo)" 
                value={formatCurrency(data.financials.netExpense)}
                icon={FiDollarSign}
                colorScheme="red"
              />
              <StatCard 
                label="Net Profit (6 mo)" 
                value={formatCurrency(data.financials.netProfit)}
                icon={FiTrendingUp}
                colorScheme={data.financials.netProfit >= 0 ? 'green' : 'red'}
              />
              <StatCard 
                label="Spendings (6 mo)" 
                value={formatCurrency(data.financials.spendings)}
                icon={FiDollarSign}
                colorScheme="purple"
              />
            </SimpleGrid>

            {/* Revenue and Recent Activity */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={sectionSpacing}>
              {/* Revenue Card */}
              <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
                <CardHeader pb={3}>
                  <Flex align="center">
                    <Icon as={FiTrendingUp} color="brand.500" mr={2} />
                    <Text fontSize="lg" fontWeight="semibold" color={headerColor}>
                      Revenue (Last 30 days)
                    </Text>
                  </Flex>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.600" mb={2}>
                    {formatCurrency(data.revenueLast30Days)}
                  </Text>
                  <Progress 
                    value={75} 
                    size="sm" 
                    colorScheme="brand" 
                    borderRadius="full" 
                  />
                  <Text fontSize="sm" color={mutedText} mt={2}>
                    +15% from previous period
                  </Text>
                </CardBody>
              </Card>

              {/* Recent Completed Work Orders */}
              <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
                <CardHeader pb={3}>
                  <Flex align="center">
                    <Icon as={FiCalendar} color="green.500" mr={2} />
                    <Text fontSize="lg" fontWeight="semibold" color={headerColor}>
                      Recent Completed Work Orders
                    </Text>
                  </Flex>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={3} maxH="200px" overflowY="auto">
                    {data.recentCompletedWorkOrders.length === 0 ? (
                      <Text color={mutedText} fontSize="sm" textAlign="center" py={4}>
                        No work orders completed in the last 30 days.
                      </Text>
                    ) : (
                      data.recentCompletedWorkOrders.map((order) => (
                        <Flex 
                          key={order.id} 
                          justify="space-between" 
                          align="center"
                          p={3}
                          borderRadius="md"
                          bg={useColorModeValue('gray.50', 'gray.700')}
                        >
                          <Box flex={1}>
                            <Text fontWeight="medium" fontSize="sm">
                              {order.code}
                            </Text>
                            <Text fontSize="xs" color={mutedText}>
                              Completed {new Date(order.updatedAt).toLocaleDateString()}
                            </Text>
                          </Box>
                          <Badge colorScheme="green" fontSize="xs">
                            {formatCurrency(Number(order.totalCost))}
                          </Badge>
                        </Flex>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <VStack spacing={sectionSpacing} align="stretch">
            {/* Team Highlights */}
            <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
              <CardHeader pb={3}>
                <Flex align="center">
                  <Icon as={FiUsers} color="blue.500" mr={2} />
                  <Text fontSize="lg" fontWeight="semibold" color={headerColor}>
                    Team Highlights
                  </Text>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={3}>
                  {data.topWorkers.length === 0 ? (
                    <Text color={mutedText} fontSize="sm" textAlign="center" py={4}>
                      No technician activity recorded yet.
                    </Text>
                  ) : (
                    data.topWorkers.map((worker) => (
                      <Box 
                        key={worker.id} 
                        p={3} 
                        borderRadius="md"
                        border="1px"
                        borderColor={borderColor}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      >
                        <Flex justify="space-between" align="flex-start" mb={2}>
                          <Text fontWeight="medium" fontSize="sm">
                            {worker.name}
                          </Text>
                          <Badge colorScheme="blue" fontSize="xs">
                            {worker.totalJobs} jobs
                          </Badge>
                        </Flex>
                        <Text fontSize="sm" color={mutedText} mb={1}>
                          {worker.totalServices} services delivered
                        </Text>
                        {worker.lastAssignment && (
                          <Text fontSize="xs" color={mutedText}>
                            Last: {worker.lastAssignment.workOrder.code} on {' '}
                            {new Date(worker.lastAssignment.createdAt).toLocaleDateString()}
                          </Text>
                        )}
                      </Box>
                    ))
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Low Stock Inventory */}
            <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
              <CardHeader pb={3}>
                <Flex align="center">
                  <Icon as={FiPackage} color="red.500" mr={2} />
                  <Text fontSize="lg" fontWeight="semibold" color={headerColor}>
                    Low Stock Inventory
                  </Text>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={3}>
                  {data.lowStockItems.length === 0 ? (
                    <Text color={mutedText} fontSize="sm" textAlign="center" py={4}>
                      All inventory levels are healthy.
                    </Text>
                  ) : (
                    data.lowStockItems.map((item) => (
                      <Box 
                        key={item.id} 
                        p={3}
                        borderRadius="md"
                        border="1px"
                        borderColor="red.200"
                        bg="red.50"
                        _dark={{
                          borderColor: 'red.800',
                          bg: 'red.900/20'
                        }}
                      >
                        <Text fontWeight="medium" fontSize="sm" mb={1}>
                          {item.name}
                        </Text>
                        <Text fontSize="xs" color={mutedText} mb={1}>
                          SKU: {item.sku}
                        </Text>
                        <Flex align="center" justify="space-between">
                          <Text fontSize="sm" color="red.600" fontWeight="medium">
                            {item.quantityOnHand} in stock
                          </Text>
                          <Text fontSize="xs" color={mutedText}>
                            Reorder at {item.reorderPoint}
                          </Text>
                        </Flex>
                      </Box>
                    ))
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
    </AppShell>
  );
};