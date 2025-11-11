import {
  Alert,
  AlertIcon,
  Box,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack
} from '@chakra-ui/react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { AppShell } from '../components/shell/AppShell';
import { useInsights } from '../hooks/useInsights';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { StatCard } from '../components/cards/StatCard';
import { formatCurrency } from '../utils/formatting';

const chartColors = ['#1f6fe6', '#ff8a65', '#38a169', '#805ad5'];

export const InsightsPage = () => {
  const { data, isLoading, error } = useInsights();
  const { data: summary } = useDashboardSummary();
  const cardBg = useColorModeValue('surface.base', '#121212');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');

  return (
    <AppShell title="Insights" inventoryAlertsCount={summary?.inventoryAlertsCount}>
      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Unable to load insights.
        </Alert>
      ) : (
        <Stack spacing={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <StatCard label="Net Earned" value={formatCurrency(data.netEarned)} helperText="Completed orders - last 6 months" />
            <StatCard label="Net Expense" value={formatCurrency(data.netExpense)} helperText="Parts + workforce budget" />
            <StatCard label="Net Profit" value={formatCurrency(data.netProfit)} helperText="Earned minus expenses" />
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <StatCard label="Vehicles" value={data.vehicleCount} helperText="Total on record" />
            <StatCard label="Services Delivered" value={data.servicesSold} helperText="Line items sold" />
            <StatCard label="Parts Sold" value={data.partsSold} helperText="Line items sold" />
          </SimpleGrid>

          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
            <Text fontWeight="semibold" mb={2}>
              Revenue vs Expenses (last 6 months)
            </Text>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('#e2e8f0', '#2d3748')} />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#1f6fe6" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ff8a65" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
              <Text fontWeight="semibold" mb={2}>
                Work Orders by Status
              </Text>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.workOrdersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('#e2e8f0', '#2d3748')} />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#38a169" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
              <Text fontWeight="semibold" mb={2}>
                Expense Mix
              </Text>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Parts', value: data.partsExpense },
                      { name: 'Workforce', value: data.netExpense - data.partsExpense }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    label
                    outerRadius={90}
                  >
                    {[0, 1].map((index) => (
                      <Cell key={index} fill={chartColors[index]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </SimpleGrid>
        </Stack>
      )}
    </AppShell>
  );
};
