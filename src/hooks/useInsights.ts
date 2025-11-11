import { useApiQuery } from './useApiQuery';
import { InsightsSummary } from '../types/api';

export const useInsights = () => useApiQuery<InsightsSummary>(['insights', 'summary'], '/insights/summary');
