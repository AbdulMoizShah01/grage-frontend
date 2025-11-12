import {
  Alert,
  AlertIcon,
  Box,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  useBreakpointValue,
  Heading,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { AppShell } from '../components/shell/AppShell';
import { useInsights } from '../hooks/useInsights';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { StatCard } from '../components/cards/StatCard';
import { formatCurrency } from '../utils/formatting';

const chartColors = ['#3182CE', '#DD6B20', '#38A169', '#805AD5', '#D53F8C', '#319795'];

export const InsightsPage = () => {
  const { data, isLoading, error } = useInsights();
  const { data: summary } = useDashboardSummary();
  
  // Theme-aware colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400');
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  
  // Responsive values
  const chartHeight = useBreakpointValue({ base: 240, sm: 280, md: 320 });
  const smallChartHeight = useBreakpointValue({ base: 220, sm: 260, md: 280 });
  const gridColumns = useBreakpointValue({ base: 1, sm: 2, lg: 3 });
  const chartGridColumns = useBreakpointValue({ base: 1, lg: 2 });
  const spacing = useBreakpointValue({ base: 4, md: 6 });
  const padding = useBreakpointValue({ base: 3, md: 4, lg: 6 });
  const pieOuterRadius = useBreakpointValue({ base: 70, sm: 80, md: 90 });
  const pieInnerRadius = useBreakpointValue({ base: 40, sm: 50, md: 60 });

  if (isLoading) {
    return (
      <AppShell title="Insights" inventoryAlertsCount={summary?.inventoryAlertsCount}>
        <VStack justify="center" minH="400px" spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="3px" />
          <Text color={subtleTextColor}>Loading insights...</Text>
        </VStack>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Insights" inventoryAlertsCount={summary?.inventoryAlertsCount}>
        <Alert status="error" borderRadius="lg" variant="left-accent">
          <AlertIcon />
          Unable to load insights. Please try again later.
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell title="Insights" inventoryAlertsCount={summary?.inventoryAlertsCount}>
      <Stack spacing={spacing}>
        {/* Financial Overview Section */}
        <Box>
          <Heading size="md" mb={4} color={textColor}>
            Financial Overview
          </Heading>
          <SimpleGrid columns={gridColumns} spacing={4}>
            <StatCard 
              label="Net Earned" 
              value={formatCurrency(data.netEarned)} 
              helperText="Completed orders - last 6 months"
              colorScheme="blue"
            />
            <StatCard 
              label="Net Expense" 
              value={formatCurrency(data.netExpense)} 
              helperText="Parts + workforce budget"
              colorScheme="orange"
            />
            <StatCard 
              label="Net Profit" 
              value={formatCurrency(data.netProfit)} 
              helperText="Earned minus expenses"
              colorScheme={data.netProfit >= 0 ? "green" : "red"}
            />
          </SimpleGrid>
        </Box>

        {/* Business Metrics Section */}
        <Box>
          <Heading size="md" mb={4} color={textColor}>
            Business Metrics
          </Heading>
          <SimpleGrid columns={gridColumns} spacing={4}>
            <StatCard 
              label="Vehicles" 
              value={data.vehicleCount} 
              helperText="Total on record"
              colorScheme="green"
            />
            <StatCard 
              label="Services Delivered" 
              value={data.servicesSold} 
              helperText="Line items sold"
              colorScheme="purple"
            />
            <StatCard 
              label="Parts Sold" 
              value={data.partsSold} 
              helperText="Line items sold"
              colorScheme="red"
            />
          </SimpleGrid>
        </Box>

        {/* Revenue vs Expenses Chart */}
        <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
          <CardBody p={padding}>
            <VStack align="start" spacing={3}>
              <Heading size="sm" color={textColor}>
                Revenue vs Expenses (Last 6 Months)
              </Heading>
              <Box w="100%" h={chartHeight}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: subtleTextColor, fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: subtleTextColor, fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)} 
                    />
                    <ChartTooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      contentStyle={{
                        backgroundColor: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '8px',
                        color: textColor,
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue"
                      stroke={chartColors[0]} 
                      strokeWidth={3}
                      dot={{ fill: chartColors[0], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: chartColors[0], strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Expenses"
                      stroke={chartColors[1]} 
                      strokeWidth={3}
                      dot={{ fill: chartColors[1], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: chartColors[1], strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Charts Grid */}
        <SimpleGrid columns={chartGridColumns} spacing={4}>
          {/* Work Orders by Status */}
          <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
            <CardBody p={padding}>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color={textColor}>
                  Work Orders by Status
                </Heading>
                <Box w="100%" h={smallChartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.workOrdersByStatus} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis 
                        dataKey="status" 
                        tick={{ fill: subtleTextColor, fontSize: 12 }}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fill: subtleTextColor, fontSize: 12 }}
                      />
                      <ChartTooltip 
                        contentStyle={{
                          backgroundColor: cardBg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: '8px',
                          color: textColor,
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill={chartColors[2]} 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Expense Mix */}
          <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
            <CardBody p={padding}>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color={textColor}>
                  Expense Distribution
                </Heading>
                <Box w="100%" h={smallChartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Parts', value: data.partsExpense },
                          { name: 'Workforce', value: data.netExpense - data.partsExpense }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        labelLine={true}
                        outerRadius={pieOuterRadius}
                        innerRadius={pieInnerRadius}
                      >
                        {[0, 1].map((index) => (
                          <Cell key={index} fill={chartColors[index + 3]} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: cardBg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: '8px',
                          color: textColor,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Stack>
    </AppShell>
  );
};