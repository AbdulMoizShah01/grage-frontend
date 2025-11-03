import { Grid, GridItem, SimpleGrid, Box, Text, VStack, HStack, Badge, Spinner, Alert, AlertIcon, Button, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { AppShell } from '../components/shell/AppShell';
import { StatCard } from '../components/cards/StatCard';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { formatCurrency } from '../utils/formatting';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboardSummary();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const mutedText = useColorModeValue('gray.500', 'gray.400');

  return (
    <AppShell
      title="Dashboard Overview"
      inventoryAlertsCount={data?.inventoryAlertsCount}
      actions={
        <Button onClick={() => navigate('/work-orders/history')}>
          Work Order History
        </Button>
      }
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Failed to load dashboard data
        </Alert>
      ) : data ? (
        <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={6}>
          <GridItem>
            <SimpleGrid columns={{ base: 1, md: 4 }} gap={6} mb={6}>
              <StatCard label="Customers" value={data.totals.customers} />
              <StatCard label="Vehicles" value={data.totals.vehicles} />
              <StatCard label="Open Work Orders" value={data.totals.openWorkOrders} />
              <StatCard label="Inventory Alerts" value={data.inventoryAlertsCount} helperText="At or below threshold" />
            </SimpleGrid>

            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={6} mb={6}>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Revenue (Last 30 days)
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="brand.600">
                {formatCurrency(data.revenueLast30Days)}
              </Text>
            </Box>

            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={6}>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Recent Completed Work Orders
              </Text>
              <VStack align="stretch" spacing={4}>
                {data.recentCompletedWorkOrders.length === 0 ? (
                  <Text color={mutedText}>No work orders completed in the last 30 days.</Text>
                ) : (
                  data.recentCompletedWorkOrders.map((order) => (
                    <HStack key={order.id} justify="space-between">
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="medium">{order.code}</Text>
                        <Text fontSize="sm" color={mutedText}>
                          Completed {new Date(order.updatedAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <Badge colorScheme="green">{formatCurrency(Number(order.totalCost))}</Badge>
                    </HStack>
                  ))
                )}
              </VStack>
            </Box>
          </GridItem>

          <GridItem>
            <VStack align="stretch" spacing={6}>
              <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={6}>
                <Text fontSize="lg" fontWeight="semibold" mb={4}>
                  Team Highlights
                </Text>
                <VStack align="stretch" spacing={3}>
                  {data.topWorkers.length === 0 ? (
                    <Text color={mutedText}>No technician activity recorded yet.</Text>
                  ) : (
                    data.topWorkers.map((worker) => (
                      <Box key={worker.id} borderRadius="md" borderWidth="1px" borderColor="gray.200" p={3}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontWeight="medium">{worker.name}</Text>
                          <Badge colorScheme="brand">{worker.totalJobs} jobs</Badge>
                        </HStack>
                        <Text fontSize="sm" color={mutedText}>
                          {worker.totalServices} services delivered
                        </Text>
                        {worker.lastAssignment ? (
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            Last: {worker.lastAssignment.workOrder.code} on {new Date(worker.lastAssignment.createdAt).toLocaleDateString()}
                          </Text>
                        ) : null}
                      </Box>
                    ))
                  )}
                </VStack>
              </Box>

              <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={6}>
                <Text fontSize="lg" fontWeight="semibold" mb={4}>
                  Low Stock Inventory
                </Text>
                <VStack align="stretch" spacing={3}>
                  {data.lowStockItems.length === 0 ? (
                    <Text color={mutedText}>All inventory levels are healthy.</Text>
                  ) : (
                    data.lowStockItems.map((item) => (
                      <Box key={item.id} borderRadius="md" borderWidth="1px" borderColor="gray.200" p={3}>
                        <Text fontWeight="medium">{item.name}</Text>
                        <Text fontSize="sm" color={mutedText}>
                          SKU: {item.sku}
                        </Text>
                        <Text fontSize="sm" color="red.500">
                          {item.quantityOnHand} in stock (Reorder at {item.reorderPoint})
                        </Text>
                      </Box>
                    ))
                  )}
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      ) : null}
    </AppShell>
  );
};
