import { Spending, SpendingCategory } from './api';

export type SpendingInput = {
  category: SpendingCategory;
  amount: number;
  description?: string | null;
  incurredAt?: string;
};

export type SpendingUpdateInput = Partial<SpendingInput>;

export type CreateSpendingHandler = (payload: SpendingInput) => Promise<Spending>;
export type UpdateSpendingHandler = (params: { id: number; payload: SpendingUpdateInput }) => Promise<Spending>;
export type DeleteSpendingHandler = (id: number) => Promise<void>;
