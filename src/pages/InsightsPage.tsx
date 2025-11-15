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
  HStack,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Heading,
  useBreakpointValue,
  Grid,
  GridItem,
  Icon,
  Tooltip,
  Progress,
  Badge,
  Button
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiPackage, 
  FiTool, 
  FiTruck,
  FiPieChart,
  FiBarChart2,
  FiInfo,
  FiClock,
  FiUsers
} from 'react-icons/fi';

import { AppShell } from '../components/shell/AppShell';
import { useInsights } from '../hooks/useInsights';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { StatCard } from '../components/cards/StatCard';
import { formatCurrency } from '../utils/formatting';

// Custom chart tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        bg={useColorModeValue('white', 'gray.800')}
        p={3}
        borderRadius="lg"
        border="1px"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
        boxShadow="lg"
      >
        <Text fontWeight="bold" mb={2}>
          {label}
        </Text>
        {payload.map((entry: any, index: number) => (
          <Text key={index} color={entry.color} fontSize="sm">
            {entry.name}: {formatCurrency(entry.value)}
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

// Custom pie chart label
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // Don't show label for small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12px"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const InsightsPage = () => {
  const { data, isLoading, error } = useInsights();
  const { data: summary } = useDashboardSummary();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  const chartTextColor = useColorModeValue('#374151', '#d1d5db');
  
  const chartColors = [
    '#1f6fe6', // Brand blue
    '#ff8a65', // Orange
    '#38a169', // Green
    '#805ad5', // Purple
    '#dd6b20', // Amber
    '#e53e3e', // Red
  ];

  const workforceExpense =
    data && !error ? Math.max(data.netExpense - data.partsExpense - data.spendingsTotal, 0) : 0;
  
  const expenseSlices =
    data && !error
      ? [
          { name: 'Parts', value: data.partsExpense },
          { name: 'Workforce', value: workforceExpense },
          { name: 'Spendings', value: data.spendingsTotal }
        ].filter(item => item.value > 0)
      : [];

  // Calculate key metrics
  const profitMargin = data ? (data.netProfit / data.netEarned) * 100 : 0;
  const revenueGrowth = data?.revenueGrowth || 0;
  const expenseGrowth = data?.expenseGrowth || 0;
  const avgOrderValue = data?.avgOrderValue || 0;
  const completionRate = data?.completionRate || 0;
  const customerSatisfaction = data?.customerSatisfaction || 0;

  // Calculate efficiency metrics
  const revenuePerService = data?.servicesSold ? data.netEarned / data.servicesSold : 0;
  const expensePerVehicle = data?.vehicleCount ? data.netExpense / data.vehicleCount : 0;

  // Responsive values
  const mainGridColumns = useBreakpointValue({ base: 1, lg: 2, xl: 3 });
  const chartGridColumns = useBreakpointValue({ base: 1, lg: 2 });
  const chartHeight = useBreakpointValue({ base: 300, md: 350, lg: 400 });

  if (isLoading) {
    return (
      <AppShell title="Insights" inventoryAlertsCount={summary?.inventoryAlertsCount}>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="3px" />
            <Text color={mutedText}>Loading insights data...</Text>
          </VStack>
        </Flex>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Insights" inventoryAlertsCount={summary?.inventoryAlertsCount}>
        <Alert status="error" borderRadius="lg" variant="left-accent">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Unable to load insights</Text>
            <Text fontSize="sm" color={mutedText}>
              Please try refreshing the page or check your connection
            </Text>
          </Box>
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="Business Insights" 
      inventoryAlertsCount={summary?.inventoryAlertsCount}
      actions={
        <HStack spacing={3}>
          <Tooltip label="Export detailed reports">
            <Box>
              <Button variant="outline" size="sm">
                Export Report
              </Button>
            </Box>
          </Tooltip>
        </HStack>
      }
    >
      <Stack spacing={6}>
        {/* Key Financial Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
          <StatCard 
            label="Net Earned" 
            value={formatCurrency(data.netEarned)} 
            helperText="Completed orders - last 6 months"
            icon={FiDollarSign}
            colorScheme="green"
            trend={data.revenueGrowth ? { value: data.revenueGrowth, isPositive: data.revenueGrowth >= 0 } : undefined}
          />
          <StatCard 
            label="Net Expense" 
            value={formatCurrency(data.netExpense)} 
            helperText="Parts + workforce budget"
            icon={FiTrendingDown}
            colorScheme="red"
            trend={data.expenseGrowth ? { value: data.expenseGrowth, isPositive: data.expenseGrowth <= 0 } : undefined}
          />
          <StatCard 
            label="Net Profit" 
            value={formatCurrency(data.netProfit)} 
            helperText="Earned minus expenses"
            icon={FiTrendingUp}
            colorScheme={data.netProfit >= 0 ? 'green' : 'red'}
          
          />
          <StatCard 
            label="Spendings" 
            value={formatCurrency(data.spendingsTotal)} 
            helperText="Operational expenses (6 mo)"
            icon={FiPieChart}
            colorScheme="purple"
          />
        </SimpleGrid>

        {/* Secondary Metrics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <StatCard 
            label="Vehicles" 
            value={data.vehicleCount} 
            helperText="Total on record"
            icon={FiTruck}
            colorScheme="blue"
          />
          <StatCard 
            label="Services Delivered" 
            value={data.servicesSold} 
            helperText="Line items sold"
            icon={FiTool}
            colorScheme="orange"
          />
          <StatCard 
            label="Parts Sold" 
            value={data.partsSold} 
            helperText="Line items sold"
            icon={FiPackage}
            colorScheme="brand"
          />
        </SimpleGrid>

        {/* Profit Margin Indicator */}
        <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <HStack>
                  <Icon as={FiTrendingUp} color={profitMargin >= 0 ? 'green.500' : 'red.500'} />
                  <Text fontWeight="semibold">Profit Margin</Text>
                </HStack>
                <Badge colorScheme={profitMargin >= 0 ? 'green' : 'red'} fontSize="sm">
                  {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                </Badge>
              </Flex>
              <Progress 
                value={Math.abs(profitMargin)} 
                colorScheme={profitMargin >= 0 ? 'green' : 'red'}
                size="lg"
                borderRadius="full"
              />
              <Text fontSize="sm" color={mutedText} textAlign="center">
                {profitMargin >= 0 ? 'Profitable' : 'Loss'} based on net earned vs expenses
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Main Charts Section */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          <GridItem>
            <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
              <CardHeader pb={4}>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FiBarChart2} color="brand.500" />
                    <Heading size="md">Revenue vs Expenses</Heading>
                  </HStack>
                  <Text fontSize="sm" color={mutedText}>
                    Last 6 months
                  </Text>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <AreaChart data={data.monthlyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1f6fe6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1f6fe6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff8a65" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff8a65" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: chartTextColor }}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fill: chartTextColor }}
                      fontSize={12}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#1f6fe6" 
                      fillOpacity={1}
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ff8a65" 
                      fillOpacity={1}
                      fill="url(#colorExpenses)" 
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
              <CardHeader pb={4}>
                <HStack>
                  <Icon as={FiPieChart} color="brand.500" />
                  <Heading size="md">Expense Mix</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <PieChart>
                    <Pie
                      data={expenseSlices}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {expenseSlices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Bottom Charts Row */}
        <SimpleGrid columns={chartGridColumns} spacing={6}>
          <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
            <CardHeader pb={4}>
              <HStack>
                <Icon as={FiBarChart2} color="brand.500" />
                <Heading size="md">Work Orders by Status</Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.workOrdersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fill: chartTextColor }}
                    fontSize={12}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: chartTextColor }}
                    fontSize={12}
                  />
                  <ChartTooltip />
                  <Bar 
                    dataKey="count" 
                    fill="#38a169" 
                    radius={[4, 4, 0, 0]}
                    name="Work Orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Business Efficiency Metrics */}
          <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
            <CardHeader pb={4}>
              <HStack>
                <Icon as={FiTrendingUp} color="brand.500" />
                <Heading size="md">Business Efficiency</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Average Order Value */}
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium">Avg Order Value</Text>
                      <Tooltip label="Average revenue per completed work order">
                        <Box>
                          <Icon as={FiInfo} color={mutedText} boxSize={3} />
                        </Box>
                      </Tooltip>
                    </HStack>
                    <Text fontSize="sm" color="blue.500" fontWeight="bold">
                      {formatCurrency(avgOrderValue)}
                    </Text>
                  </Flex>
                  <Progress 
                    value={Math.min((avgOrderValue / 1000) * 100, 100)} 
                    colorScheme="blue" 
                    size="sm" 
                    borderRadius="full" 
                  />
                </Box>
                
                {/* Completion Rate */}
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium">Completion Rate</Text>
                      <Tooltip label="Percentage of work orders completed on time">
                        <Box>
                          <Icon as={FiInfo} color={mutedText} boxSize={3} />
                        </Box>
                      </Tooltip>
                    </HStack>
                    <Text fontSize="sm" color="green.500" fontWeight="bold">
                      {completionRate.toFixed(1)}%
                    </Text>
                  </Flex>
                  <Progress value={completionRate} colorScheme="green" size="sm" borderRadius="full" />
                </Box>
                
                {/* Revenue per Service */}
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium">Revenue per Service</Text>
                      <Tooltip label="Average revenue generated per service line item">
                        <Box>
                          <Icon as={FiInfo} color={mutedText} boxSize={3} />
                        </Box>
                      </Tooltip>
                    </HStack>
                    <Text fontSize="sm" color="purple.500" fontWeight="bold">
                      {formatCurrency(revenuePerService)}
                    </Text>
                  </Flex>
                  <Progress 
                    value={Math.min((revenuePerService / 500) * 100, 100)} 
                    colorScheme="purple" 
                    size="sm" 
                    borderRadius="full" 
                  />
                </Box>

                {/* Customer Satisfaction */}
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium">Customer Satisfaction</Text>
                      <Tooltip label="Based on customer feedback and ratings">
                        <Box>
                          <Icon as={FiInfo} color={mutedText} boxSize={3} />
                        </Box>
                      </Tooltip>
                    </HStack>
                    <Text fontSize="sm" color="orange.500" fontWeight="bold">
                      {customerSatisfaction.toFixed(1)}/5
                    </Text>
                  </Flex>
                  <Progress 
                    value={(customerSatisfaction / 5) * 100} 
                    colorScheme="orange" 
                    size="sm" 
                    borderRadius="full" 
                  />
                </Box>

                {/* Key Insight */}
                <Box pt={2}>
                  <Text fontSize="sm" color={mutedText}>
                    <strong>Insight:</strong> {profitMargin >= 15 ? 'Strong profitability with efficient operations.' : profitMargin >= 5 ? 'Moderate profitability with room for improvement.' : 'Focus on reducing expenses and increasing revenue.'}
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Stack>
    </AppShell>
  );
};