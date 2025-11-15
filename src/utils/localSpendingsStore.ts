import { Spending } from '../types/api';
import { SpendingInput, SpendingUpdateInput } from '../types/spendings';

const STORAGE_KEY = 'grage-local-spendings';

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

let memoryStore: Spending[] = [];

const readStore = (): Spending[] => {
  if (hasBrowserStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Spending[]) : [];
    } catch (error) {
      console.warn('Unable to read spendings from localStorage', error);
      return [];
    }
  }

  return memoryStore;
};

const writeStore = (data: Spending[]) => {
  if (hasBrowserStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Unable to persist spendings to localStorage', error);
    }
  } else {
    memoryStore = data;
  }
};

const toSpending = (input: SpendingInput, overrides?: Partial<Spending>): Spending => {
  const now = new Date().toISOString();
  return {
    id: overrides?.id ?? Date.now(),
    category: input.category,
    amount: String(input.amount),
    description: input.description ?? null,
    incurredAt: input.incurredAt ?? now,
    createdAt: overrides?.createdAt ?? now,
    updatedAt: now,
    ...overrides
  };
};

export const getLocalSpendings = (): Spending[] => readStore();

export const addLocalSpending = (payload: SpendingInput): Spending => {
  const spending = toSpending(payload);
  const next = [...readStore(), spending];
  writeStore(next);
  return spending;
};

export const updateLocalSpending = (id: number, payload: SpendingUpdateInput): Spending => {
  const current = readStore();
  const index = current.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error('Spending not found');
  }

  const existing = current[index];
  const updated: Spending = {
    ...existing,
    category: payload.category ?? existing.category,
    amount: String(payload.amount ?? Number(existing.amount)),
    description: payload.description ?? existing.description ?? null,
    incurredAt: payload.incurredAt ?? existing.incurredAt,
    updatedAt: new Date().toISOString()
  };

  current[index] = updated;
  writeStore(current);
  return updated;
};

export const deleteLocalSpending = (id: number) => {
  const next = readStore().filter((item) => item.id !== id);
  writeStore(next);
};
