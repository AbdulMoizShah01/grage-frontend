import { useApiQuery } from './useApiQuery';
import { DashboardSummary } from '../types/api';

export const useDashboardSummary = () => useApiQuery<DashboardSummary>(['dashboard', 'summary'], '/dashboard/summary');
