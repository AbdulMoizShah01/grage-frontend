import { WorkOrder } from '../types/api';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api';
const INVOICE_PREFIX = 'IN/TAG/NEW';

export const buildInvoiceCode = (order: WorkOrder) => {
  const createdAt = order.createdAt ?? order.arrivalDate ?? new Date().toISOString();
  const year = new Date(createdAt).getFullYear();
  return `${INVOICE_PREFIX}/${year}-${String(order.id).padStart(4, '0')}`;
};

export const downloadInvoice = async (workOrderId: number, filename: string) => {
  const response = await fetch(`${apiBaseUrl}/work-orders/${workOrderId}/invoice`, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf'
    }
  });

  if (!response.ok) {
    throw new Error('Unable to generate invoice');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
