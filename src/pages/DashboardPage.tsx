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
  Flex,
  Card,
  CardBody,
  Progress,
  Icon,
  useBreakpointValue,
  Stack
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { 
  MdTrendingUp, 
  MdTrendingDown, 
  MdInventory, 
  MdPeople,
  MdDirectionsCar,
  MdAssignment,
  MdWarning,
  MdInfo
} from 'react-icons/md';

import { AppShell } from '../components/shell/AppShell';
import { StatCard } from '../components/cards/StatCard';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { formatCurrency } from '../utils/formatting';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboardSummary();
  
  // Responsive values
  const gridColumns = useBreakpointValue({ 
    base: 1, 
    sm: 2, 
    md: 4,
    lg: 4 
  });
  const financialGridColumns = useBreakpointValue({
    base: 1,
    sm: 2,
    md: 3,
    lg: 3
  });
  const mainLayout = useBreakpointValue({
    base: '1fr',
    lg: '2fr 1fr',
    xl: '3fr 1fr'
  });
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const successColor = useColorModeValue('green.600', 'green.300');
  const warningColor = useColorModeValue('orange.600', 'orange.300');
  const dangerColor = useColorModeValue('red.600', 'red.300');

  if (isLoading) {
    return (
      <AppShell title="Dashboard Overview">
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Dashboard Overview">
        <Alert status="error" borderRadius="lg" mb={6}>
          <AlertIcon />
          Failed to load dashboard data. Please try again.
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          colorScheme="blue"
        >
          Retry
        </Button>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Dashboard Overview">
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          No data available
        </Alert>
      </AppShell>
    );
  }

  // Calculate profit margin for visualization
  const profitMargin = data.financials?.netEarned > 0 
    ? (data.financials.netProfit / data.financials.netEarned) * 100 
    : 0;

  return (
    <AppShell
      title="Dashboard Overview"
      inventoryAlertsCount={data.inventoryAlertsCount}
      breadcrumbs={[]}
      actions={
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
          <Button 
            variant="outline" 
            onClick={() => navigate('/insights')}
            size={{ base: 'sm', md: 'md' }}
            leftIcon={<MdTrendingUp />}
          >
            View Insights
          </Button>
          <Button 
            onClick={() => navigate('/work-orders/history')}
            size={{ base: 'sm', md: 'md' }}
            leftIcon={<MdAssignment />}
          >
            Work Order History
          </Button>
        </Stack>
      }
    >
      <Grid templateColumns={mainLayout} gap={6}>
        {/* Main Content */}
        <GridItem>
          {/* Key Metrics */}
          <SimpleGrid columns={gridColumns} gap={4} mb={6}>
            <StatCard 
              label="Customers" 
              value={data.totals.customers}
              icon={MdPeople}
              trend={data.totals.customers > 0 ? 'up' : undefined}
              size="sm"
            />
            <StatCard 
              label="Vehicles" 
              value={data.totals.vehicles}
              icon={MdDirectionsCar}
              trend={data.totals.vehicles > 0 ? 'up' : undefined}
              size="sm"
            />
            <StatCard 
              label="Open Work Orders" 
              value={data.totals.openWorkOrders}
              icon={MdAssignment}
              colorScheme={data.totals.openWorkOrders > 5 ? 'orange' : 'blue'}
              size="sm"
            />
            <StatCard 
              label="Inventory Alerts" 
              value={data.inventoryAlertsCount}
              icon={MdInventory}
              colorScheme={data.inventoryAlertsCount > 0 ? 'red' : 'green'}
              helperText="At or below threshold"
              size="sm"
            />
          </SimpleGrid>

          {/* Financial Overview */}
          <Card bg={cardBg} border="1px" borderColor={borderColor} mb={6}>
            <CardBody>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Financial Overview (Last 6 Months)
              </Text>
              <SimpleGrid columns={financialGridColumns} gap={4} mb={4}>
                <Box>
                  <Text fontSize="sm" color={mutedText} mb={1}>Revenue</Text>
                  <Text fontSize="xl" fontWeight="bold" color={successColor}>
                    {formatCurrency(data.financials.netEarned)}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color={mutedText} mb={1}>Expenses</Text>
                  <Text fontSize="xl" fontWeight="bold" color={dangerColor}>
                    {formatCurrency(data.financials.netExpense)}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color={mutedText} mb={1}>Profit</Text>
                  <Text fontSize="xl" fontWeight="bold" color={profitMargin > 0 ? successColor : dangerColor}>
                    {formatCurrency(data.financials.netProfit)}
                  </Text>
                </Box>
              </SimpleGrid>
              {profitMargin !== 0 && (
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color={mutedText}>Profit Margin</Text>
                    <Text fontSize="sm" fontWeight="medium" color={profitMargin > 0 ? successColor : dangerColor}>
                      {profitMargin.toFixed(1)}%
                    </Text>
                  </Flex>
                  <Progress 
                    value={Math.abs(profitMargin)} 
                    colorScheme={profitMargin > 0 ? 'green' : 'red'}
                    size="sm"
                    borderRadius="full"
                  />
                </Box>
              )}
            </CardBody>
          </Card>

          {/* Recent Activity Section */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} mb={6}>
            {/* Recent Revenue */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="lg" fontWeight="semibold">
                    Revenue (Last 30 Days)
                  </Text>
                  <Icon as={MdTrendingUp} color={successColor} boxSize={5} />
                </Flex>
                <Text fontSize="3xl" fontWeight="bold" color={successColor} mb={2}>
                  {formatCurrency(data.revenueLast30Days)}
                </Text>
                <Text fontSize="sm" color={mutedText}>
                  Tracked from completed work orders
                </Text>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Text fontSize="lg" fontWeight="semibold" mb={4}>
                  Quick Actions
                </Text>
                <VStack align="stretch" spacing={3}>
                  <Button 
                    variant="outline" 
                    justifyContent="flex-start"
                    onClick={() => navigate('/work-orders')}
                    size="sm"
                  >
                    Create Work Order
                  </Button>
                  <Button 
                    variant="outline" 
                    justifyContent="flex-start"
                    onClick={() => navigate('/inventory')}
                    size="sm"
                  >
                    Manage Inventory
                  </Button>
                  <Button 
                    variant="outline" 
                    justifyContent="flex-start"
                    onClick={() => navigate('/workers')}
                    size="sm"
                  >
                    View Technicians
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Recent Completed Work Orders */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="semibold">
                  Recent Completed Work Orders
                </Text>
                <Badge colorScheme="green" variant="subtle">
                  {data.recentCompletedWorkOrders.length} completed
                </Badge>
              </Flex>
              
              {data.recentCompletedWorkOrders.length === 0 ? (
                <Alert status="info" borderRadius="md" variant="subtle">
                  <AlertIcon />
                  No work orders completed in the last 30 days.
                </Alert>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {data.recentCompletedWorkOrders.slice(0, 5).map((order) => (
                    <Flex 
                      key={order.id} 
                      justify="space-between" 
                      align="center"
                      p={3}
                      borderRadius="md"
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                      transition="background 0.2s"
                      cursor="pointer"
                      onClick={() => navigate(`/work-orders/${order.id}`)}
                    >
                      <VStack align="flex-start" spacing={1} flex={1}>
                        <Text fontWeight="medium" fontSize="sm">{order.code}</Text>
                        <Text fontSize="xs" color={mutedText}>
                          Completed {new Date(order.updatedAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <Badge colorScheme="green" fontSize="sm">
                        {formatCurrency(Number(order.totalCost))}
                      </Badge>
                    </Flex>
                  ))}
                  {data.recentCompletedWorkOrders.length > 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/work-orders/history')}
                      alignSelf="center"
                    >
                      View All ({data.recentCompletedWorkOrders.length})
                    </Button>
                  )}
                </VStack>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Sidebar Content */}
        <GridItem>
          <VStack align="stretch" spacing={6}>
            {/* Team Highlights */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Text fontSize="lg" fontWeight="semibold" mb={4}>
                  Team Highlights
                </Text>
                {data.topWorkers.length === 0 ? (
                  <Alert status="info" borderRadius="md" variant="subtle" fontSize="sm">
                    <AlertIcon />
                    No technician activity recorded yet.
                  </Alert>
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {data.topWorkers.slice(0, 3).map((worker, index) => (
                      <Box 
                        key={worker.id} 
                        p={3} 
                        borderRadius="md" 
                        borderWidth="1px" 
                        borderColor={borderColor}
                        bg={index === 0 ? useColorModeValue('yellow.50', 'yellow.900') : 'transparent'}
                      >
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontWeight="medium" fontSize="sm">{worker.name}</Text>
                          <Badge 
                            colorScheme={index === 0 ? 'yellow' : 'blue'} 
                            variant={index === 0 ? 'solid' : 'subtle'}
                            fontSize="xs"
                          >
                            {worker.totalJobs} jobs
                          </Badge>
                        </Flex>
                        <Text fontSize="xs" color={mutedText} mb={1}>
                          {worker.totalServices} services
                        </Text>
                        {worker.lastAssignment && (
                          <Text fontSize="xs" color={mutedText}>
                            Last: {worker.lastAssignment.workOrder.code}
                          </Text>
                        )}
                      </Box>
                    ))}
                    {data.topWorkers.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/workers')}
                      >
                        View All Technicians
                      </Button>
                    )}
                  </VStack>
                )}
              </CardBody>
            </Card>

            {/* Low Stock Inventory */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="lg" fontWeight="semibold">
                    Low Stock Inventory
                  </Text>
                  {data.lowStockItems.length > 0 && (
                    <Badge colorScheme="red" variant="solid">
                      {data.lowStockItems.length}
                    </Badge>
                  )}
                </Flex>
                
                {data.lowStockItems.length === 0 ? (
                  <Alert status="success" borderRadius="md" variant="subtle" fontSize="sm">
                    <AlertIcon />
                    All inventory levels are healthy.
                  </Alert>
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {data.lowStockItems.slice(0, 3).map((item) => (
                      <Box 
                        key={item.id} 
                        p={3} 
                        borderRadius="md" 
                        borderWidth="1px" 
                        borderColor="red.200"
                        bg={useColorModeValue('red.50', 'red.900')}
                      >
                        <Text fontWeight="medium" fontSize="sm" mb={1}>
                          {item.name}
                        </Text>
                        <Text fontSize="xs" color={mutedText} mb={1}>
                          SKU: {item.sku}
                        </Text>
                        <Flex align="center" fontSize="xs">
                          <Icon as={MdWarning} color="red.500" mr={1} />
                          <Text color="red.500" fontWeight="medium">
                            {item.quantityOnHand} in stock (Reorder at {item.reorderPoint})
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                    {data.lowStockItems.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/inventory')}
                        colorScheme="red"
                      >
                        View All ({data.lowStockItems.length})
                      </Button>
                    )}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
    </AppShell>
  );
};